from flask import Blueprint, request, jsonify, Response
from sqlalchemy import func, and_, desc
from datetime import datetime, timedelta
from app.models import db, Detection, Report
import io
import csv

analytics_bp = Blueprint('analytics', __name__)


def _parse_time_window():
    now = datetime.utcnow()
    window = request.args.get('window', 'all')  # Default to all-time
    if window == '7d':
        start = now - timedelta(days=7)
    elif window == '30d':
        start = now - timedelta(days=30)
    elif window == '24h':
        start = now - timedelta(hours=24)
    elif window == 'all' or window == 'lifetime':
        # Return a date far in the past to get all data
        start = now - timedelta(days=36500)  # ~100 years in the past
    else:
        # Fallback to all-time if unrecognized
        start = now - timedelta(days=36500)
    return start, now


def _filters(query):
    media = request.args.get('media')
    country = request.args.get('country')
    vstatus = request.args.get('verification_status')
    min_conf = request.args.get('min_conf', type=float)
    max_conf = request.args.get('max_conf', type=float)
    start, end = _parse_time_window()

    query = query.filter(Detection.created_at.between(start, end))
    if media:
        query = query.filter(Detection.media_type == media)
    if country:
        query = query.filter(Detection.country == country)
    if vstatus:
        query = query.filter(Detection.verification_status == vstatus)
    if min_conf is not None:
        query = query.filter(Detection.confidence >= min_conf)
    if max_conf is not None:
        query = query.filter(Detection.confidence <= max_conf)
    return query


@analytics_bp.route('/api/detections/metrics', methods=['GET'])
def metrics():
    # totals
    q = db.session.query(func.count(Detection.id))
    start, end = _parse_time_window()
    window_q = db.session.query(func.count(Detection.id)).filter(Detection.created_at.between(start, end))

    total = q.scalar() or 0
    window_total = window_q.scalar() or 0

    by_media = {
        m: db.session.query(func.count(Detection.id)).filter(Detection.media_type == m).scalar() or 0
        for m in ['image', 'video', 'audio', 'text']
    }

    return jsonify({
        'total': total,
        'window_total': window_total,
        'by_media': by_media,
        'window': request.args.get('window', '24h')
    })


@analytics_bp.route('/api/detections/top-countries', methods=['GET'])
def top_countries():
    q = db.session.query(
        Detection.country.label('country'),
        func.count(Detection.id).label('count'),
        func.avg(Detection.confidence).label('avg_conf')
    ).filter(Detection.country.isnot(None))
    q = _filters(q)
    q = q.group_by(Detection.country).order_by(desc('count')).limit(20)

    TH_HIGH_COUNT = float(request.args.get('th_high_count', 100))
    TH_HIGH_CONF = float(request.args.get('th_high_conf', 0.9))
    TH_MED_COUNT = float(request.args.get('th_med_count', 30))
    TH_MED_CONF = float(request.args.get('th_med_conf', 0.75))

    rows = []
    for r in q.all():
        threat = 'Low'
        if r.count >= TH_HIGH_COUNT and r.avg_conf >= TH_HIGH_CONF:
            threat = 'High'
        elif r.count >= TH_MED_COUNT and r.avg_conf >= TH_MED_CONF:
            threat = 'Medium'
        rows.append({
            'country': r.country,
            'count': int(r.count),
            'avg_confidence': float(r.avg_conf) if r.avg_conf is not None else None,
            'threatLevel': threat,
        })

    return jsonify(rows)


@analytics_bp.route('/api/detections/trends', methods=['GET'])
def trends():
    # Return per-hour counts in window, optionally per country
    from sqlalchemy import cast, Date
    start, end = _parse_time_window()
    country = request.args.get('country')

    q = db.session.query(
        func.strftime('%Y-%m-%d %H:00:00', Detection.created_at).label('bucket'),
        func.count(Detection.id).label('count')
    ).filter(Detection.created_at.between(start, end))

    if country:
        q = q.filter(Detection.country == country)

    media = request.args.get('media')
    if media:
        q = q.filter(Detection.media_type == media)

    q = q.group_by('bucket').order_by('bucket')

    rows = [{'ts': b, 'count': c} for b, c in q.all()]
    return jsonify(rows)


