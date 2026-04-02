from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from model.video_detect import predict_video
from services.llm_service import generate_ai_literacy_report

import os
import traceback
import numpy as np

video_scan_bp = Blueprint("video_scan", __name__)

UPLOAD_FOLDER = "uploads/videos"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm'}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ------------------------------------------
# 1️⃣ Scan video for deepfake detection
# ------------------------------------------
@video_scan_bp.route("/api/video-scan", methods=["POST"])
def scan_video():
    """
    Endpoint to scan a video for deepfake detection
    
    Accepts multipart form data with a 'video' file field
    Returns prediction with confidence and metadata
    """
    try:
        if "video" not in request.files:
            return jsonify({"error": "No video file uploaded"}), 400

        video_file = request.files["video"]
        if video_file.filename == "":
            return jsonify({"error": "Empty filename"}), 400

        if not allowed_file(video_file.filename):
            return jsonify({
                "error": f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            }), 400

        filename = secure_filename(video_file.filename)
        video_path = os.path.join(UPLOAD_FOLDER, filename)
        video_file.save(video_path)

        # Run prediction
        result = predict_video(video_path)

        if result.get("label") == "Error":
            # Clean up uploaded file
            if os.path.exists(video_path):
                os.remove(video_path)
            
            return jsonify({
                "status": "error",
                "detail": result.get("error", "Model prediction failed")
            }), 500

        # Persist detection record with geo enrichment and publish SSE
        try:
            from app.models import db, Detection
            from services.geo_service import enrich_detection_fields
            from services.event_bus import bus

            client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
            geo_fields = enrich_detection_fields({}, client_ip)

            det = Detection(
                user_id=None,
                media_type='video',
                result_label=result['label'].upper(),
                confidence=float(result['confidence']),
                file_path=video_path,
                ip=geo_fields.get('ip'),
                country=geo_fields.get('country'),
                city=geo_fields.get('city'),
                lat=geo_fields.get('lat'),
                lon=geo_fields.get('lon'),
                metadata={
                    "frame_count": result.get("frame_count", 0),
                    "avg_probability": result.get("avg_probability", 0),
                    "frame_probabilities": result.get("frame_probabilities", []),
                    **geo_fields
                }
            )
            db.session.add(det)
            db.session.commit()
            
            # Store detection_id for response
            detection_id = det.id

            # Publish SSE event
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

        except Exception as db_err:
            print(f"⚠️ Database error (non-critical): {db_err}")
            traceback.print_exc()
            detection_id = None

        confidence_raw = float(result['confidence'])
        confidence_pct = round(confidence_raw * 100.0, 2)
        if confidence_pct < 50:
            confidence_level = "Low"
        elif confidence_pct < 70:
            confidence_level = "Medium"
        else:
            confidence_level = "High"

        return jsonify({
            "status": result['label'].upper(),
            "result": result['label'].upper(),
            "result_label": result['label'].upper(),
            "confidence": confidence_pct,
            "confidence_fraction": confidence_raw,
            "confidence_level": confidence_level,
            "avg_fake_score": result.get("avg_probability", 0),
            "frame_count": result.get("frame_count"),
            "frame_probabilities": result.get("frame_probabilities", []),
            "detection_id": detection_id if 'detection_id' in locals() else None
        }), 200

    except Exception as e:
        print(f"❌ Error in video scan: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "detail": str(e)
        }), 500

# ------------------------------------------
# 2️⃣ Generate GenAI forensic explanation for video
# ------------------------------------------
@video_scan_bp.route("/api/video-explain", methods=["POST"])
def generate_video_ai_explanation():
    try:
        data = request.get_json()
        print("Video explain request data:", data)  # Debug log

        # Use centralized LLM service which returns structured JSON
        explanation = generate_ai_literacy_report(
            data.get("status"),  # "FAKE" or "REAL"
            float(data.get("confidence", 0)),
            {
                'frames': data.get("frames", []),
                'video_name': data.get("video_name", ""),
                'avg_fake_score': data.get("avg_fake_score", 0),
                'frame_count': data.get("frame_count", 0),
            },
            media_type="video"
        )

        print("Generated explanation:", explanation)  # Debug log

        return jsonify({
            "status": "success",
            "explanation": explanation
        })

    except Exception as e:
        print("Video explain error:", str(e))  # Debug log
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

