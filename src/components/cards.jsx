import { memo, useEffect, useRef, useState } from 'react';
import './cards.styles.css'
import QRCode from 'react-qr-code';

function LazyQRCode({ value }) {
    const [isVisible, setIsVisible] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (!('IntersectionObserver' in window)) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '300px' }
        );

        observer.observe(wrapperRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="qrcode-wrapper" ref={wrapperRef}>
            {isVisible && <QRCode value={value || ''} size={100} />}
        </div>
    );
}

function Cards(prop){
    const icon = "H";
    const company = "AutoKID";
    const address = "Japan";
    const industry = "Automotive Tech";
    const qr_link = "sample";
    
    return (
        <div className="cards">
            <div className="bar"></div>
            <div className="content">
                <div className="icon">{icon}</div>
                <div className="description">
                    <h1 className="company">{prop.company}</h1>
                    <h5 className="address">{prop.address}</h5>
                    <p className="industry">{prop.industry}</p>
                </div>
            </div>
            <div className="qrcode">
                <LazyQRCode value={prop.link} />
            </div>
        </div>

        
    );
}

export default memo(Cards);