import './home.styles.css'
import Switch from '../components/switch';

function Home(){
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
                
            

        </div>
        
    )
}

export default Home;