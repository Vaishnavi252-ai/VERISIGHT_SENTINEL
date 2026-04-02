from .audio_scan import audio_scan_bp
from .image_scan import image_scan_bp
from .video_scan import video_scan_bp
from .auth import auth_bp
from .config import config_bp
from .reports import reports_bp
from .admin import admin_bp
from .analytics import analytics_bp
from .detections_stream import stream_bp
from .analytics_explain import analytics_explain_bp
from .text_scan import text_scan_bp

__all__ = [
    'audio_scan_bp',
    'image_scan_bp', 
    'video_scan_bp',
    'auth_bp',
    'config_bp',
    'reports_bp',
    'admin_bp',
    'analytics_bp',
    'stream_bp',
    'analytics_explain_bp',
    'text_scan_bp'
]
