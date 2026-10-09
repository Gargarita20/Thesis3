import './home.styles.css'
import Switch from '../components/switch';
import IntMap from '../components/map';
import PhMap from '../components/phmap';
import Filters from '../components/filters';
import Cards from '../components/cards';
import Building_icon from '../components/building-icon';
import Location_icon from '../components/location-icon';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function detectIdle(){
    const navigate = useNavigate();

    const onIdle = () => {
        navigate("/");
    }

    useIdleTimer({
        onIdle,
        timeout: 10000, // milliseconds
        debounce: 500
    });


    return null;
}

function Home(){
    // detectIdle();

    const [scope, setScope] = useState(false);

    function handleScope(event){
        setScope(event.target.checked);
        setFilter("All");
    }

    const scope_desc = scope ? "International" : "Local";

    const [filter, setFilter] = useState("All");
    
    const handleFilter = (e) =>{
        setFilter(e.target.value);
    };

    useEffect(() => {
        const handleVoiceScope = (event) => {
            setScope(event.detail);
            setFilter("All");
        };
        const handleVoiceFilter = (event) => setFilter(event.detail);

        window.addEventListener('voice-scope', handleVoiceScope);
        window.addEventListener('voice-filter', handleVoiceFilter);

        return () => {
            window.removeEventListener('voice-scope', handleVoiceScope);
            window.removeEventListener('voice-filter', handleVoiceFilter);
        };
    }, []);
    
    const back_port = 3000;
    const [records, getRecords] = useState([]);

    const filteredRecords = scope || filter === "All"
        ? records
        : records.filter(record => String(record.Deptmt ?? '').trim().toLowerCase() === filter.trim().toLowerCase());

    useEffect(() => {
        const controller = new AbortController();

        fetch(`http://localhost:${back_port}${scope ? "/api/intRecords" : "/api/records"}`, { signal: controller.signal })
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
                {scope ? <IntMap/> : <PhMap/>}
            </div>
                
            <div className="partners">
                <div className="header">
                    <h2>{filteredRecords.length || 0} Partners</h2>
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
                    </div>
                )}

                <div className="cards_wrapper" >
                    {filteredRecords.map(r => <Cards key={`${scope ? 'international' : 'local'}-${r.ID ?? r.Partner_Industry ?? r.Industry}-${r.Address}`} 
                    company={scope ? r.Industry : r.Partner_Industry} 
                    address={r.Address} 
                    industry={scope ? "International Partner" : r.Deptmt}
                    link={r.Link}
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