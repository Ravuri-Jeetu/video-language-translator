import os
import shutil
import uuid
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import moviepy.editor as mp
import whisper
from deep_translator import GoogleTranslator
from gtts import gTTS
import tempfile
import asyncio

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
UPLOAD_DIR = "uploads"
PROCESSED_DIR = "processed"
TEMP_DIR = "temp"

for d in [UPLOAD_DIR, PROCESSED_DIR, TEMP_DIR]:
    os.makedirs(d, exist_ok=True)

# Mount processed directory to serve files
app.mount("/processed", StaticFiles(directory=PROCESSED_DIR), name="processed")

# Global model loading (lazy loading recommended for startup speed)
model = None

def get_model():
    global model
    if model is None:
        print("Loading Whisper model...")
        model = whisper.load_model("base")
    return model

@app.get("/")
def read_root():
    return {"message": "Video Language Translator API is running"}

@app.post("/process-video")
async def process_video(
    file: UploadFile = File(...),
    source_language: str = Form(...),
    target_language: str = Form(...),
    request: Request = None,
):
    try:
        # 1. Receive video
        file_id = str(uuid.uuid4())
        input_filename = f"{file_id}_{file.filename}"
        input_path = os.path.join(UPLOAD_DIR, input_filename)
        
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"Video received: {input_path}")

        # Start processing in background or blocking?
        # For simplicity and to return the result url directly as requested by the flow,
        # we will do it blocking (might timeout on large videos, but okay for demo).
        # Ideally, use background tasks and websockets.
        
        output_filename = f"translated_{file_id}.mp4"
        output_path = os.path.join(PROCESSED_DIR, output_filename)
        
        # Call the processing logic
        await asyncio.to_thread(
            process_video_logic, 
            input_path, 
            output_path, 
            source_language, 
            target_language
        )
        
        # Return the absolute URL based on request
        base = str(request.base_url) if request else "http://localhost:8000/"
        if not base.endswith("/"):
            base += "/"
        video_url = f"{base}processed/{output_filename}"
        
        return {"status": "success", "video_url": video_url}

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def process_video_logic(input_path, output_path, source_lang, target_lang):
    try:
        print("Starting processing logic...")
        
        # 2. Extract audio from video
        video = mp.VideoFileClip(input_path)
        audio_path = os.path.join(TEMP_DIR, f"{os.path.basename(input_path)}.wav")
        video.audio.write_audiofile(audio_path)
        
        # 3. Audio to Text (STT) with timestamps
        print("Transcribing audio...")
        whisper_model = get_model()
        result = whisper_model.transcribe(audio_path)
        segments = result["segments"] # List of {start, end, text, ...}
        
        # 4. Translate Text
        print(f"Translating to {target_lang}...")
        translator = GoogleTranslator(source='auto', target=target_lang)
        
        translated_segments = []
        for segment in segments:
            text = segment["text"]
            translated_text = translator.translate(text)
            translated_segments.append({
                "start": segment["start"],
                "end": segment["end"],
                "text": translated_text
            })
            
        # 5. Convert translated text to audio (TTS) and 6. Match with video
        print("Generating TTS and syncing...")
        final_audio_clips = []
        
        # Generate silence to fill gaps
        # We need to construct the full audio track
        
        current_time = 0
        
        epsilon = 0.05
        for segment in translated_segments:
            start_time = segment["start"]
            end_time = segment["end"]
            duration = end_time - start_time
            text = segment["text"]
            
            # Add silence if there is a gap before this segment
            if start_time > current_time:
                gap_duration = start_time - current_time
                silence = mp.AudioClip(lambda t: [0, 0], duration=gap_duration) 
                # Note: creating silence with AudioClip might be tricky with fps.
                # Easier: use a silent audio file or just append empty time.
                # Alternative: mp.AudioArrayClip
                # Let's try to just use valid audio clips.
                # A trick for silence: create a silent audio segment using numpy
                # or just skip.
                # Actually, composite audio clips allows positioning.
                pass

            # Generate TTS for this segment
            tts_filename = os.path.join(TEMP_DIR, f"{uuid.uuid4()}.mp3")
            tts = gTTS(text=text, lang=target_lang, slow=False)
            tts.save(tts_filename)
            
            audio_clip_mp3 = mp.AudioFileClip(tts_filename)
            # Convert MP3 to WAV to avoid mp3 time rounding issues
            wav_filename = os.path.join(TEMP_DIR, f"{uuid.uuid4()}.wav")
            audio_clip_mp3.write_audiofile(wav_filename, fps=44100)
            audio_clip_mp3.close()
            audio_clip = mp.AudioFileClip(wav_filename)
            
            # Speed control to fit the segment duration
            # If TTS is longer than original segment, speed it up
            # Trim audio if it's longer than the segment duration
            end_limit = duration - epsilon if duration > epsilon else duration
            if audio_clip.duration > end_limit:
                final_clip = audio_clip.subclip(0, end_limit)
            else:
                final_clip = audio_clip

            # Position the clip at the segment start time and clamp its end
            final_clip = final_clip.set_start(start_time)
            final_clip = final_clip.set_end(start_time + (final_clip.duration or end_limit))
                
            final_audio_clips.append(final_clip)
            current_time = end_time

        # Create Composite Audio
        # We also need the background audio? Usually dubbing replaces voice but keeps music.
        # Separating voice/music is hard without complex models (spleeter).
        # Requirement 6 says "audio file is then matched...".
        # We will REPLACE the audio track with the new TTS track.
        
        if final_audio_clips:
            final_audio = mp.CompositeAudioClip(final_audio_clips)
            # Ensure audio duration matches video
            final_audio = final_audio.set_duration(video.duration)
            
            final_video = video.set_audio(final_audio)
            final_video.write_videofile(output_path, codec="libx264", audio_codec="aac")
        else:
            # No speech detected? Just copy video
            shutil.copy(input_path, output_path)

        print("Processing complete.")
        
        # Cleanup temp files
        video.close()
        if os.path.exists(audio_path):
            os.remove(audio_path)
        # remove tts files? (optional)

    except Exception as e:
        print(f"Error in logic: {e}")
        raise e
