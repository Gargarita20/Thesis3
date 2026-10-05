import './home.styles.css'
import Switch from '../components/switch';
import IntMap from '../components/map';
import PhMap from '../components/phmap';
import Filters from '../components/filters';
import Cards from '../components/cards';
import Building_icon from '../components/building-icon';
import Location_icon from '../components/location-icon';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useIdleTimer } from 'react-idle-timer';
import { useNavigate } from 'react-router-dom';

import mic from '../media/mic.png';
import stop from '../media/stop.png';

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

    let num_partners = 3;

    let scope_desc = "Local";
    const [scope, setScope] = useState(false);

    function handleScope(event){
        setScope(event.target.checked);
    }

    if (scope == false){
        scope_desc = "Local";
    }else{
        scope_desc = "International";
    }

    const [filter, setFilter] = useState("All");
    
    const handleFilter = (e) =>{
        setFilter(e.target.value);
    };
    
    const back_port = 3000;
    const [records, getRecords] = useState([]);

    const filteredRecords = filter === "All"
        ? records
        : records.filter(record => String(record.Deptmt ?? '').trim().toLowerCase() === filter.trim().toLowerCase());

    useEffect(() => {
        fetch(`http://localhost:${back_port}/api/records`)
        .then(res => res.json())
        .then(data => getRecords(data));
    }, []);

    // console.log(records) //records is array, points to line 74

    // speech-to-text
    const [text, setText] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState("");

    const recognitionRef = useRef(null);

    const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    setError("");

    const recognition = new SpeechRecognition();

    recognition.lang = "fil-PH";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setText(transcript);
    };

    recognition.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    };

    const stopListening = () => {
        recognitionRef.current?.stop();
        setIsListening(false);
    };

    // end of speech-to-text

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

                <div className="filter_wrapper">
                    <Filters name="All" checked={filter === "All"} change={handleFilter}/>
                    <Filters name="Automotive" checked={filter === "Automotive"} change={handleFilter}/>
                    <Filters name="Computer" checked={filter === "Computer"} change={handleFilter}/>
                    <Filters name="Drafting" checked={filter === "Drafting"} change={handleFilter}/>
                    <Filters name="Electrical" checked={filter === "Electrical"} change={handleFilter}/>
                    <Filters name="Electronics" checked={filter === "Electronics"} change={handleFilter}/>
                                  
                </div>

                <div className="cards_wrapper" >
                    <div className="listen_wrapper">
                        {!isListening ? (<button className='listenBtn' onClick={startListening}><img src={mic} alt='Mic'></img></button>) : 
                        (<button onClick={stopListening} className='listenBtn'><img src={stop} alt='Stop'></img></button>)}

                        {isListening && <p>Listening...</p>}
                        {error && <p style={{ color: "red" }}>{error}</p>}   
                    </div>

                    {filteredRecords.map(r => <Cards key={r.id} 
                    company={r.Partner_Industry} 
                    address={r.Address} 
                    industry={r.Deptmt}
                    link={r.Link}/>
                    )}

                    {/* <Cards company={"Company"} address={"Address"} industry={"Industry"} link={"Sample"} /> */}
                </div>

            </div>
        </div>
        
    )
}

export default Home;