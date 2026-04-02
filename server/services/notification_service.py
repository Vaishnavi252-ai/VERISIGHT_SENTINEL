import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)


def send_email(to_email, subject, body):
    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = FROM_EMAIL
        msg["To"] = to_email
        msg.set_content(body)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.starttls()
            s.login(SMTP_USER, SMTP_PASS)
            s.send_message(msg)
        return True
    except Exception as e:
        print("Email send error:", e)
        return False


def send_email_with_attachment(to_email, subject, body, attachment_data, attachment_filename):
    try:
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        from email.mime.base import MIMEBase
        from email import encoders

        msg = MIMEMultipart()
        msg['Subject'] = subject
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email

        # Add body
        msg.attach(MIMEText(body, 'plain'))

        # Add attachment
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(attachment_data)
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', f'attachment; filename={attachment_filename}')
        msg.attach(part)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.starttls()
            s.login(SMTP_USER, SMTP_PASS)
            s.send_message(msg)
        return True
    except Exception as e:
        print("Email attachment send error:", e)
        return False


def send_sms_placeholder(number, body):
    # Placeholder to be implemented by SMS provider (Twilio, MessageBird, etc.)
    print(f"SMS placeholder: to={number} body={body}")
    return True


# ------------------- Authentication Notifications -------------------
def notify_welcome_signup(to_email, user_name="User", platform_name="VeriSight Sentinel"):
    if not to_email:
        return False
    subject = f"Welcome to {platform_name}!"
    body = f"""Hi {user_name},

Welcome to {platform_name}! We're excited to have you join our community.

Your account has been successfully created. You can now:

🔍 Scan and detect deepfakes
📊 Access analytics and insights
🛡️ Help keep our platform safe by reporting suspicious content

If you have any questions, feel free to reach out to our support team.

Thank you for choosing {platform_name}!

Best regards,
The {platform_name} Team"""
    return send_email(to_email, subject, body)


def notify_login_activity(to_email, user_name="User", platform_name="VeriSight Sentinel"):
    if not to_email:
        return False
    from datetime import datetime
    current_time = datetime.now().strftime("%B %d, %Y at %I:%M %p")

    subject = f"New Login to Your {platform_name} Account"
    body = f"""Hi {user_name},

We noticed a new login to your {platform_name} account.

📅 **Login Time:** {current_time}
🌐 **If this was you:** No action needed
⚠️ **If this wasn't you:** Please change your password immediately and contact support

For your security, we recommend enabling two-factor authentication in your account settings.

If you have any concerns, please don't hesitate to contact our support team.

Stay safe,
Security Team
{platform_name}"""
    return send_email(to_email, subject, body)


# ------------------- High-level Report Notifications -------------------
def notify_report_received(to_email, report_id, user_name="User", platform_name="VeriSight Sentinel"):
    if not to_email:
        return False
    from datetime import datetime
    current_date = datetime.now().strftime("%B %d, %Y")

    subject = f"Report Received - #{report_id}"
    body = f"""Hi {user_name},

Thank you for submitting your report. We've successfully received it and our security team has started reviewing the details.

🔎 **Case ID:** {report_id}
📅 **Submitted on:** {current_date}
📌 **Current Status:** Under Review

Our analysts will carefully investigate the issue and update you as soon as we have progress. Most cases are reviewed within 24–48 hours.

If you have additional information or screenshots that could help, you can reply directly to this email.

We appreciate you helping us keep the platform safe.

Warm regards,
Cyber Safety Team
{platform_name}"""
    return send_email(to_email, subject, body)


def notify_report_investigating(to_email, report_id, user_name="User", platform_name="VeriSight Sentinel"):
    if not to_email:
        return False
    subject = f"Report Under Investigation - #{report_id}"
    body = f"""Hello {user_name},

Thanks for reporting this issue. Here's the current progress of your case:

✅ Report received
✅ Assigned to CyberCell team
🔄 Investigation in progress
⬜ Action/Resolution pending

**Case Reference:** #{report_id}

Our team is actively analyzing the report and will notify you once action has been taken. You can expect an update shortly.

Have more details to share? Simply reply to this message.

Thank you for helping us maintain a safe community.

Best regards,
Support & CyberCell Team
{platform_name}"""
    return send_email(to_email, subject, body)


def notify_report_sent_to_cybercell(to_email, report_id, case_id=None, user_name="User", platform_name="VeriSight Sentinel"):
    if not to_email:
        return False
    subject = f"Report Forwarded to CyberCell - #{report_id}"
    body = f"""Hi {user_name},

We've received your report and our investigation team is currently reviewing it.

**Case ID:** #{report_id}
**Status:** Forwarded to CyberCell
**Reference:** {case_id or 'N/A'}

Our specialized CyberCell team has taken over the investigation. They'll conduct a thorough analysis and keep you updated on the progress.

Thanks for your patience and for keeping our platform secure.

– Support Team
{platform_name}"""
    return send_email(to_email, subject, body)


def notify_report_verified(to_email, report_id, user_name="User", platform_name="VeriSight Sentinel"):
    if not to_email:
        return False
    subject = f"Report Verified - #{report_id}"
    body = f"""Hi {user_name},

Your report has been verified and action is being taken.

**Case ID:** #{report_id}
**Status:** Verified - Action in Progress

Our team has confirmed the findings as legitimate. Appropriate mitigation measures are now being implemented.

Thank you for helping us maintain platform security.

Best regards,
Cyber Safety Team
{platform_name}"""
    return send_email(to_email, subject, body)


def notify_report_rejected(to_email, report_id, user_name="User", platform_name="VeriSight Sentinel"):
    if not to_email:
        return False
    subject = f"Report Status Update - #{report_id}"
    body = f"""Hi {user_name},

We've completed our review of your report.

**Case ID:** #{report_id}
**Status:** Review Complete

After careful analysis, this report doesn't meet our current verification criteria. If you have additional evidence or context, you're welcome to submit a new report.

We appreciate your vigilance in helping keep our platform safe.

Best regards,
Support Team
{platform_name}"""
    return send_email(to_email, subject, body)


def notify_report_action_taken(to_email, report_id, user_name="User", platform_name="VeriSight Sentinel"):
    if not to_email:
        return False
    subject = f"Action Taken on Report - #{report_id}"
    body = f"""Hi {user_name},

Action has been completed on your report.

**Case ID:** #{report_id}
**Status:** Resolved - Action Taken

The reported content has been addressed and appropriate mitigation measures have been implemented.

Thank you for your contribution to keeping our platform secure.

Best regards,
Cyber Safety Team
{platform_name}"""
    return send_email(to_email, subject, body)
