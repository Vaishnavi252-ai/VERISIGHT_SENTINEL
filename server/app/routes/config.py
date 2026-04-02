from flask import Blueprint, jsonify
import os
from services.llm_service import _llm_available, _call_chat, DEFAULT_MODEL
try:
    from openai import AuthenticationError, OpenAIError
except ImportError:
    from openai.error import AuthenticationError, OpenAIError

config_bp = Blueprint('config', __name__, url_prefix='/api')


@config_bp.route('/config', methods=['GET'])
def get_config():
    # Expose only the site key (safe) for client-side reCAPTCHA usage
    site_key = os.environ.get('RECAPTCHA_SITE_KEY')
    return jsonify({'recaptchaSiteKey': site_key})


@config_bp.route('/health/llm', methods=['GET'])
def llm_health():
    """Lightweight LLM health check used for debugging/diagnostics."""
    if not _llm_available():
        return jsonify({'status': 'error', 'reason': 'disabled', 'message': 'LLM unavailable or OPENAI_API_KEY missing'}), 200

    try:
        # Minimal check: small call to chat endpoint with low token usage
        _call_chat([{"role": "user", "content": "ping"}], max_tokens=5)
        return jsonify({'status': 'ok', 'model': DEFAULT_MODEL}), 200
    except AuthenticationError as e:
        return jsonify({'status': 'error', 'reason': 'auth', 'message': str(e)}), 200
    except OpenAIError as e:
        return jsonify({'status': 'error', 'reason': 'api_error', 'message': str(e)}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'reason': 'unknown', 'message': str(e)}), 200
