import './home.styles.css'
import Switch from '../components/switch';
import IntMap from '../components/world-map';
import PhilippinesMap from '../components/philippines-map';
import Filters from '../components/filters';
import Cards from '../components/cards';
import Building_icon from '../components/building-icon';
import Location_icon from '../components/location-icon';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIdleTimer } from 'react-idle-timer';
import { motion } from 'framer-motion';
import { API_URL } from '../config';

const IDLE_TIMEOUT = 30000;
const IDLE_WARNING = 3000;

// Survives Home unmounting so returning from a partnership keeps the scope and filter.
const saved = { scope: false, filter: 'All' };

function useIdleReturn(){
    const navigate = useNavigate();
    const [remoteConnected, setRemoteConnected] = useState(Boolean(window.remoteConnected));
    const [secondsLeft, setSecondsLeft] = useState(null);

    useEffect(() => {
        const handleStatus = (event) => setRemoteConnected(event.detail);
        window.addEventListener('remote-status', handleStatus);
        return () => window.removeEventListener('remote-status', handleStatus);
    }, []);

    const { getRemainingTime, activate } = useIdleTimer({
        onIdle: () => { saved.scope = false; saved.filter = 'All'; navigate('/'); },
        onActive: () => setSecondsLeft(null),
        onPrompt: () => setSecondsLeft(Math.ceil(getRemainingTime() / 1000)),
        timeout: IDLE_TIMEOUT - IDLE_WARNING,
        promptTimeout: IDLE_WARNING,
        disabled: remoteConnected,
        debounce: 500,
    });

    useEffect(() => {
        if (secondsLeft === null) return undefined;
        const interval = setInterval(() => setSecondsLeft(Math.max(1, Math.ceil(getRemainingTime() / 1000))), 250);
        return () => clearInterval(interval);
    }, [secondsLeft === null, getRemainingTime]);

    useEffect(() => {
        if (remoteConnected) setSecondsLeft(null);
        else activate();
    }, [remoteConnected, activate]);

    return secondsLeft;
}

