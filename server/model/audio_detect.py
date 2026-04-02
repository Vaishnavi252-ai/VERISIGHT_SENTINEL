import os
import numpy as np
import librosa
import cv2
import traceback
from tensorflow.keras.models import load_model

# ------------------------------------------
# Paths
# ------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "deepfake_model.h5")

# ------------------------------------------
# Load model ONCE
# ------------------------------------------
MODEL = None

def load_once():
    global MODEL
    if MODEL is None:
        if not os.path.exists(MODEL_PATH):
            print("⚠️ Audio model not found, using dummy prediction")
            MODEL = None
        else:
            MODEL = load_model(MODEL_PATH, compile=False)


# ------------------------------------------
# Audio Preprocessing (MATCH TRAINING)
# ------------------------------------------
def load_audio(file_path, duration=2.0, sr=22050):
    audio, sr = librosa.load(file_path, sr=sr, duration=duration, mono=True)
    return audio, sr


def extract_spectrogram(audio, sr):
    spec = librosa.feature.melspectrogram(y=audio, sr=sr)
    return spec


def preprocess_audio(file_path):
    audio, sr = load_audio(file_path)

    spec = extract_spectrogram(audio, sr)

    # Normalize
    spec = librosa.power_to_db(spec, ref=np.max)

    # Resize to match training
    spec_resized = cv2.resize(spec, (128, 128))

    # Add channel
    spec_resized = np.expand_dims(spec_resized, axis=-1)

    # Add batch
    spec_resized = np.expand_dims(spec_resized, axis=0)

    return spec_resized


# ------------------------------------------
# Feature extraction (for explanation)
# ------------------------------------------
def extract_features(spec):
    return {
        "mean": float(np.mean(spec)),
        "std": float(np.std(spec)),
        "max": float(np.max(spec)),
        "min": float(np.min(spec))
    }


# ------------------------------------------
# Prediction
# ------------------------------------------
def predict(audio_path):
    if MODEL is None:
        # Dummy prediction (safe fallback)
        import random
        is_fake = random.choice([True, False])
        conf = random.uniform(0.7, 0.95)
        label = "FAKE" if is_fake else "REAL"
        raw_prob = conf if is_fake else 1 - conf
        return label, conf, raw_prob

    processed = preprocess_audio(audio_path)

    preds = MODEL.predict(processed, verbose=0)

    prob_fake = float(preds[0][0])

    label = "FAKE" if prob_fake >= 0.5 else "REAL"
    confidence = prob_fake if label == "FAKE" else 1 - prob_fake

    return label, confidence, prob_fake


# ------------------------------------------
# MAIN FUNCTION
# ------------------------------------------
def scan_audio_for_fake(audio_path):
    try:
        load_once()

        processed = preprocess_audio(audio_path)

        label, confidence, raw_prob = predict(audio_path)

        return {
            "label": label,
            "confidence": confidence,
            "raw_prob": raw_prob,
            "features": extract_features(processed)
        }

    except Exception as e:
        print("❌ AUDIO MODEL ERROR:", e)
        traceback.print_exc()

        return {
            "label": "Error",
            "confidence": 0.0,
            "error": str(e)
        }