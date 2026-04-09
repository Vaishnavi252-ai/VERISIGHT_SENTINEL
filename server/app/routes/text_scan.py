from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
import uuid

from app.models import db, Detection
from model.text_detect import detect_text, detect_url, detect_txt_file
from services.llm_service import generate_ai_literacy_report
from services.geo_service import enrich_detection_fields

# Stub current_user if not defined
def get_current_user():
    return None

text_scan_bp = Blueprint("text_scan", __name__)

UPLOAD_FOLDER = "uploads/text"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# -------------------------------
# TEXT INPUT
# -------------------------------
@text_scan_bp.route("/api/text-scan", methods=["POST"])
def scan_text():
    try:
        data = request.get_json()
        text = data.get("text", "")
        input_source = data.get("input_source", "typed")
        is_paste = str(input_source).lower() == "paste"

        result = detect_text(text, is_paste=is_paste)

        # Geo info
        geo_fields = enrich_detection_fields(request.remote_addr, request.remote_addr)

        # Create Detection
        det = Detection(
            media_type='text',
            result_label=result["label"],
            confidence=result["confidence"],
            metrics=result.get("metrics", {}),
            ip=geo_fields['ip'],
            country=geo_fields['country'],
            city=geo_fields['city'],
            lat=geo_fields['lat'],
            lon=geo_fields['lon'],
            upload_source='text-input'
        )
        db.session.add(det)
        db.session.commit()

        return jsonify({
            "status": "success",
            "result": result["label"],
            "confidence": result["confidence"],
            "detection_id": det.id,
            "metrics": result.get("metrics", {})
        })

    except Exception as e:
        return jsonify({"status": "error", "detail": str(e)}), 500


# -------------------------------
# URL SCAN
# -------------------------------
@text_scan_bp.route("/api/url-scan", methods=["POST"])
def scan_url():
    try:
        data = request.get_json()
        url = data.get("url")

        result = detect_url(url)

        # Geo info
        geo_fields = enrich_detection_fields(request.remote_addr, request.remote_addr)

        # Create Detection
        det = Detection(
            media_type='text',
            result_label=result["label"],
            confidence=result["confidence"],
            metrics=result.get("metrics", {}),
            file_path=url,
            ip=geo_fields['ip'],
            country=geo_fields['country'],
            city=geo_fields['city'],
            lat=geo_fields['lat'],
            lon=geo_fields['lon'],
            upload_source='url-scan'
        )
        db.session.add(det)
        db.session.commit()

        return jsonify({
            "status": "success",
            "result": result["label"],
            "confidence": result["confidence"],
            "detection_id": det.id,
            "metrics": result.get("metrics", {})
        })

    except Exception as e:
        return jsonify({"status": "error", "detail": str(e)}), 500


# -------------------------------
# TXT FILE SCAN
# -------------------------------
@text_scan_bp.route("/api/txt-scan", methods=["POST"])
def scan_txt():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        filename = secure_filename(file.filename)
        unique_name = f"{uuid.uuid4().hex[:8]}_{filename}"
        path = os.path.join(UPLOAD_FOLDER, unique_name)
        file.save(path)

        result = detect_txt_file(path)

        # Geo info
        geo_fields = enrich_detection_fields(request.remote_addr, request.remote_addr)

        # Create Detection
        det = Detection(
            media_type='text',
            result_label=result["label"],
            confidence=result["confidence"],
            file_path=path,
            metrics=result.get("metrics", {}),
            ip=geo_fields['ip'],
            country=geo_fields['country'],
            city=geo_fields['city'],
            lat=geo_fields['lat'],
            lon=geo_fields['lon'],
            upload_source='txt-file'
        )
        db.session.add(det)
        db.session.commit()

        return jsonify({
            "status": "success",
            "result": result["label"],
            "confidence": result["confidence"],
            "detection_id": det.id,
            "file_path": path,
            "metrics": result.get("metrics", {})
        })

    except Exception as e:
        return jsonify({"status": "error", "detail": str(e)}), 500


# -------------------------------
# TEXT EXPLAIN
# -------------------------------
@text_scan_bp.route("/api/text-explain", methods=["POST"])
def generate_text_explanation():
    try:
        data = request.get_json()
        label = data.get("label", "HUMAN")
        confidence = float(data.get("confidence", 0.5))
        metrics = data.get("metrics", {})
        
        explanation = generate_ai_literacy_report(
            label,
            confidence,
            metrics,
            media_type="text"
        )
        return jsonify({"status": "success", "explanation": explanation})
    except Exception as e:
        return jsonify({"status": "error", "detail": str(e)}), 500

