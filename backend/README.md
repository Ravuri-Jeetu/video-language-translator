# Video Translator Backend

This is the backend for the Video Language Translator application.

## Prerequisites

- Python 3.8+
- FFmpeg installed and added to system PATH.

## Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```

2.  Create a virtual environment (optional but recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Running the Server

Run the server using `uvicorn`:

```bash
uvicorn main:app --reload
```

The server will start at `http://localhost:8000`.

## API Endpoints

-   `POST /process-video`: Upload a video file, source language, and target language. Returns the URL of the processed video.
