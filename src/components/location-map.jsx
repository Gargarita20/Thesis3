import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import './location-map.styles.css';

const icon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

async function search(query, signal) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Geocoding failed');
    const results = await response.json();
    return results[0] || null;
}

// Tries the full address, then progressively drops the most specific (leading) parts.
async function geocode(address, signal) {
    const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
    for (let i = 0; i < parts.length; i += 1) {
        const result = await search(parts.slice(i).join(', '), signal);
        if (result) return { lat: Number(result.lat), lon: Number(result.lon), exact: i === 0, label: result.display_name };
    }
    return null;
}

function LocationMap({ address }) {
    const containerRef = useRef(null);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        if (!address) {
            setStatus('missing');
            return undefined;
        }

        const map = L.map(containerRef.current, { scrollWheelZoom: false });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        map.setView([12.88, 121.77], 5);

        const controller = new AbortController();
        setStatus('loading');

        geocode(address, controller.signal)
            .then((place) => {
                if (!place) {
                    setStatus('notfound');
                    return;
                }
                map.setView([place.lat, place.lon], place.exact ? 19 : 11);
                L.marker([place.lat, place.lon], { icon }).addTo(map).bindPopup(address).openPopup();
                setStatus('ready');
                map.setZoom(19);
            })
            .catch((error) => {
                if (error.name !== 'AbortError') setStatus('error');
            });

        return () => {
            controller.abort();
            map.remove();
        };
    }, [address]);

    const messages = {
        loading: 'Locating address…',
        missing: 'No address provided.',
        notfound: 'Could not find this address on the map.',
        error: 'Map location is unavailable right now.',
    };

    return (
        <div className="location-map-wrapper">
            <div ref={containerRef} className="location-map" role="region" aria-label="Map location" />
            {status !== 'ready' && <p className="location-map-status">{messages[status]}</p>}
        </div>
    );
}

export default LocationMap;
