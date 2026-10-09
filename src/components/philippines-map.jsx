import { memo, useEffect, useRef } from 'react';
import philippinesSvg from '../media/philippines.svg?raw';
import './philippines-map.styles.css';

function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function findProvince(address, provincePaths) {
    const normalizedAddress = ` ${normalizeText(address)} `;
    if (!address) return null;

    const aliases = {
        'Metropolitan Manila': ['metro manila', 'ncr', 'quezon city', 'makati city', 'pasig city', 'pasay city', 'muntinlupa city', 'valenzuela city', 'san juan city', 'cubao'],
        Pampanga: ['angeles city', 'mabalacat'],
        Benguet: ['baguio city'],
    };
    const candidates = [];

    provincePaths.forEach((path) => {
        const province = path.getAttribute('title');
        const terms = [province, ...(aliases[province] || [])];

        terms.forEach((term) => {
            const normalizedTerm = normalizeText(term);
            const index = normalizedAddress.indexOf(` ${normalizedTerm} `);
            if (index >= 0) candidates.push({ province, index });
        });
    });

    candidates.sort((first, second) => second.index - first.index);
    return candidates[0]?.province || null;
}

function PhilippinesMap({ address, detail = false }) {
    const mapRef = useRef(null);

    useEffect(() => {
        const svg = mapRef.current?.querySelector('svg');
        if (!svg) return undefined;

        const provincePaths = Array.from(svg.querySelectorAll('path[title]'));
        const width = Number(svg.getAttribute('width'));
        const height = Number(svg.getAttribute('height'));
        const originalViewBox = svg.dataset.originalViewBox
            || svg.getAttribute('viewBox')
            || `-18 -18 ${width + 36} ${height + 36}`;
        svg.dataset.originalViewBox = originalViewBox;
        svg.setAttribute('viewBox', originalViewBox);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        const provinceName = findProvince(address, provincePaths);
        const selectedPath = provincePaths.find((path) => path.getAttribute('title') === provinceName);
        provincePaths.forEach((path) => path.classList.toggle('province-selected', path === selectedPath));

        if (selectedPath) {
            const bounds = selectedPath.getBBox();
            const frame = svg.getBoundingClientRect();
            const aspect = frame.width / Math.max(frame.height, 1);
            let width = Math.max(bounds.width * 2.8, 24);
            let height = Math.max(bounds.height * 2.8, 24);

            if (width / height < aspect) width = height * aspect;
            else height = width / aspect;

            const targetViewBox = {
                x: bounds.x + bounds.width / 2 - width / 2,
                y: bounds.y + bounds.height / 2 - height / 2,
                width,
                height,
            };

            svg.setAttribute('viewBox', `${targetViewBox.x} ${targetViewBox.y} ${width} ${height}`);

            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            const pin = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const unitsPerPixel = Math.min(frame.width / width, frame.height / height);
            const markerScale = 30 / Math.max(unitsPerPixel, 0.01);

            marker.setAttribute('class', 'province-map-pin');
            marker.setAttribute('role', 'img');
            marker.setAttribute('aria-label', `${provinceName} partnership location`);
            marker.setAttribute('transform', `translate(${bounds.x + bounds.width / 2} ${bounds.y + bounds.height / 2}) scale(${markerScale})`);
            pin.setAttribute('d', 'M0 0 C-0.16 -0.23 -0.4 -0.55 -0.4 -0.72 A0.4 0.4 0 1 1 0.4 -0.72 C0.4 -0.55 0.16 -0.23 0 0 Z');
            center.setAttribute('cx', '0');
            center.setAttribute('cy', '-0.72');
            center.setAttribute('r', '0.14');
            marker.append(pin, center);
            svg.append(marker);
        } else {
            svg.setAttribute('viewBox', originalViewBox);
        }

        return () => {
            provincePaths.forEach((path) => {
                path.classList.remove('province-selected');
            });
            svg.querySelector('.province-map-pin')?.remove();
        };
    }, [address]);

    return (
        <div className={`province-map${detail ? ' province-map-detail' : ''}`}>
            <div className="province-map-canvas" ref={mapRef} dangerouslySetInnerHTML={{ __html: philippinesSvg }} />
        </div>
    );
}

export default memo(PhilippinesMap);