from flask import Flask, jsonify
from flask_cors import CORS
import os

os.environ.setdefault('TF_ENABLE_ONEDNN_OPTS','0')
from app.routes import (
    audio_scan_bp,
    image_scan_bp,
    video_scan_bp, 
    auth_bp,
    config_bp,
    reports_bp,
    admin_bp,
    analytics_bp,
    stream_bp,
    analytics_explain_bp,
    text_scan_bp
)
from app.models import db, User, Detection
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv
import torch
from torchvision import models
import torch.nn as nn

# --------------------------------------------------
# Load environment variables
# --------------------------------------------------
load_dotenv()

app = Flask(__name__)

# --------------------------------------------------
# Flask Config
# --------------------------------------------------
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET', 'change-me')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL', 'sqlite:///auth.db'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# app.config['SERVER_NAME'] = '192.168.1.25:5000'  # Commented out for development

# --------------------------------------------------
# JWT Config
# --------------------------------------------------
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET', 'change-this-secret')
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_COOKIE_SECURE'] = False
app.config['JWT_COOKIE_SAMESITE'] = 'Lax'
app.config['JWT_COOKIE_CSRF_PROTECT'] = False

# ==================================================
# CORS CONFIG
# ==================================================
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    supports_credentials=True
)

# --------------------------------------------------
# Initialize extensions
# --------------------------------------------------
db.init_app(app)
jwt = JWTManager(app)

