import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SOCKET_URL, API_URL } from '../config';
import './remote-control.css';

const departments = [
    ['Automotive', 'Automotive'],
    ['Computer', 'Computer'],
    ['Drafting', 'Drafting'],
    ['Electrical', 'Electrical'],
    ['Electronics', 'Electronics'],
    ['Food Processing', 'Food Processing'],
    ['Mechanical / Welding', 'Mechanical / Welding'],
];

function RemoteControl() {
    const { token } = useParams();
    const [status, setStatus] = useState('Connecting to kiosk...');
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);
    const [international, setInternational] = useState(false);
    const [partners, setPartners] = useState([]);
    const [filter, setFilter] = useState('All');
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState('');
    const [expiresAt, setExpiresAt] = useState(null);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${API_URL}${international ? '/api/intRecords' : '/api/records'}`, { signal: controller.signal })
            .then((response) => response.json())
            .then((records) => setPartners(records.map((record) => ({
                name: international ? record.Industry : record.Partner_Industry,
                department: String(record.Deptmt ?? '').trim(),
            })).filter((partner) => partner.name)))
            .catch(() => {});
        setSelected('');
        return () => controller.abort();
    }, [international]);

    const search = query.trim().toLowerCase();
    const matchedPartners = partners
        .filter((partner) => international || filter === 'All' || partner.department.toLowerCase() === filter.toLowerCase())
        .filter((partner) => partner.name.toLowerCase().includes(search));
    const matches = [...new Set(matchedPartners.map((partner) => partner.name))].map((name) => ({
        name,
        departments: [...new Set(matchedPartners.filter((partner) => partner.name === name && partner.department).map((partner) => partner.department))],
    }));

    useEffect(() => {
        const connection = io(SOCKET_URL);
        socketRef.current = connection;

        connection.on('connect', () => connection.emit('remote:join', token));
        connection.on('remote:joined', (info) => {
            if (info?.remainingMs) setExpiresAt(Date.now() + info.remainingMs);
            setConnected(true);
            setStatus('Connected to the kiosk');
        });
        connection.on('remote:busy', () => {
            setConnected(false);
            setStatus('Another phone is already controlling this kiosk.');
        });
        connection.on('remote:expired', () => {
            setExpiresAt(null);
            setConnected(false);
            setStatus('This QR code has expired. Scan the code on the kiosk again.');
        });
        connection.on('disconnect', () => {
            setConnected(false);
            setStatus('Connection lost. Reconnecting...');
        });
        connection.on('connect_error', () => {
            setConnected(false);
            setStatus('Kiosk unavailable. Check that both devices are on the same network.');
        });

        return () => connection.disconnect();
    }, [token]);

    useEffect(() => {
        if (!expiresAt) return undefined;
        const timer = setInterval(() => {
            const current = Date.now();
            setNow(current);
            if (current >= expiresAt) {
                setExpiresAt(null);
                setConnected(false);
                setStatus('This QR code has expired. Scan the code on the kiosk again.');
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [expiresAt]);

    const secondsLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : null;
    const expiringSoon = secondsLeft !== null && secondsLeft <= 300; // 5mins

    const send = (command) => {
        if (connected) socketRef.current?.emit('remote:command', command);
    };

    const changeScope = (isInternational) => {
        setInternational(isInternational);
        setFilter('All');
        send(isInternational ? 'international' : 'local');
    };

    const changeFilter = (command) => {
        setFilter(command);
        setSelected('');
        send(command);
    };

    return (
        <main className="phone-remote">
            <header className="phone-remote-header">
                <p className="phone-remote-kicker">CIT Partnerships</p>
                <h1>System Remote</h1>
                <p className={`phone-remote-status${connected ? ' is-connected' : ''}`} role="status">
                    <span aria-hidden="true" />
                    {status}
                </p>
            </header>

            {expiringSoon && (
                <div className="remote-expiry-warning" role="alert">
                    Session expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}. Scan the kiosk QR code again to continue.
                </div>
            )}

            <section className="remote-section" aria-labelledby="navigation-title">
                <h2 id="navigation-title">Navigate</h2>
                <div className="remote-navigation-controls">
                    <button type="button" onClick={() => send('back')} disabled={!connected}>Back</button>
                    <button type="button" onClick={() => send('home')} disabled={!connected}>Partners</button>
                    <button type="button" onClick={() => send('start')} disabled={!connected}>Start</button>
                </div>
            </section>

            

            <section className="remote-section" aria-labelledby="scope-title">
                <h2 id="scope-title">Partner scope</h2>
                <div className="remote-scope-controls">
                    <button type="button" onClick={() => changeScope(false)} disabled={!connected}>Local</button>
                    <button type="button" onClick={() => changeScope(true)} disabled={!connected}>International</button>
                </div>
            </section>

            <section className="remote-section" aria-labelledby="filter-title">
                <div className="remote-section-heading">
                    <h2 id="filter-title">Filter partners</h2>
                    <button className="remote-all-button" type="button" onClick={() => changeFilter('All')} disabled={!connected}>All</button>
                </div>
                <div className="remote-filter-controls">
                    {departments.map(([label, command]) => (
                        <button key={command} type="button" onClick={() => changeFilter(command)} disabled={!connected}>
                            {label}
                        </button>
                    ))}
                </div>
            </section>

            <section className="remote-section" aria-labelledby="search-title">
                <h2 id="search-title">Search partner</h2>
                <input
                    className="remote-search"
                    type="search"
                    value={query}
                    onChange={(event) => { setQuery(event.target.value); setSelected(''); }}
                    placeholder="Type a partner name"
                />
                <p className="remote-results-label">{matches.length} partner{matches.length === 1 ? '' : 's'} ({international ? 'International' : 'Local'}{!international && filter !== 'All' ? `, ${filter}` : ''})</p>
                <ul className="remote-results" key={`${international}-${filter}`}>
                    {matches.map(({ name, departments: partnerDepartments }) => (
                        <li key={name}>
                            <button type="button" className={name === selected ? 'is-selected' : ''} onClick={() => setSelected(name)}>
                                <span className="remote-result-name">{name}</span>
                                {partnerDepartments.length > 0 && <span className="remote-result-department">{partnerDepartments.join(', ')}</span>}
                            </button>
                        </li>
                    ))}
                </ul>
                <button
                    type="button"
                    className="remote-open-button"
                    disabled={!connected || !selected}
                    onClick={() => socketRef.current?.emit('remote:open', { international, name: selected })}
                >
                    Open selected partner
                </button>
            </section>

            <section className="remote-section remote-scroll-section" aria-labelledby="scroll-title">
                <h2 id="scroll-title">Browse results</h2>
                <div className="remote-scroll-controls">
                    <button type="button" onClick={() => send('scroll-up')} disabled={!connected}>Scroll up</button>
                    <button type="button" onClick={() => send('scroll-down')} disabled={!connected}>Scroll down</button>
                </div>
            </section>
        </main>
    );
}

export default RemoteControl;