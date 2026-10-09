import { Link, useLocation } from 'react-router-dom';
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
                        <dd>{record.Information || "Not provided"}</dd>
                    </div>
                </dl>

                {record.Link && (
                    <a className="partnership-website" href={record.Link} target="_blank" rel="noreferrer">
                        Visit partner website
                    </a>
                )}
            </section>
        </main>
    );
}

export default Partnership;