import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import './remote-control.css';

const departments = [
    'Automotive',
    'Computer',
    'Drafting',
    'Electrical',
    'Electronics',
    'Food Processing',
    'Mechanical / Welding',
];

function RemoteControl() {
    const { token } = useParams();
    const [status, setStatus] = useState('Connecting to kiosk...');
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);
    const [international, setInternational] = useState(false);
    const [filter, setFilter] = useState('All');
    const [query, setQuery] = useState('');
    const [expiresAt, setExpiresAt] = useState(null);
    const [now, setNow] = useState(Date.now());
    const [confirmExit, setConfirmExit] = useState(false);

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
            setConfirmExit(false);
            setExpiresAt(null);
            setConnected(false);
            setStatus('This QR code has expired. Scan the code on the kiosk again.');
        });
        connection.on('remote:confirm-exit', () => setConfirmExit(true));
        connection.on('remote:ended', () => {
            setExpiresAt(null);
            setConnected(false);
            setConfirmExit(false);
            setStatus('Session ended. Scan the new QR code on the kiosk to reconnect.');
            connection.disconnect();
        });
        connection.on('disconnect', () => {
            setConnected(false);
            setStatus('Connection lost.');
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

    const changeFilter = (value) => {
        setFilter(value);
        send(value === 'All' ? 'all' : value);
    };

    const endSession = () => {
        socketRef.current?.emit('remote:exit');
    };

    const changeQuery = (value) => {
        setQuery(value);
        if (connected) socketRef.current?.emit('remote:search', value);
    };

    return (
        <main className="phone-remote">
            <div className="remote-body">
                <p className={`phone-remote-status${connected ? ' is-connected' : ''}`} role="status">
                    <span aria-hidden="true" />
                    {status}
                </p>

                {expiringSoon && (
                    <div className="remote-expiry-warning" role="alert">
                        Session expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}. Scan the kiosk QR code again to continue.
                    </div>
                )}

                <input
                    className="remote-search"
                    type="search"
                    value={query}
                    onChange={(event) => changeQuery(event.target.value)}
                    placeholder="Search partner"
                    aria-label="Search partner"
                    disabled={!connected}
                />

                <div className="remote-scope-buttons">
                    <button type="button" className={!international ? 'is-active' : ''} onClick={() => changeScope(false)} disabled={!connected}>Local</button>
                    <button type="button" className={international ? 'is-active' : ''} onClick={() => changeScope(true)} disabled={!connected}>International</button>
                </div>

                                {!international && (
                    <select
                        className="remote-filter"
                        value={filter}
                        onChange={(event) => changeFilter(event.target.value)}
                        disabled={!connected}
                        aria-label="Filter partners by department"
                    >
                        <option value="All">All departments</option>
                        {departments.map((name) => <option key={name} value={name}>{name}</option>)}
                    </select>
                )}

                <div className="remote-dpad" role="group" aria-label="Directional pad">
                    <button type="button" className="dpad-up" aria-label="Up" onClick={() => send('up')} disabled={!connected}>Up</button>
                    <button type="button" className="dpad-left" aria-label="Left" onClick={() => send('left')} disabled={!connected}>Left</button>
                    <button type="button" className="dpad-ok" aria-label="Select" onClick={() => send('select')} disabled={!connected}>OK</button>
                    <button type="button" className="dpad-right" aria-label="Right" onClick={() => send('right')} disabled={!connected}>Right</button>
                    <button type="button" className="dpad-down" aria-label="Down" onClick={() => send('down')} disabled={!connected}>Down</button>
                </div>

                <div className="remote-round-buttons">
                    <div>
                        <button type="button" aria-label="Back" onClick={() => send('back')} disabled={!connected}>Back</button>
                        {/* <span>Back</span> */}
                    </div>
                    
                    <div>
                        <button type="button" aria-label="Start" onClick={() => send('start')} disabled={!connected}>Start</button>
                        {/* <span>Start</span> */}
                    </div>
                </div>
            </div>

            {confirmExit && (
                <div className="remote-confirm" role="alertdialog" aria-labelledby="remote-confirm-title">
                    <div className="remote-confirm-box">
                        <h2 id="remote-confirm-title">Leave the directory?</h2>
                        <p>This returns the kiosk to the start screen and disconnects this remote.</p>
                        <div className="remote-confirm-actions">
                            <button type="button" onClick={() => setConfirmExit(false)}>No</button>
                            <button type="button" className="is-primary" onClick={endSession}>Yes</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default RemoteControl;
