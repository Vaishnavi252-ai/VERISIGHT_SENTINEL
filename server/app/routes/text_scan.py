from flask import Blueprint, request, jsonify
from services.llm_service import generate_ai_literacy_report
import os

text_scan_bp = Blueprint("text_scan", __name__)

UPLOAD_FOLDER = "uploads/text"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@text_scan_bp.route("/api/text-scan", methods=["POST"])
def scan_text():
    """Placeholder text scan - implement model later"""
    if "text" not in request.files:
        return jsonify({"error": "No text file"}), 400
    
    # Simulate
    return jsonify({
        "status": "success",
        "result": "HUMAN",
        "confidence": "0.87",
        "detection_id": None
    })

@text_scan_bp.route("/api/text-explain", methods=["POST"])
def generate_text_explanation():
    try:
        data = request.get_json()
        explanation = generate_ai_literacy_report(
            data.get("result", "HUMAN"),
            float(data.get("confidence", 0.5)),
            data.get("features", {}),
            media_type="text"
        )
        return jsonify({"status": "success", "explanation": explanation})
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

