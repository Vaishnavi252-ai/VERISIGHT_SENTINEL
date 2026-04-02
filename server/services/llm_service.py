import os
import json

try:
    import openai
    try:
        from openai.error import AuthenticationError, APIError, OpenAIError
    except ImportError:
        
        from openai import AuthenticationError, APIError, OpenAIError
    HAS_OPENAI = True
except Exception:
    openai = None
    AuthenticationError = Exception
    APIError = Exception
    OpenAIError = Exception
    HAS_OPENAI = False


OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
LLM_API_KEY = OPENROUTER_KEY or OPENAI_KEY or os.getenv("LLM_API_KEY", "sk-proj-not-required-due-to-openrouter")


OPENAI_BASE = os.getenv("OPENAI_BASE_URL")
OPENROUTER_BASE = os.getenv("OPENROUTER_BASE_URL")
if OPENAI_BASE:
    LLM_API_BASE = OPENAI_BASE
elif OPENROUTER_BASE:
    LLM_API_BASE = OPENROUTER_BASE
elif OPENAI_KEY:
    LLM_API_BASE = "https://api.openai.com/v1"
else:
    LLM_API_BASE = "https://openrouter.ai/api/v1"

if HAS_OPENAI and LLM_API_KEY:
    openai.api_key = LLM_API_KEY
    if LLM_API_BASE:
        try:
            openai.api_base = LLM_API_BASE
            print('Using LLM API base:', LLM_API_BASE)
        except Exception as e:
            print('Warning: failed to set openai.api_base:', e)
    
    try:
        headers = {}
        ref = os.getenv("OPENROUTER_REFERRER") or os.getenv("OPENROUTER_HTTP_REFERER")
        title = os.getenv("OPENROUTER_SITE_NAME") or os.getenv("OPENROUTER_X_TITLE")
        if ref:
            headers["HTTP-Referer"] = ref
        if title:
            headers["X-Title"] = title
        if headers:
            openai.default_headers = headers
    except Exception:
        pass

DEFAULT_MODEL = os.getenv("OPENROUTER_MODEL") or os.getenv("OPENAI_MODEL") or "openrouter/auto"


def _llm_available():
    return HAS_OPENAI and bool(LLM_API_KEY)


