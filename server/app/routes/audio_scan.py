from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from model.audio_detect import scan_audio_for_fake

import os
import traceback

audio_scan_bp = Blueprint("audio_scan", __name__)

UPLOAD_FOLDER = "uploads/audio"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ------------------------------------------
# 1️⃣ Scan audio for deepfake
# ------------------------------------------
@audio_scan_bp.route("/api/audio-scan", methods=["POST"])
def scan_audio():
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio uploaded"}), 400

        audio_file = request.files["audio"]

        if audio_file.filename == "":
            return jsonify({"error": "Empty filename"}), 400

        filename = secure_filename(audio_file.filename)
        audio_path = os.path.join(UPLOAD_FOLDER, filename)
        audio_file.save(audio_path)

        result = scan_audio_for_fake(audio_path)

        if result.get("label") == "Error":
            return jsonify({
                "status": "error",
                "detail": result.get("error", "Model failed")
            }), 500

        return jsonify({
            "status": "success",
            "result": result["label"].upper(),
            "confidence": f"{result['confidence'] * 100:.2f}",
            "raw_prob": result.get("raw_prob"),
            "audio_name": filename,
            "features": result.get("features", {})
        })

    except Exception as e:
        print("❌ AUDIO SCAN ERROR:", e)
        traceback.print_exc()
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