function Home(){
    const idleSecondsLeft = useIdleReturn();

    const [scope, setScope] = useState(saved.scope);

    function handleScope(event){
        setScope(event.target.checked);
        setFilter("All");
    }

    const scope_desc = scope ? "International" : "Local";

    const [filter, setFilter] = useState(saved.filter);
    saved.scope = scope;
    saved.filter = filter;
    const [search, setSearch] = useState('');
    const focusRef = useRef(null);
    
    const handleFilter = (e) =>{
        setFilter(e.target.value);
    };

    useEffect(() => {
        const handleVoiceScope = (event) => {
            setScope(event.detail);
            setFilter("All");
        };
        const handleVoiceFilter = (event) => setFilter(event.detail);
        const handleRemoteSearch = (event) => setSearch(event.detail);

        // D-pad navigation: move a highlight to the nearest focusable element in the pressed direction.
        const handleRemoteNav = (event) => {
            const direction = event.detail;
            const items = [...document.querySelectorAll('.home .cards')];
            let current = focusRef.current;
            if (!current || !current.isConnected) {
                current = null;
                focusRef.current = null;
            }

            const focusOn = (element) => {
                current?.classList.remove('remote-focus');
                element.classList.add('remote-focus');
                element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
                focusRef.current = element;
            };

            if (!current) {
                if (items.length) focusOn(items[0]);
                return;
            }

            if (direction === 'select') {
                current.click();
                return;
            }

            const from = current.getBoundingClientRect();
            const fromX = from.left + from.width / 2;
            const fromY = from.top + from.height / 2;
            let best = null;
            let bestScore = Infinity;
            items.forEach((item) => {
                if (item === current) return;
                const rect = item.getBoundingClientRect();
                const dx = rect.left + rect.width / 2 - fromX;
                const dy = rect.top + rect.height / 2 - fromY;
                const along = { up: -dy, down: dy, left: -dx, right: dx }[direction];
                if (along <= 4) return;
                const across = direction === 'up' || direction === 'down' ? Math.abs(dx) : Math.abs(dy);
                const score = along + across * 3;
                if (score < bestScore) {
                    bestScore = score;
                    best = item;
                }
            });
            if (best) focusOn(best);
        };

        window.addEventListener('voice-scope', handleVoiceScope);
        window.addEventListener('voice-filter', handleVoiceFilter);
        window.addEventListener('remote-search', handleRemoteSearch);
        window.addEventListener('remote-nav', handleRemoteNav);

        return () => {
            window.removeEventListener('voice-scope', handleVoiceScope);
            window.removeEventListener('voice-filter', handleVoiceFilter);
            window.removeEventListener('remote-search', handleRemoteSearch);
            window.removeEventListener('remote-nav', handleRemoteNav);
            focusRef.current?.classList.remove('remote-focus');
        };
    }, []);
    
    const [records, getRecords] = useState([]);

    const filteredRecords = scope || filter === "All"
        ? records
        : records.filter(record => String(record.Deptmt ?? '').trim().toLowerCase() === filter.trim().toLowerCase());
    const searchText = search.trim().toLowerCase();
    const visibleRecords = searchText
        ? filteredRecords.filter(record => String((scope ? record.Industry : record.Partner_Industry) ?? '').toLowerCase().includes(searchText))
        : filteredRecords;

    useEffect(() => {
        const controller = new AbortController();

        fetch(`${API_URL}${scope ? "/api/intRecords" : "/api/records"}`, { signal: controller.signal })
        .then(res => res.json())
        .then(data => getRecords(data))
        .catch(error => {
            if (error.name !== "AbortError") {
                console.error("Failed to fetch partner records:", error);
            }
        });

        return () => controller.abort();
    }, [scope]);

    // console.log(records) //records is array, points to line 74

    return(
        <div className="home">
            {idleSecondsLeft !== null && (
                <div className="idle-notice" role="alert">
                    Returning to start in {idleSecondsLeft}s.
                </div>
            )}
            <div className='nav'>
                <div className='nav-left'>
                    <div className="nav-left-icon">
                        <span><Building_icon/></span>             
                    </div>
                    <div className="nav-left-header">
                        <h2>CIT Partnerships</h2>
                        <h4>Industry Directories</h4>
                    </div>
                </div>
                <div className="nav-right">
                    <Switch switch={scope} onchange={handleScope}/>
                </div>
            </div>
                {/* Map */}
            <div className='home-map-wrapper'>
                {scope ? <IntMap/> : <PhilippinesMap/>}
            </div>
                
            <div className="partners">
                <div className="header">
                    <h2>{visibleRecords.length || 0} Partners</h2>
                    <div className="scope_description">
                        {/* Scope Label */}
                        <span><Location_icon/></span>
                        <motion.div
                            key={scope ? 'int-map' : 'ph-map'}
                            initial={{ rotateX: -90, opacity: 0 }}
                            animate={{ rotateX: 0, opacity: 1 }}
                            exit={{ rotateX: 90, opacity: 0 }}
                            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                                transformOrigin: 'center center',
                                transformStyle: 'preserve-3d',
                                backfaceVisibility: 'hidden',
                            }}
                            >
                        <div className="scope_p">
                            <p key={scope_desc}>{scope_desc}</p>
                        </div>
                        </motion.div>
                    </div>
                </div>
                
            
                {/* <textarea
                    value={text} 
                    onChange={(event) => setText(event.target.value)} 
                    placeholder='Spoke here'
                    rows={6}
                    cols={10}
                /> */}

                {!scope && (
                    <div className="filter_wrapper">
                        <Filters name="All" checked={filter === "All"} change={handleFilter}/>
                        <Filters name="Automotive" checked={filter === "Automotive"} change={handleFilter}/>
                        <Filters name="Computer" checked={filter === "Computer"} change={handleFilter}/>
                        <Filters name="Drafting" checked={filter === "Drafting"} change={handleFilter}/>
                        <Filters name="Electrical" checked={filter === "Electrical"} change={handleFilter}/>
                        <Filters name="Electronics" checked={filter === "Electronics"} change={handleFilter}/>
                        <Filters name="Food" value="Food Processing" checked={filter === "Food Processing"} change={handleFilter}/>
                        <Filters name="Mechanical / Welding" checked={filter === "Mechanical / Welding"} change={handleFilter}/>
                    </div>
                )}

                <div className="cards_wrapper" >
                    {visibleRecords.map(r => <Cards key={`${scope ? 'international' : 'local'}-${r.ID ?? r.Partner_Industry ?? r.Industry}-${r.Address}`} 
                    company={scope ? r.Industry : r.Partner_Industry} 
                    address={r.Address} 
                    industry={scope ? "International Partner" : r.Deptmt}
                    link={r.Link}
                    logoPath={r.LogoPath ? `${API_URL}/partner-logos/${r.LogoPath.split('/').map(encodeURIComponent).join('/')}` : null}
                    record={r}
                    international={scope}/>
                    )}

                    {/* <Cards company={"Company"} address={"Address"} industry={"Industry"} link={"Sample"} /> */}
                </div>

            </div>
        </div>
        
    )
}

export default Home;