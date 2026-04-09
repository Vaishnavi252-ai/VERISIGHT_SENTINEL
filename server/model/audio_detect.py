import json
import os
import numpy as np
import librosa
import traceback
from tensorflow.keras.models import load_model
from tensorflow.keras import mixed_precision
import sys

# ------------------------------------------
# Paths and constants
# ------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "res2net_model.keras")
LABELS_PATH = os.path.join(BASE_DIR, "class_mapping.json")
MODEL = None
CLASS_LABELS = ["FAKE", "REAL"]
SAMPLE_RATE = 22050
DURATION = 5.0
N_MFCC = 40

def load_labels():
    global CLASS_LABELS
    if os.path.exists(LABELS_PATH):
        try:
            with open(LABELS_PATH, "r", encoding="utf-8") as f:
                mapping = json.load(f)
            inverted = [label for label, _ in sorted(mapping.items(), key=lambda kv: kv[1])]
            CLASS_LABELS = [lbl.upper() for lbl in inverted]
        except Exception as exc:
            print("⚠️ Failed to load label mapping:", exc)


def load_once():
    global MODEL
    if MODEL is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Audio model not found at {MODEL_PATH}")
        mixed_precision.set_global_policy("mixed_float16")
        MODEL = load_model(MODEL_PATH, compile=False)
        load_labels()
        print(f"✅ Loaded audio model from {MODEL_PATH}", flush=True)
        print(f"DEBUG: Model input shape: {MODEL.input_shape}", flush=True)
        print(f"DEBUG: Model output shape: {MODEL.output_shape}", flush=True)


# ------------------------------------------
# Audio Preprocessing (MATCH TRAINING)
# ------------------------------------------
def load_audio(file_path):
    audio, sr = librosa.load(file_path, sr=SAMPLE_RATE, duration=DURATION, mono=True)
    if audio is None or len(audio) == 0:
        raise ValueError("Could not load audio or audio file is empty")
    return audio, sr


def extract_mfcc(audio, sr):
    return librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=N_MFCC)


def pad_mfcc(mfcc, target_length):
    if mfcc.shape[1] < target_length:
        pad_width = target_length - mfcc.shape[1]
        return np.pad(mfcc, ((0, 0), (0, pad_width)), mode="constant")
    return mfcc[:, :target_length]


def get_target_length():
    if MODEL is None or MODEL.input_shape is None:
        raise ValueError("Model is not loaded; cannot infer input shape")
    if len(MODEL.input_shape) != 4:
        raise ValueError(f"Unexpected model input shape: {MODEL.input_shape}")
    return MODEL.input_shape[2]


def preprocess_audio(file_path):
    audio, sr = load_audio(file_path)
    print(f"DEBUG: Loaded audio shape: {audio.shape}, sr: {sr}", flush=True)
    mfcc = extract_mfcc(audio, sr)
    print(f"DEBUG: MFCC shape: {mfcc.shape}", flush=True)
    if np.any(np.isnan(mfcc)) or np.any(np.isinf(mfcc)):
        print(f"DEBUG: NaN or Inf in MFCC: {mfcc}", flush=True)
        raise ValueError("MFCC extraction resulted in NaN or Inf values")
    target_length = get_target_length()
    print(f"DEBUG: Target length: {target_length}", flush=True)
    mfcc = pad_mfcc(mfcc, target_length)
    print(f"DEBUG: Padded MFCC shape: {mfcc.shape}", flush=True)
    mfcc = mfcc.astype(np.float16)  # Use float16 for mixed precision
    print(f"DEBUG: Converted to float16, shape: {mfcc.shape}", flush=True)
    if np.any(np.isnan(mfcc)) or np.any(np.isinf(mfcc)):
        print(f"DEBUG: NaN or Inf after padding: {mfcc}", flush=True)
        raise ValueError("MFCC padding resulted in NaN or Inf values")
    mfcc = np.expand_dims(mfcc, axis=-1)
    mfcc = np.expand_dims(mfcc, axis=0)
    print(f"DEBUG: Final input shape: {mfcc.shape}", flush=True)
    return mfcc


# ------------------------------------------
# Feature extraction (for explanation)
# ------------------------------------------
def extract_features(mfcc_tensor):
    feature_array = np.squeeze(mfcc_tensor).astype(np.float32)
    return {
        "shape": list(feature_array.shape),
        "mean": float(np.mean(feature_array)),
        "std": float(np.std(feature_array)),
        "max": float(np.max(feature_array)),
        "min": float(np.min(feature_array))
    }


# ------------------------------------------
# Prediction
# ------------------------------------------
def predict(audio_path):
    if MODEL is None:
        raise RuntimeError("Audio model is not loaded")

    processed = preprocess_audio(audio_path)
    print(f"DEBUG: Processed input shape: {processed.shape}", flush=True)
    preds = MODEL.predict(processed, verbose=0)
    print(f"DEBUG: Raw preds: {preds}", flush=True)
    preds = np.asarray(preds, dtype=np.float32)
    print(f"DEBUG: Converted preds: {preds}", flush=True)
    if np.any(np.isnan(preds)) or np.any(np.isinf(preds)):
        print(f"DEBUG: NaN or Inf detected in preds: {preds}", flush=True)
        raise ValueError("Model prediction resulted in NaN or Inf values")
    best_index = int(np.argmax(preds[0]))
    label = CLASS_LABELS[best_index] if best_index < len(CLASS_LABELS) else f"CLASS_{best_index}"
    confidence = float(preds[0][best_index])
    print(f"DEBUG: Best index: {best_index}, Label: {label}, Confidence: {confidence}", flush=True)
    raw_prob = [float(x) for x in preds[0]]
    return label, confidence, raw_prob


# ------------------------------------------
# MAIN FUNCTION
# ------------------------------------------
def scan_audio_for_fake(audio_path):
    try:
        print(f"\n{'='*60}", flush=True)
        print(f"🎵 AUDIO SCAN START: {audio_path}", flush=True)
        print(f"{'='*60}", flush=True)
        
        load_once()
        print("✅ Model loaded successfully", flush=True)

        processed = preprocess_audio(audio_path)
        print(f"✅ Audio preprocessed. Shape: {processed.shape}", flush=True)

        label, confidence, raw_prob = predict(audio_path)
        print(f"✅ Prediction complete. Label: {label}, Confidence: {confidence}", flush=True)
        print(f"✅ Raw probabilities: {raw_prob}", flush=True)

        result = {
            "label": label,
            "confidence": confidence,
            "raw_prob": raw_prob,
            "features": extract_features(processed)
        }
        print(f"✅ RETURNING RESULT: {result}", flush=True)
        print(f"{'='*60}\n", flush=True)
        return result

    except Exception as e:
        print(f"\n{'='*60}", flush=True)
        print(f"❌ AUDIO MODEL ERROR: {type(e).__name__}", flush=True)
        print(f"❌ Error message: {e}", flush=True)
        print(f"{'='*60}", flush=True)
        traceback.print_exc()
        print(f"{'='*60}\n", flush=True)

        return {
            "label": "Error",
            "confidence": 0.0,
            "error": str(e)
        }