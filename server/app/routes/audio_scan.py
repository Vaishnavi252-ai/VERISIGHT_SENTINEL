from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from model.audio_detect import scan_audio_for_fake

import os
import traceback
import numpy as np
import sys

audio_scan_bp = Blueprint("audio_scan", __name__)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads", "audio")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ------------------------------------------
# 1️⃣ Scan audio for deepfake
# ------------------------------------------
@audio_scan_bp.route("/api/audio-scan", methods=["POST"])
def scan_audio():
    print(f"\n{'='*60}", flush=True)
    print("📡 /api/audio-scan REQUEST RECEIVED", flush=True)
    print(f"{'='*60}", flush=True)
    
    try:
        if "audio" not in request.files and "file" not in request.files:
            print("❌ No audio file in request", flush=True)
            print(f"   Available files: {list(request.files.keys())}", flush=True)
            return jsonify({"error": "No audio uploaded"}), 400

        audio_field = "audio" if "audio" in request.files else "file"
        audio_file = request.files[audio_field]
        print(f"✅ File received ({audio_field}): {audio_file.filename}", flush=True)

        if audio_file.filename == "":
            print("❌ Empty filename", flush=True)
            return jsonify({"error": "Empty filename"}), 400

        filename = secure_filename(audio_file.filename)
        audio_path = os.path.join(UPLOAD_FOLDER, filename)
        audio_file.save(audio_path)
        print(f"✅ File saved to: {audio_path}", flush=True)
        print(f"✅ File exists: {os.path.exists(audio_path)}", flush=True)
        print(f"✅ File size: {os.path.getsize(audio_path)} bytes", flush=True)

        print("\n🔍 Calling scan_audio_for_fake...", flush=True)
        result = scan_audio_for_fake(audio_path)
        print(f"🔍 Result received: {result}", flush=True)

        if result.get("label") == "Error":
            print(f"❌ Model returned error: {result.get('error')}", flush=True)
            return jsonify({
                "status": "error",
                "detail": result.get("error", "Model failed")
            }), 500

        confidence = result.get("confidence", 0.0)
        print(f"📊 Raw confidence: {confidence} (type: {type(confidence)})", flush=True)
        
        if not isinstance(confidence, (int, float)):
            print(f"⚠️ Confidence is not a number, setting to 0.0", flush=True)
            confidence = 0.0
        elif np.isnan(confidence):
            print(f"⚠️ Confidence is NaN, setting to 0.0", flush=True)
            confidence = 0.0
        elif np.isinf(confidence):
            print(f"⚠️ Confidence is Inf, setting to 0.0", flush=True)
            confidence = 0.0

        confidence_pct = confidence * 100
        print(f"✅ Final confidence: {confidence_pct:.2f}%", flush=True)

        response = {
            "status": "success",
            "result": result["label"].upper(),
            "confidence": f"{confidence_pct:.2f}",
            "raw_prob": result.get("raw_prob"),
            "audio_name": filename,
            "features": result.get("features", {})
        }
        print(f"✅ Response: {response}", flush=True)
        print(f"{'='*60}\n", flush=True)
        
        return jsonify(response)

    except Exception as e:
        print(f"\n{'='*60}", flush=True)
        print(f"❌ AUDIO SCAN ERROR: {type(e).__name__}", flush=True)
        print(f"❌ Error message: {e}", flush=True)
        print(f"{'='*60}", flush=True)
        traceback.print_exc()
        print(f"{'='*60}\n", flush=True)
        return jsonify({
            "status": "error",
            "detail": str(e)
        }), 500


# ------------------------------------------
# 2️⃣ AI Explanation (Optional)
# ------------------------------------------
@audio_scan_bp.route("/api/audio-explain", methods=["POST"])
def audio_explain():
    try:
        data = request.get_json()

        explanation = generate_ai_literacy_report(
            data.get("label"),
            float(data.get("confidence", 0)),
            {"features": data.get("features", {})},
            media_type="audio"
        )

        return jsonify({
            "status": "success",
            "explanation": explanation
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500