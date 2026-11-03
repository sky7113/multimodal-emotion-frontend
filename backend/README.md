# Backend - Multimodal Emotion Recognition Engine

FastAPI-powered asynchronous backend implementing the Level 2 Emotion Recognition Pipeline.

## Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI application & /api/analyze router
│   ├── config.py        # Environment settings & device selection
│   ├── schemas.py       # Pydantic models for request & response validation
│   ├── fusion.py        # Class-Aware Evidence Fusion engine & conflict detection
│   └── models/
│       ├── __init__.py
│       ├── face_model.py   # trpakov/vit-face-expression handler
│       ├── text_model.py   # j-hartmann/emotion-english-distilroberta-base handler
│       └── audio_model.py  # speechbrain/emotion-recognition-wav2vec2-IEMOCAP handler
├── test_fusion.py       # Automated unit test verifying class-aware non-penalization
├── requirements.txt     # Python dependencies
├── .env.example         # Environment template
└── README.md
```

## Running the Unit Tests

Test the fusion logic without downloading models:

```bash
python test_fusion.py
```

## Environment Configuration

| Variable | Default | Description |
|---|---|---|
| `HOST` | `0.0.0.0` | Bind address |
| `PORT` | `8000` | Port |
| `MOCK_INFERENCE` | `false` | When `true`, returns mock predictions without loading weights |
| `FACE_MODEL_ID` | `trpakov/vit-face-expression` | Hugging Face model for face |
| `TEXT_MODEL_ID` | `j-hartmann/emotion-english-distilroberta-base` | HF model for text |
| `AUDIO_MODEL_ID` | `speechbrain/emotion-recognition-wav2vec2-IEMOCAP` | SpeechBrain checkpoint |

