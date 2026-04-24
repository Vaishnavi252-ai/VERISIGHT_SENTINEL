import json
import os
import numpy as np
import librosa
import traceback
from tensorflow.keras.models import load_model
import sys

# ------------------------------------------
# Paths and constants
# ------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "deepfake_audio_detector.h5")
MODEL = None
CLASS_LABELS = ["REAL", "FAKE"]  # Based on training: 0=real, 1=fake
SAMPLE_RATE = 22050
DURATION = 2.0  # 2-second audio files as per training

# Mel spectrogram parameters (matching training)
N_MELS = 128
HOP_LENGTH = 512


def load_once():
    """Load the audio detection model once"""
    global MODEL
    if MODEL is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Audio model not found at {MODEL_PATH}")
        MODEL = load_model(MODEL_PATH, compile=False)
        print(f"✅ Loaded audio model from {MODEL_PATH}", flush=True)
        print(f"DEBUG: Model input shape: {MODEL.input_shape}", flush=True)
        print(f"DEBUG: Model output shape: {MODEL.output_shape}", flush=True)


# ------------------------------------------
# Audio Preprocessing (MATCHING TRAINING CODE)
# ------------------------------------------
def load_audio(file_path):
    """Load audio file using librosa"""
    audio, sr = librosa.load(file_path, sr=SAMPLE_RATE, duration=DURATION, mono=True)
    if audio is None or len(audio) == 0:
        raise ValueError("Could not load audio or audio file is empty")
    return audio, sr


def create_mel_spectrogram(file_path):
    """
    Create mel spectrogram from audio file
    Matching the training code exactly:
    mel_spectrogram = librosa.feature.melspectrogram(y=audio, sr=sample_rate)
    mel_decibel_spectrogram = librosa.power_to_db(mel_spectrogram, ref=np.max)
    """
    audio_data, sample_rate = librosa.load(file_path, sr=SAMPLE_RATE, duration=DURATION)
    # Convert audio to mel-based spectrogram
    mel_spectrogram = librosa.feature.melspectrogram(
        y=audio_data, 
        sr=sample_rate,
        n_mels=N_MELS,
        hop_length=HOP_LENGTH
    )
    # Convert from amplitude squared to decibel units
    mel_decibel_spectrogram = librosa.power_to_db(mel_spectrogram, ref=np.max)
    return mel_decibel_spectrogram


def get_target_shape():
    """Get the expected input shape from the model"""
    if MODEL is None or MODEL.input_shape is None:
        raise ValueError("Model is not loaded; cannot infer input shape")
    return MODEL.input_shape[1:]  # e.g. (128, 87, 1)


def preprocess_audio(file_path):
    """
    Preprocess audio to match training format
    - Creates mel spectrogram
    - Reshapes to match model input dynamically
    """
    print(f"DEBUG: Loading audio from {file_path}", flush=True)
    audio, sr = librosa.load(file_path, sr=SAMPLE_RATE, duration=DURATION, mono=True)
    print(f"DEBUG: Loaded audio shape: {audio.shape}, sr: {sr}", flush=True)
    
    # Create mel spectrogram (matching training)
    mel_spectrogram = librosa.feature.melspectrogram(
        y=audio, 
        sr=sr,
        n_mels=N_MELS,
        hop_length=HOP_LENGTH
    )
    mel_decibel = librosa.power_to_db(mel_spectrogram, ref=np.max)
    
    print(f"DEBUG: Mel spectrogram shape: {mel_decibel.shape}", flush=True)
    
    # Check for NaN or Inf
    if np.any(np.isnan(mel_decibel)) or np.any(np.isinf(mel_decibel)):
        print(f"DEBUG: NaN or Inf in spectrogram", flush=True)
        raise ValueError("Spectrogram extraction resulted in NaN or Inf values")
    
    # Dynamically match model input shape
    target_shape = get_target_shape()
    print(f"DEBUG: Target model input shape: {target_shape}", flush=True)
    
    # If model expects a specific width, pad or trim
    if len(target_shape) >= 2:
        target_width = target_shape[1]
        current_width = mel_decibel.shape[1]
        if current_width < target_width:
            pad_width = target_width - current_width
            mel_decibel = np.pad(mel_decibel, ((0, 0), (0, pad_width)), mode='constant')
        elif current_width > target_width:
            mel_decibel = mel_decibel[:, :target_width]
    
    # Add channel and batch dimensions
    mel_decibel = np.expand_dims(mel_decibel, axis=-1)  # Add channel dimension
    mel_decibel = np.expand_dims(mel_decibel, axis=0)   # Add batch dimension
    
    print(f"DEBUG: Final input shape: {mel_decibel.shape}", flush=True)
    
    # Convert to float32 for prediction
    mel_decibel = mel_decibel.astype(np.float32)
    
    return mel_decibel


# ------------------------------------------
# Feature extraction (for explanation)
# ------------------------------------------
def extract_features(spectrogram_tensor):
    """Extract features from the spectrogram for explanation"""
    feature_array = np.squeeze(spectrogram_tensor).astype(np.float32)
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
    """Make prediction on audio file"""
    if MODEL is None:
        raise RuntimeError("Audio model is not loaded")

    processed = preprocess_audio(audio_path)
    print(f"DEBUG: Processed input shape: {processed.shape}", flush=True)
    
    # Make prediction
    preds = MODEL.predict(processed, verbose=0)
    print(f"DEBUG: Raw preds: {preds}", flush=True)
    
    preds = np.asarray(preds, dtype=np.float32)
    
    if np.any(np.isnan(preds)) or np.any(np.isinf(preds)):
        print(f"DEBUG: NaN or Inf detected in preds: {preds}", flush=True)
        raise ValueError("Model prediction resulted in NaN or Inf values")
    
    # Get prediction
    # Model outputs probability of FAKE (class 1)
    # If output > 0.5, it's FAKE, else REAL
    fake_prob = float(preds[0][0])
    
    # Determine label based on threshold
    if fake_prob > 0.5:
        label = "FAKE"
        confidence = fake_prob
    else:
        label = "REAL"
        confidence = 1.0 - fake_prob
    
    print(f"DEBUG: Fake probability: {fake_prob}, Label: {label}, Confidence: {confidence}", flush=True)
    
    # Raw probabilities [real, fake]
    raw_prob = [1.0 - fake_prob, fake_prob]
    
    return label, confidence, raw_prob


# ------------------------------------------
# MAIN FUNCTION
# ------------------------------------------
def scan_audio_for_fake(audio_path):
    """
    Main function to scan an audio file for deepfake detection
    
    Args:
        audio_path: Path to the audio file
        
    Returns:
        dict: Result containing label, confidence, and raw probabilities
    """
    try:
        print(f"\n{'='*60}", flush=True)
        print(f"🎵 AUDIO SCAN START: {audio_path}", flush=True)
        print(f"{'='*60}", flush=True)
        
        # Load model
        load_once()
        print("✅ Model loaded successfully", flush=True)

        # Preprocess audio
        processed = preprocess_audio(audio_path)
        print(f"✅ Audio preprocessed. Shape: {processed.shape}", flush=True)

        # Make prediction
        label, confidence, raw_prob = predict(audio_path)
        print(f"✅ Prediction complete. Label: {label}, Confidence: {confidence}", flush=True)
        print(f"✅ Raw probabilities: {raw_prob}", flush=True)

        # Build result
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


# ------------------------------------------
# Standalone test
# ------------------------------------------
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        audio_file = sys.argv[1]
        result = scan_audio_for_fake(audio_file)
        print("\n📊 FINAL RESULT:", result)
    else:
        print("Usage: python audio_detect.py <audio_file_path>")