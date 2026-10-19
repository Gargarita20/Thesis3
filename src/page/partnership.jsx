import { Link, useLocation } from 'react-router-dom';
import QRCode from 'react-qr-code';
import LocationMap from '../components/location-map';
import './partnership.styles.css';

function Partnership() {
    const { state } = useLocation();
    const record = state?.record;
    const international = state?.international ?? false;

    if (!record) {
        return (
            <main className="partnership-page">
                <Link className="partnership-back" to="/home">Back to directory</Link>
                <section className="partnership-empty">
                    <h1>Partnership details unavailable</h1>
                    <p>Choose a partner from the directory to view its information.</p>
                </section>
            </main>
        );
    }

    const company = international ? record.Industry : record.Partner_Industry;
    const department = international ? 'International Partner' : record.Deptmt;

    return (
        <main className="partnership-page">
            <header className="partnership-header">
                <Link className="partnership-back" to="/home">Back to directory</Link>
                <span className="partnership-scope">{international ? 'International' : 'Local'} partnership</span>
            </header>

            <section className="partnership-content" aria-labelledby="partnership-title">
                <p className="partnership-eyebrow">CIT Partnerships</p>
                <h1 id="partnership-title">{company || 'Unnamed partner'}</h1>
                <p className="partnership-intro">Partnership information</p>

                <h2 className="partnership-map-heading">Map location</h2>
                <LocationMap address={record.Address} />

                <dl className="partnership-facts">
                    <div>
                        <dt>Location</dt>
                        <dd>{record.Address || 'Not provided'}</dd>
                    </div>
                    <div>
                        <dt>Department</dt>
                        <dd>{department || 'Not provided'}</dd>
                    </div>
                    <div>
                        <dt>Partnership type</dt>
                        <dd>{international ? 'International' : 'Local'}</dd>
                    </div>
                    <div>
                        <dt>Partnership Information</dt>
                        <dd className='information'>{record.Information || "Not provided"}</dd>
                    </div>
                </dl>

                {record.Link && (
                    <section className="partnership-qr" aria-labelledby="partnership-qr-title">
                        <h2 id="partnership-qr-title">Partner website QR code</h2>
                        <div className="partnership-qr-code" title="Scan to open the partner website">
                            <QRCode value={record.Link} size={160} />
                        </div>
                        <p>Scan to open the partner website</p>
                    </section>
                )}
            </section>
        </main>
    );
}

export default Partnership;