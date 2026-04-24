import os
import json
import numpy as np
import cv2
from dotenv import load_dotenv
from keras.models import load_model
from tensorflow.keras.preprocessing import image
from PIL import Image, ImageStat
import traceback

# ------------------------------------------
# Safe imports (NO CRASH)
# ------------------------------------------
try:
    import mediapipe as mp
    mp_face_mesh = mp.solutions.face_mesh
except Exception:
    mp_face_mesh = None

# ------------------------------------------
# Environment
# ------------------------------------------
load_dotenv()

# ------------------------------------------
# Paths
# ------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "custom_model.keras")
CLASS_MAPPING_PATH = os.path.join(BASE_DIR, "class_mapping.json")

# ------------------------------------------
# Load model ONCE (CRITICAL FIX)
# ------------------------------------------
MODEL = None
CLASS_MAPPING = None

def load_once():
    global MODEL, CLASS_MAPPING
    if MODEL is None:
        if not os.path.exists(MODEL_PATH):
            print("⚠️ Model not found, using dummy predictions for testing")
            MODEL = None  # Will use dummy in predict
        else:
            MODEL = load_model(MODEL_PATH, compile=False)

    if CLASS_MAPPING is None:
        if os.path.exists(CLASS_MAPPING_PATH):
            with open(CLASS_MAPPING_PATH, "r") as f:
                mapping = json.load(f)
            CLASS_MAPPING = {v: k for k, v in mapping.items()}
        else:
            CLASS_MAPPING = {0: "REAL", 1: "FAKE"}

# ------------------------------------------
# Image preprocessing
# ------------------------------------------
def prepare_image(img_path, target_size=(224, 224)):
    img = image.load_img(img_path, target_size=target_size)
    arr = image.img_to_array(img) / 255.0
    return np.expand_dims(arr, axis=0)

# ------------------------------------------
# Image metrics
# ------------------------------------------
def compute_image_metrics(img_path):
    img = Image.open(img_path).convert("RGB")
    stat = ImageStat.Stat(img)
    gray = np.array(img.convert("L"))

    return {
        "brightness": float(sum(stat.mean) / 3),
        "contrast": float(sum(stat.stddev) / 3),
        "sharpness": float(cv2.Laplacian(gray, cv2.CV_64F).var()),
        "r_mean": float(stat.mean[0]),
        "g_mean": float(stat.mean[1]),
        "b_mean": float(stat.mean[2]),
    }

# ------------------------------------------
# Face cues 
# ------------------------------------------
def extract_face_cues(img_path):
    if mp_face_mesh is None:
        return {"faces": 0}

    try:
        img = cv2.imread(img_path)
        if img is None:
            return {"faces": 0}

        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        with mp_face_mesh.FaceMesh(static_image_mode=True) as face_mesh:
            res = face_mesh.process(rgb)
            if not res.multi_face_landmarks:
                return {"faces": 0}

            lm = res.multi_face_landmarks[0].landmark
            left, right, nose = lm[33], lm[263], lm[1]

            d1 = ((left.x - nose.x)**2 + (left.y - nose.y)**2) ** 0.5
            d2 = ((right.x - nose.x)**2 + (right.y - nose.y)**2) ** 0.5
            asym = abs(d1 - d2) / (d1 + d2 + 1e-9)

            return {
                "faces": len(res.multi_face_landmarks),
                "asymmetry_ratio": float(asym),
                "large_asymmetry": bool(asym > 0.03)
            }
    except Exception:
        return {"faces": 0}

# ------------------------------------------
# Prediction
# ------------------------------------------
def predict(img_path):
    if MODEL is None:
        raise RuntimeError("Image model could not be loaded. Check that custom_model.keras exists.")

    arr = prepare_image(img_path)
    preds = MODEL.predict(arr, verbose=0)

    if preds.shape[-1] == 1:
        prob_fake = float(preds[0][0])
        cls = 1 if prob_fake >= 0.5 else 0
        conf = prob_fake if cls == 1 else 1 - prob_fake
    else:
        cls = int(np.argmax(preds[0]))
        conf = float(np.max(preds[0]))
        prob_fake = float(preds[0][1])

    return CLASS_MAPPING.get(cls, "Unknown"), conf, prob_fake

# ------------------------------------------
# MAIN FUNCTION
# ------------------------------------------
def scan_image_for_fake(img_path):
    try:
        load_once()

        label, confidence, raw_prob = predict(img_path)

        return {
            "label": label,
            "confidence": confidence,
            "raw_prob": raw_prob,
            "metrics": compute_image_metrics(img_path),
            "face_cues": extract_face_cues(img_path)
        }

    except Exception as e:
        print("❌ MODEL ERROR:", e)
        traceback.print_exc()
        return {
            "label": "Error",
            "confidence": 0.0,
            "error": str(e)
        }
