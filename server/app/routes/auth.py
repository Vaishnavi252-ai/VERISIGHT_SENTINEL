from flask import Blueprint, request, jsonify, current_app, url_for, make_response
from werkzeug.security import generate_password_hash, check_password_hash
from app.models import db, User
from flask_jwt_extended import create_access_token, jwt_required, set_access_cookies, unset_jwt_cookies, get_jwt_identity
from datetime import timedelta
from itsdangerous import URLSafeTimedSerializer
import os
import requests
import smtplib
from email.message import EmailMessage

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Serializer for email verification tokens
def _get_serializer():
    secret = current_app.config.get('SECRET_KEY') or os.environ.get('FLASK_SECRET', 'change-me')
    return URLSafeTimedSerializer(secret)

def _send_verification_email(user, token):
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_pass = os.environ.get('SMTP_PASS')
    from_email = os.environ.get('FROM_EMAIL', smtp_user)
    if not smtp_host or not smtp_user or not smtp_pass:
        current_app.logger.warning('SMTP not configured, verification email not sent')
        return False

    verify_url = url_for('auth.verify_email', token=token, _external=True)
    msg = EmailMessage()
    msg['Subject'] = 'Verify your email for VeriSight Sentinel'
    msg['From'] = from_email
    msg['To'] = user.email
    msg.set_content(f'Hi {user.name or user.username},\n\nPlease verify your email by clicking the link below:\n{verify_url}\n\nIf you didn\'t request this, ignore this email.')

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        return True
    except Exception as e:
        current_app.logger.exception('Failed to send verification email: %s', e)
        return False


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    role = data.get('role', 'User')
    recaptcha_token = data.get('recaptchaToken')

    if not username or not email or not password:
        return jsonify({'msg': 'Missing required fields'}), 400

    # Verify reCAPTCHA if configured
    recaptcha_secret = os.environ.get('RECAPTCHA_SECRET')
    if recaptcha_secret:
        if not recaptcha_token:
            return jsonify({'msg': 'Missing recaptcha token'}), 400
        verify_resp = requests.post('https://www.google.com/recaptcha/api/siteverify', data={
            'secret': recaptcha_secret,
            'response': recaptcha_token
        })
        vr = verify_resp.json()
        if not vr.get('success'):
            return jsonify({'msg': 'reCAPTCHA verification failed', 'detail': vr}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'msg': 'User with that username or email already exists'}), 409

    # Create user as unverified
    user = User(username=username, email=email, name=name, password_hash=generate_password_hash(password), role=role, email_verified=False)
    db.session.add(user)
    db.session.commit()

    # Create verification token and send email
    serializer = _get_serializer()
    token = serializer.dumps({'user_id': user.id})
    user.verification_token = token
    db.session.commit()

    email_sent = _send_verification_email(user, token)

    # Send welcome email
    from services.notification_service import notify_welcome_signup
    welcome_sent = notify_welcome_signup(user.email, user.name or user.username)

    resp = {'msg': 'verification_sent'}
    if not email_sent:
        resp['warning'] = 'Verification email could not be sent. Please contact support or try resending later.'
    return jsonify(resp), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', None)

    print(f"Login attempt: username={username}, role={role}")  # Debug log

    if not username or not password:
        return jsonify({'msg': 'Missing credentials'}), 400

    # Hardcoded admin login
    if username == 'admin@123' and password == 'Vaishu2004' and role == 'Admin':
        # Create admin user if not exists
        admin_user = User.query.filter_by(username='admin@123').first()
        if not admin_user:
            admin_user = User(username='admin@123', email='admin@verisight', name='Admin', password_hash=generate_password_hash('Vaishu2004'), role='Admin', email_verified=True)
            db.session.add(admin_user)
            db.session.commit()
        access_token = create_access_token(identity=str(admin_user.id), additional_claims={'role': 'Admin'}, expires_delta=timedelta(hours=8))
        resp = jsonify({'msg': 'Logged in', 'user': admin_user.to_dict()})
        set_access_cookies(resp, access_token)
        print(f"Admin login successful")
        return resp

    user = User.query.filter_by(username=username).first()
    if not user:
        print(f"User not found: {username}")  # Debug log
        return jsonify({'msg': 'Invalid credentials'}), 401

    if not check_password_hash(user.password_hash, password):
        print(f"Invalid password for user: {username}")  # Debug log
        return jsonify({'msg': 'Invalid credentials'}), 401

    if role and user.role != role:
        print(f"Role mismatch: requested={role}, user={user.role}")  # Debug log
        return jsonify({'msg': 'Invalid role for this user'}), 403

    # Require email verification (temporarily disabled for testing)
    # if not user.email_verified:
    #     return jsonify({'msg': 'Email not verified'}), 403

    access_token = create_access_token(identity=str(user.id), additional_claims={'role': user.role}, expires_delta=timedelta(hours=8))
    resp = jsonify({'msg': 'Logged in', 'user': user.to_dict()})
    set_access_cookies(resp, access_token)
    print(f"Login successful for user: {username}, role: {user.role}")  # Debug log
    return resp


@auth_bp.route('/logout', methods=['POST'])
def logout():
    resp = jsonify({'msg': 'Logged out'})
    unset_jwt_cookies(resp)
    return resp


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    uid = get_jwt_identity()
    print(f"/me called with user id: {uid}")  # Debug log
    user = User.query.get(uid)
    if not user:
        print(f"User not found for id: {uid}")  # Debug log
        return jsonify({'msg': 'User not found'}), 404
    print(f"Returning user data for: {user.username}")  # Debug log
    return jsonify({'user': user.to_dict()})


@auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    serializer = _get_serializer()
    try:
        data = serializer.loads(token, max_age=60 * 60 * 24)  # 24 hours
        uid = data.get('user_id')
    except Exception as e:
        return jsonify({'msg': 'Invalid or expired token'}), 400

    user = User.query.get(uid)
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    user.email_verified = True
    user.verification_token = None
    db.session.commit()

    access_token = create_access_token(identity=str(user.id), additional_claims={'role': user.role}, expires_delta=timedelta(hours=8))
    frontend = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    redirect_url = f"{frontend}/verify-success"

    html = f"""<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta http-equiv=\"refresh\" content=\"4;url={redirect_url}\" />
  <title>Email Verified | VeriSight Sentinel</title>
  <style>
    body {{ margin: 0; font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; }}
    .card {{ max-width: 520px; width: 100%; padding: 32px; border-radius: 24px; background: rgba(15, 23, 42, 0.95); box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35); text-align: center; }}
    a {{ color: #38bdf8; text-decoration: none; font-weight: 700; }}
    p {{ line-height: 1.75; color: #cbd5e1; }}
  </style>
</head>
<body>
  <div class=\"card\">
    <h1>Email verified successfully!</h1>
    <p>Your account has been activated and you are being redirected to VeriSight Sentinel.</p>
    <p>If the page does not redirect automatically, <a href=\"{redirect_url}\">tap here to continue</a>.</p>
  </div>
</body>
</html>"""

    resp = make_response(html)
    resp.headers['Content-Type'] = 'text/html'
    set_access_cookies(resp, access_token)
    return resp


@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    user = None
    if username:
        user = User.query.filter_by(username=username).first()
    elif email:
        user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({'msg': 'User not found'}), 404

    if user.email_verified:
        return jsonify({'msg': 'Email already verified'}), 400

    serializer = _get_serializer()
    token = serializer.dumps({'user_id': user.id})
    user.verification_token = token
    db.session.commit()
    _send_verification_email(user, token)
    return jsonify({'msg': 'verification_sent'})