# ------------------------------------------
# 2️⃣ Scan video from URL (YouTube, etc.)
# ------------------------------------------
@video_scan_bp.route("/api/video-scan-url", methods=["POST"])
def scan_video_from_url():
    """
    Download a video from URL and scan for deepfakes
    """
    try:
        data = request.get_json()
        
        if not data or "url" not in data:
            return jsonify({"error": "No URL provided"}), 400

        url = data.get("url")
        
        # Download video
        try:
            import yt_dlp
            
            video_path = os.path.join(UPLOAD_FOLDER, "temp_download.mp4")
            
            ydl_opts = {
                'format': 'best[ext=mp4]',
                'outtmpl': video_path,
                'quiet': True,
                'no_warnings': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            
            if not os.path.exists(video_path) or os.path.getsize(video_path) < 100000:
                return jsonify({"error": "Video download failed or file too small"}), 400
        
        except Exception as download_err:
            return jsonify({
                "error": f"Failed to download video: {str(download_err)}"
            }), 400

        # Run prediction
        result = predict_video(video_path)

        # Clean up downloaded file
        if os.path.exists(video_path):
            os.remove(video_path)

        if result.get("label") == "Error":
            return jsonify({
                "status": "error",
                "detail": result.get("error", "Model prediction failed")
            }), 500

        confidence_raw = float(result['confidence'])
        confidence_pct = round(confidence_raw * 100.0, 2)
        if confidence_pct < 50:
            confidence_level = "Low"
        elif confidence_pct < 70:
            confidence_level = "Medium"
        else:
            confidence_level = "High"

        return jsonify({
            "status": result['label'].upper(),
            "result": result['label'].upper(),
            "result_label": result['label'].upper(),
            "confidence": confidence_pct,
            "confidence_fraction": confidence_raw,
            "confidence_level": confidence_level,
            "avg_fake_score": result.get("avg_probability", 0),
            "frame_count": result.get("frame_count"),
            "frame_probabilities": result.get("frame_probabilities", []),
            "detection_id": None
        }), 200

    except Exception as e:
        print(f"❌ Error in video URL scan: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "detail": str(e)
        }), 500

# ------------------------------------------
# 3️⃣ Get video scan history
# ------------------------------------------
@video_scan_bp.route("/api/video-scan-history", methods=["GET"])
def get_video_scan_history():
    """
    Get history of video scans (detections with media_type='video')
    """
    try:
        from app.models import db, Detection
        
        limit = request.args.get('limit', 50, type=int)
        
        detections = db.session.query(Detection)\
            .filter_by(media_type='video')\
            .order_by(Detection.created_at.desc())\
            .limit(limit)\
            .all()
        
        return jsonify({
            "status": "success",
            "data": [det.to_dict() for det in detections]
        }), 200
    
    except Exception as e:
        print(f"❌ Error fetching video history: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "detail": str(e)
        }), 500

