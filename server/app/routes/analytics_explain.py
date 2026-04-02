from flask import Blueprint, request, jsonify
from services import llm_service as llm
import json

analytics_explain_bp = Blueprint('analytics_explain', __name__)

@analytics_explain_bp.route('/api/analytics/explain', methods=['POST'])
def analytics_explain():
    try:
        data = request.get_json(force=True) or {}
        prompt = data.get('prompt', '')
        context = data.get('context', {})

        sys = {
            'role': 'system',
            'content': (
                "You are a cybersecurity and media forensics analyst. "
                "Answer in short conversational text only. Do not return JSON, YAML, code blocks, or tables. "
                "Use only the provided analytics context. If the data is insufficient to answer precisely, say so clearly. "
                "Do not invent numbers or details that are not present in the context. "
                "If the user asks something outside the available data, answer politely that you cannot verify it from the current dataset."
            ),
        }
        user = {
            'role': 'user',
            'content': (
                "User question: " + str(prompt) + "\n\n"
                "Analytics context (JSON):\n" + json.dumps(context) + "\n\n"
                "Requirements:\n"
                "- Be specific: reference countries, time windows, counts, and confidence bins.\n"
                "- Highlight relevant spikes or anomalies found in the data.\n"
                "- For chart-related queries, explain what the data shows rather than describing visuals.\n"
                "- If the dataset is too small or missing fields, say that the answer is limited by the available analytics context.\n"
            ),
        }

        try:
            res = llm._call_chat([sys, user], max_tokens=360)
            # robust extraction
            content = None
            try:
                msg = res.choices[0].message
                content = msg.get('content') if isinstance(msg, dict) else getattr(msg, 'content', None)
            except Exception:
                content = getattr(res.choices[0], 'text', None) or str(res)
            content = (content or '').strip()
            # If model returns JSON text, try to extract message/text fields
            if content.startswith('{') or content.startswith('['):
                try:
                    parsed = json.loads(content)
                    if isinstance(parsed, dict):
                        content = parsed.get('message') or parsed.get('text') or parsed.get('summary') or json.dumps(parsed)
                    else:
                        content = json.dumps(parsed)
                    content = content.strip()
                except Exception:
                    pass
            if not content:
                content = 'The analytics assistant could not generate a response from the provided data.'
        except Exception as e:
            return jsonify({'status': 'error', 'error': str(e), 'message': 'Analytics assistant failed to generate a response.'}), 500

        return jsonify({'message': content, 'supporting_stats': {}})
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500
