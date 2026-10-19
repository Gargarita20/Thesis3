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
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${API_URL}${international ? '/api/intRecords' : '/api/records'}`, { signal: controller.signal })
            .then((response) => response.json())
            .then((records) => setPartners(records.map((record) => international ? record.Industry : record.Partner_Industry).filter(Boolean)))
            .catch(() => {});
        setSelected('');
        return () => controller.abort();
    }, [international]);

    const matches = query.trim()
        ? partners.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 20)
        : [];

    useEffect(() => {
        const connection = io(SOCKET_URL);
        socketRef.current = connection;

        connection.on('connect', () => connection.emit('remote:join', token));
        connection.on('remote:joined', () => {
            setConnected(true);
            setStatus('Connected to the kiosk');
        });
        connection.on('remote:expired', () => {
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

    const send = (command) => {
        if (connected) socketRef.current?.emit('remote:command', command);
    };

    return (
        <main className="phone-remote">
            <header className="phone-remote-header">
                <p className="phone-remote-kicker">CIT Partnerships</p>
                <h1>System remote</h1>
                <p className={`phone-remote-status${connected ? ' is-connected' : ''}`} role="status">
                    <span aria-hidden="true" />
                    {status}
                </p>
            </header>

            <section className="remote-section" aria-labelledby="navigation-title">
                <h2 id="navigation-title">Navigate</h2>
                <div className="remote-navigation-controls">
                    <button type="button" onClick={() => send('back')} disabled={!connected}>Back</button>
                    <button type="button" onClick={() => send('home')} disabled={!connected}>Partners</button>
                    <button type="button" onClick={() => send('start')} disabled={!connected}>Start</button>
                </div>
            </section>

            <section className="remote-section" aria-labelledby="search-title">
                <h2 id="search-title">Search partner</h2>
                <div className="remote-scope-controls">
                    <button type="button" onClick={() => setInternational(false)} disabled={!international}>Local</button>
                    <button type="button" onClick={() => setInternational(true)} disabled={international}>International</button>
                </div>
                <input
                    className="remote-search"
                    type="search"
                    value={query}
                    onChange={(event) => { setQuery(event.target.value); setSelected(''); }}
                    placeholder="Type a partner name"
                />
                <ul className="remote-results">
                    {matches.map((name) => (
                        <li key={name}>
                            <button type="button" className={name === selected ? 'is-selected' : ''} onClick={() => setSelected(name)}>{name}</button>
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

            <section className="remote-section" aria-labelledby="scope-title">
                <h2 id="scope-title">Partner scope</h2>
                <div className="remote-scope-controls">
                    <button type="button" onClick={() => send('local')} disabled={!connected}>Local</button>
                    <button type="button" onClick={() => send('international')} disabled={!connected}>International</button>
                </div>
            </section>

            <section className="remote-section" aria-labelledby="filter-title">
                <div className="remote-section-heading">
                    <h2 id="filter-title">Filter partners</h2>
                    <button className="remote-all-button" type="button" onClick={() => send('all')} disabled={!connected}>All</button>
                </div>
                <div className="remote-filter-controls">
                    {departments.map(([label, command]) => (
                        <button key={command} type="button" onClick={() => send(command)} disabled={!connected}>
                            {label}
                        </button>
                    ))}
                </div>
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