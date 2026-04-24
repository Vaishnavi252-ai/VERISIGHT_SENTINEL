from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from model.detect import scan_image_for_fake
from app.models import db, Detection, User
from services.geo_service import enrich_detection_fields
from services.event_bus import bus

import os
import traceback

image_scan_bp = Blueprint("image_scan", __name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ------------------------------------------
# 1️⃣ Scan image for authenticity
# ------------------------------------------
@image_scan_bp.route("/api/image-scan", methods=["POST"])
@jwt_required()
def scan_image():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        image_file = request.files["image"]
        if image_file.filename == "":
            return jsonify({"error": "Empty filename"}), 400

        filename = secure_filename(image_file.filename)
        image_path = os.path.join(UPLOAD_FOLDER, filename)
        image_file.save(image_path)

        result = scan_image_for_fake(image_path)

        if result.get("label") == "Error":
            return jsonify({
                "status": "error",
                "detail": result.get("error", "Model prediction failed")
            }), 500

        # Persist detection record with geo enrichment and publish SSE
        try:
            uid = get_jwt_identity()
            client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
            geo_fields = enrich_detection_fields({}, client_ip)

            det = Detection(
                user_id=uid,
                media_type='image',
                result_label=result['label'],
                confidence=result['confidence'],
                file_path=image_path,
                metrics=result.get('metrics', {}),
                face_cues=result.get('face_cues', {}),
                upload_source=client_ip,
                ip=geo_fields.get('ip'),
                country=geo_fields.get('country'),
                city=geo_fields.get('city'),
                lat=geo_fields.get('lat'),
                lon=geo_fields.get('lon'),
            )
            db.session.add(det)
            db.session.commit()
            detection_id = det.id

            # Publish to SSE listeners
            bus.publish({
                'id': det.id,
                'timestamp': det.created_at.isoformat(),
                'media_type': det.media_type,
                'confidence': det.confidence,
                'country': det.country,
                'city': det.city,
                'lat': det.lat,
                'lon': det.lon,
                'result_label': det.result_label,
            })
        except Exception as e:
            print('Warning: failed to save detection', e)
            detection_id = None

        return jsonify({
            "status": "success",
            "result": result["label"].upper(),
            "confidence": f"{result['confidence'] * 100:.2f}",
            "metrics": result.get("metrics", {}),
            "face_cues": result.get("face_cues", {}),
            "raw_prob": result.get("raw_prob"),
            "img_name": filename,
            "detection_id": detection_id
        })

    except Exception as e:
        print("❌ IMAGE SCAN ERROR:", e)
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "detail": str(e)
        }), 500

# ------------------------------------------
# 2️⃣ Generate GenAI forensic explanation
# ------------------------------------------
@image_scan_bp.route("/api/image-explain", methods=["POST"])
@jwt_required()
def generate_ai_explanation():
    try:
        data = request.get_json()

        # Use centralized LLM service which returns structured JSON
        explanation = generate_ai_literacy_report(
            data.get("label"),
            float(data.get("confidence", 0)),
            {
                'metrics': data.get("metrics", {}),
                'face_cues': data.get("face_cues", {})
            },
            media_type="image"
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

