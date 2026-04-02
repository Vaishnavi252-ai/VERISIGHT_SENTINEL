import json
import queue
import threading
import time
from typing import Dict, List

# Simple thread-safe pub/sub for server-side events (e.g., SSE)

class EventBus:
    def __init__(self, max_queue_size: int = 1000):
        self._subscribers: List[queue.Queue] = []
        self._lock = threading.Lock()
        self._max_queue_size = max_queue_size

    def subscribe(self) -> queue.Queue:
        q = queue.Queue(maxsize=self._max_queue_size)
        with self._lock:
            self._subscribers.append(q)
        return q

    def unsubscribe(self, q: queue.Queue):
        with self._lock:
            try:
                self._subscribers.remove(q)
            except ValueError:
                pass

    def publish(self, event: Dict):
        dead = []
        with self._lock:
            for q in self._subscribers:
                try:
                    q.put_nowait(event)
                except queue.Full:
                    # Drop slow subscriber
                    dead.append(q)
            for q in dead:
                try:
                    self._subscribers.remove(q)
                except ValueError:
                    pass

# Global singleton
bus = EventBus()


def format_sse(data: Dict, event: str = None) -> str:
    payload = json.dumps(data, default=str)
    msg = ""
    if event:
        msg += f"event: {event}\n"
    # data must be single-line per SSE spec; JSON is fine
    msg += f"data: {payload}\n\n"
    return msg
