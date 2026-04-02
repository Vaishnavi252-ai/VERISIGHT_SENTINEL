from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='User')
    email_verified = db.Column(db.Boolean, default=False, nullable=False)
    verification_token = db.Column(db.String(256), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'created_at': self.created_at.isoformat()
        }


class Detection(db.Model):
    __tablename__ = 'detections'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    media_type = db.Column(db.String(20), nullable=False, index=True)
    result_label = db.Column(db.String(10), nullable=False)
    confidence = db.Column(db.Float, nullable=False, index=True)
    file_path = db.Column(db.String(512), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    # store raw metrics and face cues as JSON strings
    metrics = db.Column(db.JSON, nullable=True)
    face_cues = db.Column(db.JSON, nullable=True)
    # store generated report questions to avoid re-generation and duplicates
    generated_questions = db.Column(db.JSON, nullable=True)
    # source info (uploader IP, client id, or other provenance)
    upload_source = db.Column(db.String(128), nullable=True)
    ip = db.Column(db.String(64), nullable=True)
    country = db.Column(db.String(2), nullable=True, index=True)  # ISO country code
    city = db.Column(db.String(128), nullable=True)
    lat = db.Column(db.Float, nullable=True)
    lon = db.Column(db.Float, nullable=True)
    verification_status = db.Column(db.String(20), nullable=True, index=True)  # e.g., unverified|verified|flagged

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'media_type': self.media_type,
            'result_label': self.result_label,
            'confidence': self.confidence,
            'file_path': self.file_path,
            'metrics': self.metrics,
            'face_cues': self.face_cues,
            'created_at': self.created_at.isoformat(),
            'ip': self.ip,
            'country': self.country,
            'city': self.city,
            'lat': self.lat,
            'lon': self.lon,
            'verification_status': self.verification_status,
        }


class Report(db.Model):
    __tablename__ = 'reports'
    id = db.Column(db.Integer, primary_key=True)
    detection_id = db.Column(db.Integer, db.ForeignKey('detections.id'), nullable=False)
    status = db.Column(db.String(30), default='Submitted')
    platform = db.Column(db.String(128), nullable=True)
    geo_location = db.Column(db.String(128), nullable=True)
    urgency_level = db.Column(db.String(30), nullable=True)
    reporter_email = db.Column(db.String(120), nullable=True)
    country = db.Column(db.String(128), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    detection = db.relationship('Detection', backref='reports')
    answers = db.relationship('ReportAnswer', backref='report', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'detection_id': self.detection_id,
            'status': self.status,
            'platform': self.platform,
            'geo_location': self.geo_location,
            'urgency_level': self.urgency_level,
            'reporter_email': self.reporter_email,
            'country': self.country,
            'created_at': self.created_at.isoformat(),
            'answers': [a.to_dict() for a in self.answers]
        }


class ReportAnswer(db.Model):
    __tablename__ = 'report_answers'
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey('reports.id'), nullable=False)
    question = db.Column(db.String(512), nullable=False)
    answer = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'question': self.question,
            'answer': self.answer
        }
