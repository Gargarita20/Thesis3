import { memo, useEffect, useRef, useState } from 'react';
import worldSvg from '../media/world.svg?raw';
import './world-map.styles.css';

function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function findCountry(address, countryPaths) {
    const normalizedAddress = ` ${normalizeText(address)} `;
    if (!address) return null;

    const matches = [];

    countryPaths.forEach((path) => {
        const country = path.getAttribute('title');
        const normalizedCountry = normalizeText(country);
        const index = normalizedAddress.indexOf(` ${normalizedCountry} `);
        if (index >= 0) matches.push({ country, index, length: normalizedCountry.length });
    });

    matches.sort((first, second) => second.index - first.index || second.length - first.length);
    return matches[0]?.country || null;
}

function WorldMap({ address, detail = false }) {
    const mapRef = useRef(null);
    const containerRef = useRef(null);
    const [hoveredCountry, setHoveredCountry] = useState(null);

    useEffect(() => {
        const svg = mapRef.current?.querySelector('svg');
        if (!svg) return undefined;

        const width = Number(svg.getAttribute('width'));
        const height = Number(svg.getAttribute('height'));
        const originalViewBox = svg.dataset.originalViewBox
            || svg.getAttribute('viewBox')
            || `0 0 ${width} ${height}`;
        svg.dataset.originalViewBox = originalViewBox;
        svg.setAttribute('viewBox', originalViewBox);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        const countryPaths = Array.from(svg.querySelectorAll('path[title]'));
        const selectedCountry = detail ? findCountry(address, countryPaths) : null;
        const selectedPath = countryPaths.find((path) => path.getAttribute('title') === selectedCountry);
        countryPaths.forEach((path) => path.classList.toggle('country-selected', path === selectedPath));

        if (selectedPath) {
            const bounds = selectedPath.getBBox();
            const frame = svg.getBoundingClientRect();
            const aspect = frame.width / Math.max(frame.height, 1);
            let viewWidth = Math.max(bounds.width * 2.6, 30);
            let viewHeight = Math.max(bounds.height * 2.6, 24);

            if (viewWidth / viewHeight < aspect) viewWidth = viewHeight * aspect;
            else viewHeight = viewWidth / aspect;

            const centerX = bounds.x + bounds.width / 2;
            const centerY = bounds.y + bounds.height / 2;
            svg.setAttribute('viewBox', `${centerX - viewWidth / 2} ${centerY - viewHeight / 2} ${viewWidth} ${viewHeight}`);

            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            const pin = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const unitsPerPixel = Math.min(frame.width / viewWidth, frame.height / viewHeight);
            const markerScale = 30 / Math.max(unitsPerPixel, 0.01);

            marker.setAttribute('class', 'world-map-pin');
            marker.setAttribute('role', 'img');
            marker.setAttribute('aria-label', `Partnership location: ${selectedCountry}`);
            marker.setAttribute('transform', `translate(${centerX} ${centerY}) scale(${markerScale})`);
            pin.setAttribute('d', 'M0 0 C-0.16 -0.23 -0.4 -0.55 -0.4 -0.72 A0.4 0.4 0 1 1 0.4 -0.72 C0.4 -0.55 0.16 -0.23 0 0 Z');
            center.setAttribute('cx', '0');
            center.setAttribute('cy', '-0.72');
            center.setAttribute('r', '0.14');
            marker.append(pin, center);
            svg.append(marker);
        }

        const updateTooltip = (event) => {
            const bounds = containerRef.current.getBoundingClientRect();
            setHoveredCountry({
                name: event.currentTarget.getAttribute('title'),
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
            });
        };
        const clearTooltip = () => setHoveredCountry(null);

        // if (!detail) {
        //     countryPaths.forEach((path) => {
        //         path.addEventListener('pointerenter', updateTooltip);
        //         path.addEventListener('pointermove', updateTooltip);
        //         path.addEventListener('pointerleave', clearTooltip);
        //     });
        // }

        return () => {
            countryPaths.forEach((path) => {
                path.removeEventListener('pointerenter', updateTooltip);
                path.removeEventListener('pointermove', updateTooltip);
                path.removeEventListener('pointerleave', clearTooltip);
                path.classList.remove('country-selected');
            });
            svg.querySelector('.world-map-pin')?.remove();
        };
    }, [address, detail]);

    return (
        <div className={`map${detail ? ' map-detail' : ''}`} ref={containerRef}>
            <div className="map-wrapper" ref={mapRef} dangerouslySetInnerHTML={{ __html: worldSvg }} />
            {!detail && hoveredCountry && (
                <div
                    className="world-map-tooltip"
                    role="tooltip"
                    style={{ left: hoveredCountry.x, top: hoveredCountry.y }}
                >
                    {hoveredCountry.name}
                </div>
            )}
        </div>
    );
}

export default memo(WorldMap);