# ------------------------------------------
# 4️⃣ DEBUG: Test model predictions
# ------------------------------------------
@video_scan_bp.route("/api/video-scan-debug", methods=["POST"])
def debug_video_prediction():
    """
    DEBUG ENDPOINT: Test video prediction with detailed frame-by-frame analysis
    
    Helps identify if:
    - Model output is inverted
    - Threshold needs adjustment
    - Frame preprocessing is correct
    - Raw probabilities show expected trends
    """
    try:
        if "video" not in request.files:
            return jsonify({"error": "No video file uploaded"}), 400

        video_file = request.files["video"]
        if video_file.filename == "":
            return jsonify({"error": "Empty filename"}), 400

        filename = secure_filename(video_file.filename)
        video_path = os.path.join(UPLOAD_FOLDER, f"debug_{filename}")
        video_file.save(video_path)

        # Get detailed prediction
        from model.video_detect import predict_video, load_video_model, extract_frames
        
        result = predict_video(video_path)
        
        # Additional debug info
        debug_info = {
            "status": "debug_complete",
            "prediction": result.get("label"),
            "confidence": result.get("confidence"),
            "avg_probability": result.get("avg_probability"),
            "frame_probabilities": result.get("frame_probabilities"),
            "frame_count": result.get("frame_count"),
            
            # Analysis
            "analysis": {
                "min_frame_prob": float(min(result.get("frame_probabilities", [0.5]))),
                "max_frame_prob": float(max(result.get("frame_probabilities", [0.5]))),
                "prob_std": float(np.std(result.get("frame_probabilities", [0.5]))),
                "frames_above_05": sum(1 for p in result.get("frame_probabilities", []) if p > 0.5),
                "frames_below_05": sum(1 for p in result.get("frame_probabilities", []) if p < 0.5),
            },
            
            "recommendations": []
        }
        
        # Analysis and recommendations
        probs = result.get("frame_probabilities", [])
        avg = result.get("avg_probability", 0.5)
        
        if len(probs) > 0:
            above_threshold = sum(1 for p in probs if p > 0.5)
            below_threshold = len(probs) - above_threshold
            
            # If most frames say one thing but prediction is opposite
            if above_threshold > 5 and result.get("label") == "Real":
                debug_info["recommendations"].append("⚠️ Most frames predict FAKE but result is REAL - Model might be INVERTED")
                debug_info["recommendations"].append("Try setting INVERT_PREDICTION = True in video_detect.py")
                
            elif below_threshold > 5 and result.get("label") == "Fake":
                debug_info["recommendations"].append("⚠️ Most frames predict REAL but result is FAKE - Model might be INVERTED")
                debug_info["recommendations"].append("Try setting INVERT_PREDICTION = True in video_detect.py")
            
            # Low confidence (near 0.5)
            if 0.45 < avg < 0.55:
                debug_info["recommendations"].append("⚠️ Prediction very close to threshold (0.5) - Low confidence")
                debug_info["recommendations"].append("Consider adjusting PREDICTION_THRESHOLD in video_detect.py")
            
            # High variance
            if debug_info["analysis"]["prob_std"] > 0.3:
                debug_info["recommendations"].append("ℹ️ High variance in frame predictions - Inconsistent video quality")
                debug_info["recommendations"].append("Some frames strongly predict one class, others the opposite")
        
        # Clean up temp file
        if os.path.exists(video_path):
            os.remove(video_path)

        return jsonify(debug_info), 200

    except Exception as e:
        print(f"❌ Error in debug prediction: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "detail": str(e),
            "error_type": type(e).__name__
        }), 500

# ------------------------------------------
# 5️⃣ ADMIN: Fix prediction inversion
# ------------------------------------------
@video_scan_bp.route("/api/video-scan-config", methods=["POST"])
def configure_prediction():
    """
    ADMIN ENDPOINT: Configure prediction behavior
    
    Body:
    {
      "invert_prediction": bool,
      "threshold": float (0.0-1.0)
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "detail": "No configuration data provided"
            }), 400

        # Update configuration
        import model.video_detect as vd
        
        if "invert_prediction" in data:
            vd.INVERT_PREDICTION = bool(data["invert_prediction"])
            print(f"✅ Set INVERT_PREDICTION = {vd.INVERT_PREDICTION}")
        
        if "threshold" in data:
            threshold = float(data["threshold"])
            if 0.0 <= threshold <= 1.0:
                vd.PREDICTION_THRESHOLD = threshold
                print(f"✅ Set PREDICTION_THRESHOLD = {vd.PREDICTION_THRESHOLD}")
            else:
                return jsonify({
                    "status": "error",
                    "detail": "Threshold must be between 0.0 and 1.0"
                }), 400

        return jsonify({
            "status": "success",
            "config": {
                "INVERT_PREDICTION": vd.INVERT_PREDICTION,
                "PREDICTION_THRESHOLD": vd.PREDICTION_THRESHOLD
            }
        }), 200

    except Exception as e:
        print(f"❌ Error configuring prediction: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "detail": str(e)
        }), 500

