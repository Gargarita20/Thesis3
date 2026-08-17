import { Children } from 'react';
import './cards.styles.css'
import QRCode from 'react-qr-code';

function Cards(prop){
    const icon = "H";
    const company = "Honda Inc.";
    const address = "Japan";
    const industry = "Automotive Tech";
    const qr_link = "sample";
    

    return (
        <div className="cards">
            <div className="bar"></div>
            <div className="content">
                <div className="icon">{icon}</div>
                <div className="description">
                    <h1 className="company">{company}</h1>
                    <h4 className="address">{address}</h4>
                    <p className="industry">{industry}</p>
                </div>
            </div>
            <div className="qrcode">
                <div className="qrcode-wrapper">
                    <QRCode value='WHATS UP CUHHZ' size={100}/>
                </div>
            </div>
        </div>

        
    );
}

export default Cards;