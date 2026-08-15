import './home.styles.css'
import Switch from '../components/switch';
import IntMap from '../components/map';
import PhMap from '../components/phmap';
import Filters from '../components/filters';
import Cards from '../components/cards';
import Building_icon from '../components/building-icon';
import Location_icon from '../components/location-icon';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIdleTimer } from 'react-idle-timer';
import { useNavigate } from 'react-router-dom';


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
        !setScope(event.target.checked);
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
                    <h2>{num_partners} Partners</h2>
                    <div className="scope_description">
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
                
                <div className="filter_wrapper">
                    <Filters name="All" checked={filter === "All"} change={handleFilter}/>
                    <Filters name="Luzon" checked={filter === "Luzon"} change={handleFilter}/>
                    <Filters name="Visayas" checked={filter === "Visayas"} change={handleFilter}/>
                    <Filters name="Mindanao" checked={filter === "Mindanao"} change={handleFilter}/>                    
                </div>

                <div className="cards_wrapper" >
                    <Cards/>
                    <Cards/>
                    <Cards/>
                    <Cards/>
                    <Cards/>
                    <Cards/>
                    <Cards/>
                </div>

            </div>
        </div>
        
    )
}

export default Home;