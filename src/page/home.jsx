import './home.styles.css'
import Switch from '../components/switch';
import Map from '../components/map';
import Filters from '../components/filters';
import Cards from '../components/cards';

function Home(){
    const num_partners = 3;
    const scope_desc = "Local";


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

        {/* Content here  */}
            <Map/>
            <div className="partners">
                <div className="header">
                    <h2>{num_partners} Partners</h2>
                    <div className="scope_description">
                        <span>Globe Logo </span>
                        <p>{scope_desc}</p>
                    </div>
                </div>
                
                <div className="filter_wrapper">
                    <Filters name="All" checked={true}/>
                    <Filters name="Luzon"/>
                    <Filters name="Visayas"/>
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