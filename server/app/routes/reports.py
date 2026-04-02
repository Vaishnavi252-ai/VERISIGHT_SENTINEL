from flask import Blueprint, request, jsonify
from app.models import db, Detection, Report, ReportAnswer, User
from services.llm_service import generate_report_questions, generate_ai_literacy_report
from services.notification_service import send_email
from datetime import datetime
import traceback

reports_bp = Blueprint('reports', __name__)


@reports_bp.route('/api/detections/<int:detection_id>', methods=['GET'])
def get_detection(detection_id):
    d = Detection.query.get(detection_id)
    if not d:
        return jsonify({'error': 'Not found'}), 404

    # debug: log detection metadata for troubleshooting
    try:
        print(f"GET detection {detection_id} file_path={d.file_path} generated_questions_present={bool(d.generated_questions)}")
    except Exception:
        pass

    # If no LLM explanation saved, generate one on demand (stateless for now)
    explanation = generate_ai_literacy_report(d.result_label, d.confidence, {
        'metrics': d.metrics or {}, 'face_cues': d.face_cues or {}
    }, media_type=d.media_type or "image")

    return jsonify({'status': 'success', 'detection': d.to_dict(), 'explanation': explanation})


@reports_bp.route('/api/reports/questions/<int:detection_id>', methods=['GET'])
def get_report_questions(detection_id):
    try:
        d = Detection.query.get(detection_id)
        if not d:
            return jsonify({'error': 'Not found'}), 404

        # If questions were already generated for this detection, return them
        if d.generated_questions:
            return jsonify({'status': 'success', 'questions': d.generated_questions})

        # Fixed core question (no platform/where - collected in frontend)
        core_questions = [
            {"type": "yesno", "question": "Is the person in this media known to you?"}
        ]

        dynamic_questions = generate_report_questions(d.media_type, d.confidence, d.result_label)

        # Deduplicate + filter repeats (case-insensitive)
        forbidden_keywords = {'where', 'platform', 'find', 'date', 'created', 'location', 'country'}
        seen = set()
        merged = []

        for q in core_questions + dynamic_questions:
            text = (q.get('question') or '').strip()
            key = text.lower()
            if (key and key not in seen and 
                not any(kw in key for kw in forbidden_keywords)):
                seen.add(key)
                merged.append(q)

        # If merged less than desired, add fallback questions
        if len(merged) < 5:
            merged.extend([
                {"type": "yesno", "question": "Has this content caused harm or distress?"},
                {"type": "long", "question": "Additional remarks (optional)"}
            ])

        # Persist generated questions to avoid repeated LLM calls and duplicate prompts
        d.generated_questions = merged
        db.session.add(d)
        db.session.commit()

        return jsonify({'status': 'success', 'questions': merged})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'status': 'error', 'error': str(e)}), 500


@reports_bp.route('/api/reports/submit', methods=['POST'])
def submit_report():
    try:
        data = request.get_json()
        print(f"Report submission data: {data}")  # Debug log

        detection_id = data.get('detection_id')
        platform = data.get('platform')
        urgency = data.get('urgency_level')
        geo = data.get('geo_location')
        answers = data.get('answers', [])
        reporter_email = data.get('reporter_email')

        d = Detection.query.get(detection_id)
        if not d:
            print(f"Detection {detection_id} not found")  # Debug log
            return jsonify({'error': 'Invalid detection id'}), 400

        print(f"Found detection {detection_id}, proceeding with report creation")  # Debug log

        # Update detection with reported country if provided
        reported_country = data.get('country')
        if reported_country:
            from services.geo_service import get_country_centroid, normalize_country_input
            from services.event_bus import bus
            normalized_country = normalize_country_input(reported_country)
            centroid = get_country_centroid(normalized_country)
            d.country = normalized_country
            d.lat = centroid['lat']
            d.lon = centroid['lon']
            db.session.add(d)

            # Publish updated detection event for real-time map update
            bus.publish({
                'id': d.id,
                'timestamp': d.created_at.isoformat(),
                'media_type': d.media_type,
                'confidence': d.confidence,
                'country': d.country,
                'city': d.city,
                'lat': d.lat,
                'lon': d.lon,
                'result_label': d.result_label,
            })

        report = Report(
            detection_id=detection_id,
            platform=platform,
            geo_location=geo,
            urgency_level=urgency,
            reporter_email=reporter_email,
            country=reported_country,
            status='Submitted',
            created_at=datetime.utcnow()
        )
        db.session.add(report)
        db.session.commit()

        for ans in answers:
            ra = ReportAnswer(report_id=report.id, question=ans.get('question'), answer=ans.get('answer'))
            db.session.add(ra)
        db.session.commit()

        # Notify the user if email provided
        email_sent = False
        if reporter_email:
            from services.notification_service import notify_report_received
            email_sent = notify_report_received(reporter_email, report.id)
            if not email_sent:
                print(f"Warning: Failed to send confirmation email to {reporter_email} for report {report.id}")

        print(f"Report {report.id} submitted successfully, email sent: {email_sent}")  # Debug log
        return jsonify({'status': 'success', 'report_id': report.id, 'email_sent': email_sent})

    except Exception as e:
        print(f"Report submission error: {str(e)}")  # Debug log
        traceback.print_exc()
        return jsonify({'status': 'error', 'error': str(e)}), 500