# --------------------------------------------------
# Create DB tables
# --------------------------------------------------
with app.app_context():
    db.create_all()

    # Add test users for development
    from werkzeug.security import generate_password_hash
    if User.query.count() == 0:
        test_users = [
            User(
                username='admin',
                email='admin@verisight.com',
                name='Admin User',
                password_hash=generate_password_hash('admin123'),
                role='Admin',
                email_verified=True
            ),
            User(
                username='user',
                email='user@verisight.com',
                name='Test User',
                password_hash=generate_password_hash('user123'),
                role='User',
                email_verified=True
            )
        ]
        for user in test_users:
            db.session.add(user)
        db.session.commit()
        print("Test users created: admin/admin123 (Admin), user/user123 (User)")

    print(f"Database initialized with {User.query.count()} users and {Detection.query.count()} detections")

    # Add dummy detections for testing
    from datetime import datetime, timedelta
    if Detection.query.count() == 0:
        dummies = [
            Detection(
                user_id=None,
                media_type='image',
                result_label='FAKE',
                confidence=0.85,
                file_path='dummy.jpg',
                ip='127.0.0.1',
                country='IN',
                city='Mumbai',
                lat=19.0760,
                lon=72.8777,
                verification_status='unverified',
                created_at=datetime.utcnow() - timedelta(hours=2)
            ),
            Detection(
                user_id=None,
                media_type='video',
                result_label='REAL',
                confidence=0.92,
                file_path='dummy.mp4',
                ip='127.0.0.1',
                country='US',
                city='New York',
                lat=40.7128,
                lon=-74.0060,
                verification_status='verified',
                created_at=datetime.utcnow() - timedelta(hours=5)
            ),
            Detection(
                user_id=None,
                media_type='image',
                result_label='FAKE',
                confidence=0.78,
                file_path='dummy2.jpg',
                ip='127.0.0.1',
                country='DE',
                city='Berlin',
                lat=52.5200,
                lon=13.4050,
                verification_status='flagged',
                created_at=datetime.utcnow() - timedelta(hours=10)
            ),
            Detection(
                user_id=None,
                media_type='audio',
                result_label='FAKE',
                confidence=0.95,
                file_path='dummy.wav',
                ip='127.0.0.1',
                country='GB',
                city='London',
                lat=51.5074,
                lon=-0.1278,
                verification_status='unverified',
                created_at=datetime.utcnow() - timedelta(hours=1)
            ),
        ]
        for dummy in dummies:
            db.session.add(dummy)
        db.session.commit()
        print('✅ Added dummy detections for testing')

    # Ensure migrations for small schema changes in dev environments
    try:
        from sqlalchemy import text
        cols = [r[1] for r in db.session.execute(text("PRAGMA table_info(detections)")).fetchall()]
        if 'generated_questions' not in cols:
            print('🔧 Adding missing column detections.generated_questions')
            db.session.execute(text("ALTER TABLE detections ADD COLUMN generated_questions JSON"))
            db.session.commit()
            print('✅ Added detections.generated_questions column')
        if 'upload_source' not in cols:
            print('🔧 Adding missing column detections.upload_source')
            try:
                db.session.execute(text("ALTER TABLE detections ADD COLUMN upload_source TEXT"))
                db.session.commit()
                print('✅ Added detections.upload_source column')
            except Exception as e:
                print('Warning: failed to add detections.upload_source', e)
        # New geo and status fields for analytics
        if 'ip' not in cols:
            print('🔧 Adding missing column detections.ip')
            try:
                db.session.execute(text("ALTER TABLE detections ADD COLUMN ip TEXT"))
                db.session.commit()
                print('✅ Added detections.ip column')
            except Exception as e:
                print('Warning: failed to add detections.ip', e)
        if 'country' not in cols:
            print('🔧 Adding missing column detections.country')
            try:
                db.session.execute(text("ALTER TABLE detections ADD COLUMN country TEXT"))
                db.session.commit()
                print('✅ Added detections.country column')
            except Exception as e:
                print('Warning: failed to add detections.country', e)
        if 'city' not in cols:
            print('🔧 Adding missing column detections.city')
            try:
                db.session.execute(text("ALTER TABLE detections ADD COLUMN city TEXT"))
                db.session.commit()
                print('✅ Added detections.city column')
            except Exception as e:
                print('Warning: failed to add detections.city', e)
        if 'lat' not in cols:
            print('🔧 Adding missing column detections.lat')
            try:
                db.session.execute(text("ALTER TABLE detections ADD COLUMN lat REAL"))
                db.session.commit()
                print('✅ Added detections.lat column')
            except Exception as e:
                print('Warning: failed to add detections.lat', e)
        if 'lon' not in cols:
            print('🔧 Adding missing column detections.lon')
            try:
                db.session.execute(text("ALTER TABLE detections ADD COLUMN lon REAL"))
                db.session.commit()
                print('✅ Added detections.lon column')
            except Exception as e:
                print('Warning: failed to add detections.lon', e)
        if 'verification_status' not in cols:
            print('🔧 Adding missing column detections.verification_status')
            try:
                db.session.execute(text("ALTER TABLE detections ADD COLUMN verification_status TEXT"))
                db.session.commit()
                print('✅ Added detections.verification_status column')
            except Exception as e:
                print('Warning: failed to add detections.verification_status', e)

        # Check and add columns to reports table
        try:
            cols_reports = [r[1] for r in db.session.execute(text("PRAGMA table_info(reports)")).fetchall()]
            if 'reporter_email' not in cols_reports:
                print('🔧 Adding missing column reports.reporter_email')
                db.session.execute(text("ALTER TABLE reports ADD COLUMN reporter_email TEXT"))
                db.session.commit()
                print('✅ Added reports.reporter_email column')
            if 'country' not in cols_reports:
                print('🔧 Adding missing column reports.country')
                db.session.execute(text("ALTER TABLE reports ADD COLUMN country TEXT"))
                db.session.commit()
                print('✅ Added reports.country column')
        except Exception as e:
            print('Warning: failed to ensure schema migration for reports table', e)
    except Exception as e:
        print('Warning: failed to ensure schema migration for detections table', e)

# --------------------------------------------------
# Register Blueprints
# --------------------------------------------------
app.register_blueprint(audio_scan_bp)
app.register_blueprint(image_scan_bp)
app.register_blueprint(video_scan_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(config_bp)
app.register_blueprint(reports_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(stream_bp)
app.register_blueprint(analytics_explain_bp)
app.register_blueprint(text_scan_bp)

# --------------------------------------------------
# Serve extracted video frames
# --------------------------------------------------
app.static_folder = "uploads"

@app.route("/video_frames/<path:filename>")
def serve_frames(filename):
    return app.send_static_file(f"video_frames/{filename}")

# Serve uploaded files under /uploads/<path>
from flask import send_from_directory
@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    # static folder already points at uploads/ but we use send_from_directory for clarity
    try:
        return send_from_directory(app.static_folder, filename)
    except Exception as e:
        return jsonify({'error': 'File not found'}), 404

# --------------------------------------------------
# Root route
# --------------------------------------------------
@app.route("/")
def home():
    return jsonify({
        "message": "✅ VeriSight Sentinel backend is running successfully!"
    })

# --------------------------------------------------
# WSGI entry point
# --------------------------------------------------
application = app

# --------------------------------------------------
# Local Run
# --------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000, threaded=True)
