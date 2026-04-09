from flask import Blueprint, request, jsonify
from app.models import db, Detection, Report, ReportAnswer
from services.llm_service import generate_ai_literacy_report
from services.notification_service import send_email
from sqlalchemy import func
import traceback

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/api/admin/dashboard', methods=['GET'])
def dashboard():
    try:
        today_count = Report.query.filter(func.date(Report.created_at) == func.current_date()).count()
        fake_counts = db.session.query(Detection.media_type, func.count(Detection.id)).filter(Detection.result_label == 'fake').group_by(Detection.media_type).all()
        urgent = Report.query.filter(Report.urgency_level == 'High').count()

        # top platforms
        top_platforms = db.session.query(Report.platform, func.count(Report.id)).group_by(Report.platform).order_by(func.count(Report.id).desc()).limit(5).all()

        repeat_uploaders = db.session.query(Detection.file_path, func.count(Detection.id)).group_by(Detection.file_path).having(func.count(Detection.id) > 1).all()

        return jsonify({
            'status': 'success',
            'reports_today': today_count,
            'fake_by_type': [{'media_type': m, 'count': c} for m, c in fake_counts],
            'urgent_reports': urgent,
            'top_platforms': [{'platform': p, 'count': c} for p, c in top_platforms],
            'repeat_uploaders': [{'file_path': f, 'count': c} for f, c in repeat_uploaders]
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({'status': 'error', 'error': str(e)}), 500


@admin_bp.route('/api/admin/analytics/timeline', methods=['GET'])
def analytics_timeline():
    # simple mock: number of detections per day for last 7 days
    from datetime import datetime, timedelta
    out = []
    for i in range(7, -1, -1):
        day = (datetime.utcnow() - timedelta(days=i)).date()
        count = Detection.query.filter(func.date(Detection.created_at) == day).count()
        out.append({'date': day.isoformat(), 'detections': count})
    return jsonify({'status': 'success', 'timeline': out})


@admin_bp.route('/api/admin/analytics/media-breakdown', methods=['GET'])
def analytics_media_breakdown():
    res = db.session.query(Detection.media_type, func.count(Detection.id)).group_by(Detection.media_type).all()
    return jsonify({'status': 'success', 'breakdown': [{'media_type': m, 'count': c} for m, c in res]})


@admin_bp.route('/api/admin/analytics/platforms', methods=['GET'])
def analytics_platforms():
    try:
        res = db.session.query(Report.platform, func.count(Report.id)).group_by(Report.platform).all()
        return jsonify({'status': 'success', 'platforms': [{'platform': p, 'count': c} for p, c in res]})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'status': 'error', 'error': str(e)}), 500


@admin_bp.route('/api/admin/analytics/upload-sources', methods=['GET'])
def analytics_upload_sources():
    try:
        res = db.session.query(Detection.upload_source, func.count(Detection.id)).group_by(Detection.upload_source).all()
        return jsonify({'status': 'success', 'upload_sources': [{'source': s or 'unknown', 'count': c} for s, c in res]})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'status': 'error', 'error': str(e)}), 500


@admin_bp.route('/api/admin/reports', methods=['GET'])
def list_reports():
    try:
        limit = request.args.get('limit', type=int, default=1000)  # Allow configurable limit, default 1000 all
        reports = Report.query.order_by(Report.created_at.desc()).limit(limit).all()
        out = []
        def get_ai_literacy_verdict(d):
            if not d:
                return "No Data"
            label = d.result_label or "unknown"
            conf = d.confidence or 0
            risk = "High" if conf > 0.8 else "Medium" if conf > 0.5 else "Low"
            return f"{label}-{risk}"
        
        for r in reports:
            d = r.detection
            ai_verdict = get_ai_literacy_verdict(d)
            out.append({
                'id': r.id,
                'media_type': d.media_type,
                'confidence': d.confidence,
                'platform': r.platform,
                'reporter_email': r.reporter_email,
                'country': r.country,
                'ai_literacy_verdict': ai_verdict,
                'suggested_action': 'Review & Verify' if d.result_label == 'fake' else 'Monitor',
                'status': r.status
            })
        return jsonify({'status': 'success', 'reports': out})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'status': 'error', 'error': str(e)}), 500


@admin_bp.route('/api/admin/reports/<int:report_id>', methods=['GET'])
def get_report(report_id):
    try:
        r = Report.query.get(report_id)
        if not r:
            return jsonify({'error': 'Not found'}), 404

        d = r.detection
        # AI forensic summary
        explanation = generate_ai_literacy_report(d.result_label, d.confidence, {'metrics': d.metrics or {}, 'face_cues': d.face_cues or {}}, media_type=d.media_type or "image")

        return jsonify({'status': 'success', 'report': r.to_dict(), 'detection': d.to_dict(), 'ai_summary': explanation})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'status': 'error', 'error': str(e)}), 500


@admin_bp.route('/api/admin/reports/<int:report_id>/action', methods=['POST'])
def action_report(report_id):
    try:
        data = request.get_json()
        action = data.get('action')  # 'verify'|'reject'|'action_taken'
        notes = data.get('notes')

        r = Report.query.get(report_id)
        if not r:
            return jsonify({'error': 'Not found'}), 404

        # Extended state machine with notifications
        if action == 'verify':
            r.status = 'Verified'
        elif action == 'reject':
            r.status = 'Rejected'
        elif action == 'action_taken':
            r.status = 'Action Taken'
        elif action == 'investigate':
            r.status = 'Investigating'
        elif action == 'cybercell_forward':
            r.status = 'CyberCell Forwarded'
        else:
            return jsonify({'error': 'Invalid action'}), 400

        db.session.commit()

        # Notify reporter via email using the saved reporter_email
        reporter_email = r.reporter_email

        if reporter_email:
            # Use the high-level notifications when available
            try:
                from services.notification_service import (
                    notify_report_investigating, notify_report_sent_to_cybercell,
                    notify_report_verified, notify_report_rejected, notify_report_action_taken
                )
                # Get user name from report or use default
                user_name = r.reporter_name or "User"
                if r.status == 'Investigating':
                    notify_report_investigating(reporter_email, r.id, user_name)
                elif r.status == 'CyberCell Forwarded':
                    notify_report_sent_to_cybercell(reporter_email, r.id, None, user_name)
                elif r.status == 'Verified':
                    notify_report_verified(reporter_email, r.id, user_name)
                elif r.status == 'Rejected':
                    notify_report_rejected(reporter_email, r.id, user_name)
                elif r.status == 'Action Taken':
                    notify_report_action_taken(reporter_email, r.id, user_name)
                else:
                    send_email(reporter_email, f"Report {r.id} status updated", f"Your report is now: {r.status}\nNotes: {notes or ''}")
            except Exception:
                send_email(reporter_email, f"Report {r.id} status updated", f"Your report is now: {r.status}\nNotes: {notes or ''}")

        return jsonify({'status': 'success', 'report_status': r.status})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'status': 'error', 'error': str(e)}), 500