@analytics_bp.route('/api/detections/confidence-distribution', methods=['GET'])
def confidence_distribution():
    # Bins: 0.5-0.7, 0.7-0.9, 0.9-1.0 (assuming confidence in 0-1)
    bins = [
        {'label': '50-70', 'min': 0.5, 'max': 0.7},
        {'label': '70-90', 'min': 0.7, 'max': 0.9},
        {'label': '90-100', 'min': 0.9, 'max': 1.0},
    ]
    out = []
    for b in bins:
        q = db.session.query(func.count(Detection.id))
        q = _filters(q)
        q = q.filter(Detection.confidence >= b['min'], Detection.confidence < b['max'])
        out.append({'label': b['label'], 'count': q.scalar() or 0})
    return jsonify({'bins': out})


@analytics_bp.route('/api/detections/recent', methods=['GET'])
def recent_detections():
    limit = request.args.get('limit', type=int, default=12)
    q = db.session.query(Detection).order_by(Detection.created_at.desc()).limit(limit)
    rows = []
    for d in q.all():
        platform = None
        if d.reports and len(d.reports):
            platform = d.reports[0].platform
        if not platform:
            platform = d.upload_source or d.ip or 'unknown'
        rows.append({
            'id': d.id,
            'created_at': d.created_at.isoformat() if d.created_at else None,
            'media_type': d.media_type,
            'result_label': d.result_label,
            'confidence': d.confidence,
            'upload_source': d.upload_source,
            'platform': platform,
            'ip': d.ip,
            'country': d.country,
            'city': d.city,
        })
    return jsonify(rows)


@analytics_bp.route('/api/detections/top-platforms', methods=['GET'])
def top_platforms():
    q = db.session.query(
        Report.platform.label('platform'),
        func.count(Report.id).label('count'),
        func.avg(Detection.confidence).label('avg_conf')
    ).outerjoin(Detection, Report.detection_id == Detection.id
    ).filter(Report.platform.isnot(None))
    q = _filters(q)
    q = q.group_by(Report.platform).order_by(desc('count')).limit(10)

    rows = []
    for r in q.all():
        rows.append({
            'platform': r.platform,
            'count': int(r.count),
            'avg_confidence': float(r.avg_conf) if r.avg_conf is not None else None,
        })

    # Fallback to upload_source if no reports
    if not rows:
        q = db.session.query(
            Detection.upload_source.label('platform'),
            func.count(Detection.id).label('count'),
            func.avg(Detection.confidence).label('avg_conf')
        ).filter(Detection.upload_source.isnot(None))
        q = _filters(q)
        q = q.group_by(Detection.upload_source).order_by(desc('count')).limit(10)
        for r in q.all():
            rows.append({
                'platform': r.platform,
                'count': int(r.count),
                'avg_confidence': float(r.avg_conf) if r.avg_conf is not None else None,
            })

    return jsonify(rows)


@analytics_bp.route('/api/detections/export', methods=['GET'])
def export():
    # CSV export for admin mode (PDF can be added via fpdf2 if needed)
    q = db.session.query(Detection)
    q = _filters(q)

    si = io.StringIO()
    cw = csv.writer(si)
    cw.writerow(['id','ts','media_type','result_label','confidence','country','city','lat','lon','verification_status'])
    for d in q.all():
        cw.writerow([
            d.id,
            d.created_at.isoformat(),
            d.media_type,
            d.result_label,
            d.confidence,
            d.country or '',
            d.city or '',
            d.lat or '',
            d.lon or '',
            d.verification_status or ''
        ])
    output = si.getvalue()
    return Response(
        output,
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=detections_export.csv'}
    )
