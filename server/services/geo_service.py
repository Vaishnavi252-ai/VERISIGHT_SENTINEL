import os
import time
import threading
from typing import Optional, Dict, Any

import requests

# Simple in-memory cache with TTL to avoid rate limits
class TTLCache:
    def __init__(self, ttl_seconds: int = 3600, max_size: int = 10000):
        self.ttl = ttl_seconds
        self.max_size = max_size
        self._data: Dict[str, Any] = {}
        self._lock = threading.Lock()

    def get(self, key: str):
        now = time.time()
        with self._lock:
            entry = self._data.get(key)
            if not entry:
                return None
            value, ts = entry
            if now - ts > self.ttl:
                del self._data[key]
                return None
            return value

    def set(self, key: str, value: Any):
        with self._lock:
            if len(self._data) >= self.max_size:
                # simple eviction: pop an arbitrary key
                self._data.pop(next(iter(self._data)))
            self._data[key] = (value, time.time())

_cache = TTLCache(ttl_seconds=int(os.getenv('GEO_CACHE_TTL', '7200')))

GEO_PROVIDER = os.getenv('GEO_PROVIDER', 'ipapi').lower()  # 'ipapi' or 'ipinfo'
IPINFO_TOKEN = os.getenv('IPINFO_TOKEN')


def _fetch_ipapi(ip: str) -> Optional[Dict[str, Any]]:
    try:
        # ip-api.com JSON endpoint; supports http and https. Limited free tier.
        resp = requests.get(f"http://ip-api.com/json/{ip}", timeout=5)
        if resp.status_code != 200:
            return None
        j = resp.json()
        if j.get('status') != 'success':
            return None
        return {
            'country': j.get('countryCode'),
            'city': j.get('city'),
            'lat': j.get('lat'),
            'lon': j.get('lon'),
        }
    except Exception:
        return None


def _fetch_ipinfo(ip: str) -> Optional[Dict[str, Any]]:
    if not IPINFO_TOKEN:
        return None
    try:
        headers = {"Authorization": f"Bearer {IPINFO_TOKEN}"}
        resp = requests.get(f"https://ipinfo.io/{ip}?token={IPINFO_TOKEN}", headers=headers, timeout=5)
        if resp.status_code != 200:
            return None
        j = resp.json()
        loc = j.get('loc', '')
        lat, lon = (None, None)
        if loc and ',' in loc:
            try:
                lat_s, lon_s = loc.split(',')
                lat, lon = float(lat_s), float(lon_s)
            except Exception:
                lat, lon = (None, None)
        return {
            'country': j.get('country'),
            'city': j.get('city'),
            'lat': lat,
            'lon': lon,
        }
    except Exception:
        return None


def geo_lookup(ip: Optional[str]) -> Dict[str, Any]:
    """Resolve IP to geo fields. Returns empty fields when not resolvable.
    Uses in-memory TTL cache to reduce API calls.
    """
    empty = {"country": None, "city": None, "lat": None, "lon": None}
    if not ip or ip in ('127.0.0.1', '::1', 'localhost'):
        return empty

    cached = _cache.get(ip)
    if cached is not None:
        return cached

    data = None
    if GEO_PROVIDER == 'ipinfo':
        data = _fetch_ipinfo(ip)
    if data is None:
        data = _fetch_ipapi(ip)

    if data is None:
        data = empty

    _cache.set(ip, data)
    return data


# Country centroids for when IP geo fails or for manual country input
COUNTRY_CENTROIDS = {
    'US': {'lat': 39.8283, 'lon': -98.5795},  # United States
    'DE': {'lat': 51.1657, 'lon': 10.4515},  # Germany
    'IN': {'lat': 20.5937, 'lon': 78.9629},  # India
    'GB': {'lat': 55.3781, 'lon': -3.4360},  # United Kingdom
    'FR': {'lat': 46.2276, 'lon': 2.2137},   # France
    'CN': {'lat': 35.8617, 'lon': 104.1954}, # China
    'JP': {'lat': 36.2048, 'lon': 138.2529}, # Japan
    'BR': {'lat': -14.2350, 'lon': -51.9253}, # Brazil
    'RU': {'lat': 61.5240, 'lon': 105.3188}, # Russia
    'AU': {'lat': -25.2744, 'lon': 133.7751}, # Australia
    # Add more as needed
}

# Map common country names to ISO codes
COUNTRY_NAME_TO_CODE = {
    'united states': 'US',
    'united state': 'US',
    'usa': 'US',
    'america': 'US',
    'germany': 'DE',
    'deutschland': 'DE',
    'india': 'IN',
    'united kingdom': 'GB',
    'uk': 'GB',
    'britain': 'GB',
    'england': 'GB',
    'france': 'FR',
    'china': 'CN',
    'japan': 'JP',
    'brazil': 'BR',
    'russia': 'RU',
    'australia': 'AU',
    'canada': 'CA',
    'mexico': 'MX',
    'italy': 'IT',
    'spain': 'ES',
    'south korea': 'KR',
    'korea': 'KR',
    'netherlands': 'NL',
    'sweden': 'SE',
    'norway': 'NO',
    'denmark': 'DK',
    'finland': 'FI',
    'poland': 'PL',
    'turkey': 'TR',
    'saudi arabia': 'SA',
    'uae': 'AE',
    'united arab emirates': 'AE',
    'israel': 'IL',
    'egypt': 'EG',
    'south africa': 'ZA',
    'nigeria': 'NG',
    'kenya': 'KE',
    'argentina': 'AR',
    'chile': 'CL',
    'colombia': 'CO',
    'peru': 'PE',
    'venezuela': 'VE',
    'pakistan': 'PK',
    'bangladesh': 'BD',
    'indonesia': 'ID',
    'thailand': 'TH',
    'vietnam': 'VN',
    'philippines': 'PH',
    'malaysia': 'MY',
    'singapore': 'SG',
    # Add more mappings as needed
}


def get_country_centroid(country_code: str) -> Dict[str, float]:
    """Get approximate center coordinates for a country."""
    return COUNTRY_CENTROIDS.get(country_code.upper(), {'lat': 0.0, 'lon': 0.0})


def normalize_country_input(country_input: str) -> str:
    """Convert country name to ISO code, or return as-is if already a code."""
    if not country_input:
        return ''

    # If it's already a 2-letter code, return it
    if len(country_input.strip()) == 2 and country_input.strip().isalpha():
        return country_input.strip().upper()

    # Try to map common names to codes
    return COUNTRY_NAME_TO_CODE.get(country_input.strip().lower(), country_input.strip().upper())


def enrich_detection_fields(d: Dict[str, Any], ip: Optional[str]) -> Dict[str, Any]:
    """Return a dict of update fields for Detection model (ip, country, city, lat, lon)."""
    if not ip or ip in ('127.0.0.1', '::1', 'localhost'):
        # For local testing, use Mumbai coordinates
        return {
            'ip': ip,
            'country': 'IN',
            'city': 'Mumbai',
            'lat': 19.0760,
            'lon': 72.8777,
        }
    geo = geo_lookup(ip)
    country = geo.get('country')
    lat = geo.get('lat')
    lon = geo.get('lon')

    # If IP geo failed to get coordinates, use country centroid
    if (lat is None or lon is None) and country:
        centroid = get_country_centroid(country)
        lat = centroid['lat']
        lon = centroid['lon']

    return {
        'ip': ip,
        'country': country,
        'city': geo.get('city'),
        'lat': lat,
        'lon': lon,
    }
