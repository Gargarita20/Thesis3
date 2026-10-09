import { memo, useEffect, useRef, useState } from 'react';
import './cards.styles.css'
import QRCode from 'react-qr-code';
import { Link } from 'react-router-dom';
import mitsu from '../media/mitsubishi motors philippines.png';

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
            {isVisible && <QRCode value={value || ''} size={90} />}
        </div>
    );
}

function Cards(prop){
    const icon = "G";
    const company = "AutoKID";
    const address = "Japan";
    const industry = "Automotive Tech";
    const qr_link = "sample";
    
    return (
        <Link className="cards" to="/partnership" state={{ record: prop.record, international: prop.international }} aria-label={`View partnership details for ${prop.company}`}>
            <div className="content">
                <div className="image">
                    <img src={mitsu} alt="Sample" width={140} height={140}/>
                </div>
                <div className="description">
                    <h1 className="company">{prop.company}</h1>
                    <h5 className="address">{prop.address}</h5>
                    <p className="industry">{prop.industry}</p>
                </div>
                {/* <div className="see_more">
                    <p>See more..</p>
                </div> */}
                <div className="qrcode">
                    <LazyQRCode value={prop.link} />
                </div>
            </div>
        </Link>

    );
}

export default memo(Cards);