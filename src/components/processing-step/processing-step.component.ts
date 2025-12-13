import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-processing-step',
  templateUrl: './processing-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class ProcessingStepComponent implements OnInit {
  videoFile = input.required<File>();
  sourceLanguage = input.required<string>();
  targetLanguage = input.required<string>();
  processingComplete = output<string>();

  private http = inject(HttpClient);

  statusMessages = [
    'Initializing workflow...',
    'Uploading video...',
    'Extracting audio track...',
    'Segmenting audio for timestamps...',
    'Transcribing speech to text...',
    'Translating text to target language...',
    'Generating new speech from translated text...',
    'Synchronizing translated audio with video...',
    'Merging audio and video streams...',
    'Finalizing translated video...',
  ];

  currentStatus = signal(this.statusMessages[0]);
  progress = signal(0);
  
  private currentIndex = 0;

  ngOnInit(): void {
    this.startProcessing();
  }

  startProcessing(): void {
    const formData = new FormData();
    formData.append('file', this.videoFile());
    formData.append('source_language', this.sourceLanguage());
    formData.append('target_language', this.targetLanguage());

    // Start fake progress simulation
    this.simulateProgress();

    const apiBase = (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
    this.http.post<{ status: string, video_url: string }>(`${apiBase}/process-video`, formData)
      .subscribe({
        next: (response) => {
          this.progress.set(100);
          this.currentStatus.set('Processing complete!');
          this.processingComplete.emit(response.video_url);
        },
        error: (error) => {
          console.error('Processing error:', error);
          this.currentStatus.set('Error processing video. Please ensure backend is running.');
          this.progress.set(0);
        }
      });
  }

  simulateProgress(): void {
    const interval = setInterval(() => {
      this.currentIndex++;
      if (this.currentIndex < this.statusMessages.length) {
        this.currentStatus.set(this.statusMessages[this.currentIndex]);
        const newProgress = Math.round((this.currentIndex / (this.statusMessages.length)) * 90); // Max 90%
        this.progress.set(newProgress);
      } else {
        clearInterval(interval);
      }
    }, 3000); // 3 seconds per step, adjusts to ~30s total.
  }
}
