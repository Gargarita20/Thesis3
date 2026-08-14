import './home.styles.css'
import Switch from '../components/switch';
import IntMap from '../components/map';
import PhMap from '../components/phmap';
import Filters from '../components/filters';
import Cards from '../components/cards';
import { useState } from 'react';


function Home(){
    const num_partners = 3;
    const scope_desc = "Local";

    const [scope, setScope] = useState("Local");
    // if !checked = "Local" then display Local Map
    // else checked = "International" then display 

    // const [filter, setFilter] = useState({
    //     All: "All",
    //     Luzon: "Luzon",
    //     Visayas: "Visayas",
    //     Mindanao: "Mindanao"
    // })

    const [filter, setFilter] = useState("All");
    
    const handleFilter = (e) =>{
        setFilter(e.target.value);
    };
    
    // console.log(filter);

    return(
        <div className="home">
            <div className='nav'>
                <div className='nav-left'>
                    <div className="nav-left-icon">
                        {/* icon here */}
                    </div>
                    <div className="nav-left-header">
                        <h2>CIT Partnerships</h2>
                        <h4>Industry Directories</h4>
                    </div>
                </div>
                <div className="nav-right">
                    <Switch/>
                </div>
            </div>

            {/* <IntMap/> */}
            <PhMap/>
            
            <div className="partners">
                <div className="header">
                    <h2>{num_partners} Partners</h2>
                    <div className="scope_description">
                        <span>Globe Logo</span>
                        <p>{scope}</p>
                    </div>
                </div>
                
                <div className="filter_wrapper">
                    <Filters name="All" checked={filter === "All"} change={handleFilter}/>
                    <Filters name="Luzon" checked={filter === "Luzon"} change={handleFilter}/>
                    <Filters name="Visayas" checked={filter === "Visayas"} change={handleFilter}/>
                    <Filters name="Mindanao" checked={filter === "Mindanao"} change={handleFilter}/>                    
                </div>

                <div className="filter_wrapper"></div>

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