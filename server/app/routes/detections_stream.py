from flask import Blueprint, Response, request
from services.event_bus import bus, format_sse
import queue

stream_bp = Blueprint('stream', __name__)


@stream_bp.route('/api/detections/stream')
def detections_stream():
    q = bus.subscribe()

    def gen():
        try:
            while True:
                try:
                    event = q.get(timeout=30)
                except queue.Empty:
                    # heartbeat comment to keep connection alive
                    yield ': keep-alive\n\n'
                    continue
                yield format_sse(event, event='detection')
        finally:
            bus.unsubscribe(q)

    headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
    }
    return Response(gen(), headers=headers)