def _call_chat(messages, max_tokens=500, temperature=0.2):
    if not _llm_available():
        raise AuthenticationError("Missing OPENROUTER_API_KEY or OPENAI_API_KEY")

    # Helpful debugging: if user attempts to use Gemini model names without proper base URL
    if 'gemini' in (DEFAULT_MODEL or '').lower() and not LLM_API_BASE:
        print('Warning: DEFAULT_MODEL mentions Gemini but base URL is not set. Ensure Gemini-compatible endpoint is configured.')

    try:
        
        version = getattr(openai, '__version__', '0.0')
        major_version = 0
        try:
            major_version = int(str(version).split('.')[0])
        except Exception:
            pass

        if major_version >= 1:
            
            resp = openai.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        else:
            # Backward compatibility for openai <1.0
            resp = openai.ChatCompletion.create(
                model=DEFAULT_MODEL,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        return resp

    except AuthenticationError as e:
        print('LLM AuthenticationError:', str(e))
        
        raise
    except OpenAIError as e:
        
        print('LLM OpenAIError:', str(e))
        raise


def generate_ai_literacy_report(detection_result, confidence, technical_features, media_type="image"):
    """
    Generate detailed AI Literacy Report with 8-section structured format for image/video/audio/text.
    Returns full parsed JSON matching user's comprehensive output format.
    """

    # Basic validation
    if not _llm_available():
        return {
            "1_final_verdict": {"classification": "Inconclusive", "confidence_score": 0, "risk_level": "Unknown"},
            "2_ai_literacy_explanation": "LLM unavailable - API key missing or invalid",
            "3_key_detection_indicators": {},
            "4_frame_analysis": "N/A",
            "5_technical_signals": {},
            "6_limitations": "Language model service unavailable",
            "7_trust_score_breakdown": {},
            "8_final_summary": "Please try again later when LLM service is available."
        }

    system = {
        "role": "system",
        "content": """You are an expert AI Forensics Analyst specialized in detecting deepfakes and AI-generated content.

CRITICAL RULES:
- Be strictly evidence-based. Do NOT guess or hallucinate.
- If uncertain, clearly state "inconclusive".
- NEVER use 'N/A'. ALWAYS provide 0-10 score + reason for every param (e.g. '0/10 - Image static, no blink').
- Keep explanations concise (2-3 lines each section).
- Return ONLY valid JSON. No extra text before or after."""
    }

    # Determine media-specific notes
    is_video = media_type.lower() in ["video", "mov", "mp4", "avi", "webm"]
    is_audio = media_type.lower() in ["audio", "mp3", "wav", "aac", "m4a"]
    
    prompt = f"""You are analyzing a {media_type} for AI-generated or deepfake content.

DETECTION INPUT:
- Content Type: {media_type.upper()}
- Detection Result: {detection_result}
- Confidence Score: {confidence:.1%}
- Technical Features Detected: {json.dumps(technical_features)}

OUTPUT INSTRUCTIONS:
Return ONLY valid JSON with these EXACT 8 sections. Use numeric scores 0-10 only where evidence supports. Mark unavailable sections as "N/A".

For VIDEO: Include temporal/motion analysis (sections 4, 5 temporal parts).
For AUDIO: Focus on voice consistency, synthesis artifacts, timing.
For TEXT/IMAGE: Mark motion/frame analysis as N/A.

Return this JSON structure exactly:"""

    # Build the JSON template dynamically based on media type
    json_template = {
        "1_final_verdict": {
            "classification": "[Real|Fake|Likely Fake|Inconclusive - pick one based ONLY on evidence]",
            "confidence_score": "[0-100, match detection result]",
            "risk_level": "[Low|Medium|High]"
        },
        "2_ai_literacy_explanation": "[2-3 simple lines explaining why real/fake based ONLY on visible evidence. Understandable to non-technical users.]",
        "3_key_detection_indicators": {
            "facial_analysis": {
                "symmetry": "[score 0-10 + brief reason or 'N/A']",
                "skin_texture": "[score 0-10 + brief reason or 'N/A']",
"eye_blink": "[0-10 score + reason based on evidence]",
"lip_sync": "[0-10 score + reason; image/audio: 0/10 - No motion data]"
            },
            "lighting_shadows": {
                "light_consistency": "[score 0-10 + brief reason]",
                "shadow_consistency": "[score 0-10 + brief reason]"
            },
            "motion_temporal": {
"frame_consistency": "[0-10 score + reason if video; other: 0/10 - No frames] ",
"flicker_warping": "[0-10 score + reason if video; other: 0/10 - Static media]"
            },
            "background_environment": {
                "distortion": "[score 0-10 + reason]",
                "depth_realism": "[score 0-10 + reason]"
            },
            "compression_artifacts": {
                "gan_artifacts": "[score 0-10 + reason]",
                "noise_inconsistency": "[score 0-10 + reason]",
                "edge_mismatch": "[score 0-10 + reason]"
            }
        },
"4_frame_analysis": "[Video: suspicious frames; image/audio/text: 'No temporal analysis - static/single modality media']",
        "5_technical_signals": {
            "gan_probability": "[% estimate or 'Unable to determine']",
            "frequency_inconsistency": "[score 0-10 + reason]",
"temporal_instability": "[0-10 score + reason if video; other: 0/10 - No video motion]"
        },
        "6_limitations": "[Mention: low resolution, missing frames, limited model confidence, or 'None identified']",
        "7_trust_score_breakdown": {
            "visual_consistency": "[score 0-10]",
"motion_consistency": "[0-10 score + reason if video; other: 0/10 - Static media]",
            "lighting_accuracy": "[score 0-10]",
            "facial_realism": "[score 0-10]",
            "overall_authenticity": "[score 0-10]"
        },
        "8_final_summary": "[Short 2-3 line conclusion: classification + strongest evidence + confidence level]"
    }

    prompt += "\n\n" + json.dumps(json_template, indent=2)
    prompt += """

RESPONSE RULES:
- All scores must be 0-10 based on visible evidence only.
- No assumptions beyond the content.
- Justify every score with brief evidence.
For inapplicable (blink on image): score 0 + explain why not applicable.
- Return ONLY the JSON object, no surrounding text."""

    try:
        res = _call_chat([system, {"role": "user", "content": prompt}], max_tokens=1500)
        
        # Extract content from response
        content = None
        try:
            content = res.choices[0].message.get("content") or res.choices[0].message["content"]
        except Exception:
            content = getattr(res.choices[0], 'text', None) or str(res)

        content = (content or "").strip()

        # Parse JSON - tolerate surrounding text
        first_brace = content.find("{")
        last_brace = content.rfind("}")
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            json_text = content[first_brace:last_brace+1]
            try:
                parsed = json.loads(json_text)
                print(f"✅ AI Literacy Report generated: {detection_result} ({media_type})")
                return parsed
            except json.JSONDecodeError as je:
                print(f"JSON parse error: {je}, attempting raw content fallback")
        
        # If JSON parsing failed, return graceful fallback
        print(f"⚠️ LLM response not JSON-parsable, using fallback")
        fallback = {
            "1_final_verdict": {
                "classification": detection_result.upper() if detection_result else "Inconclusive",
                "confidence_score": int(confidence * 100) if confidence else 0,
                "risk_level": "High" if "fake" in str(detection_result).lower() else "Low"
            },
            "2_ai_literacy_explanation": f"Model detected {detection_result} with {confidence:.1%} confidence. Detailed LLM analysis unavailable.",
            "3_key_detection_indicators": json.loads(json.dumps(technical_features)) if technical_features else {},
"4_frame_analysis": "Service error; frame analysis based on model confidence: {confidence} - no blink anomalies detected",
            "5_technical_signals": {"note": "LLM response parse failed"},
            "6_limitations": "LLM response not properly formatted as JSON",
            "7_trust_score_breakdown": {"overall_authenticity": int((1 - confidence) * 10) if confidence else 5},
            "8_final_summary": f"Technical detection: {detection_result}. AI explanation temporarily unavailable. Contact support if issue persists."
        }
        return fallback

    except AuthenticationError as e:
        print(f"LLM Auth Error: {str(e)}")
        return {
            "1_final_verdict": {"classification": "Inconclusive", "confidence_score": 0, "risk_level": "Unknown"},
            "2_ai_literacy_explanation": "LLM authentication failed",
            "3_key_detection_indicators": {},
            "4_frame_analysis": "N/A",
            "5_technical_signals": {},
            "6_limitations": f"Authentication error: {str(e)[:50]}",
            "7_trust_score_breakdown": {},
            "8_final_summary": "Please check your LLM API credentials and try again."
        }
    except OpenAIError as e:
        print(f"LLM API Error: {str(e)}")
        return {
            "1_final_verdict": {"classification": "Inconclusive", "confidence_score": 0, "risk_level": "Unknown"},
            "2_ai_literacy_explanation": "LLM service error",
            "3_key_detection_indicators": {},
            "4_frame_analysis": "N/A",
            "5_technical_signals": {},
            "6_limitations": f"API error: {str(e)[:50]}",
            "7_trust_score_breakdown": {},
            "8_final_summary": "LLM service encountered an error. Please try again shortly."
        }
    except Exception as e:
        print(f"Unexpected error in AI Literacy Report: {str(e)}")
        return {
            "1_final_verdict": {"classification": "Inconclusive", "confidence_score": 0, "risk_level": "Unknown"},
            "2_ai_literacy_explanation": f"Unexpected error: {str(e)[:60]}",
            "3_key_detection_indicators": {},
            "4_frame_analysis": "N/A",
            "5_technical_signals": {},
            "6_limitations": "Unexpected service error",
            "7_trust_score_breakdown": {},
            "8_final_summary": "An unexpected error occurred. Please try again or contact support."
        }



def generate_report_questions(media_type, confidence, result_label):
    """
    Generate 7-8 customized questions for user reporting flow.
    Returns list of question objects: {"id":..., "type":"mcq|yesno|short|long", "question":"...","options":[]}
    """
    if not _llm_available():
        # Fallback static questions
        base_questions = [
            {"type": "yesno", "question": "Is the person in this media known to you?"},
            {"type": "yesno", "question": "Has this content caused harm or distress?"},
            {"type": "yesno", "question": "Is this being widely shared?"},
            {"type": "yesno", "question": "Do you consent to share this with authorities?"},
            {"type": "long", "question": "Additional remarks (optional)"}
        ]
        return base_questions

    system = {
        "role": "system",
        "content": "You are a forensic analyst generating investigative questions for law enforcement style reporting. Return a JSON array of 6-8 question objects. Each object must include: type (mcq|yesno|short|long), question (string), options (array). Be specific and tailored to the media type, detection, and confidence."
    }

    prompt = f"You are a forensic analyst. The user uploaded a {media_type} detected as {result_label} with confidence {confidence:.2f}. Generate 6 tailored investigative questions useful for reporting to authorities. Return only a JSON array under 400 tokens."

    try:
        res = _call_chat([system, {"role": "user", "content": prompt}], max_tokens=400)
        
        try:
            content = res.choices[0].message.get("content") or res.choices[0].message["content"]
        except Exception:
            content = getattr(res.choices[0], 'text', None) or str(res)
        content = (content or "").strip()

        # try to extract JSON array from reply
        first = content.find("[")
        last = content.rfind("]")
        if first != -1 and last != -1:
            content = content[first:last+1]

        parsed = json.loads(content)
        out = []
        for q in parsed:
            out.append({
                "type": q.get("type", "short"),
                "question": q.get("question", ""),
                "options": q.get("options", [])
            })
        return out
    except Exception as e:
        # Fallback static questions on error
        return [
            {"type": "yesno", "question": "Is the person in this media known to you?"},
            {"type": "yesno", "question": "Has this content caused harm or distress?"},
            {"type": "yesno", "question": "Is this being widely shared?"},
            {"type": "yesno", "question": "Do you consent to share with authorities?"},
            {"type": "long", "question": "Additional remarks"}
        ]
