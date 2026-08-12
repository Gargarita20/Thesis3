import './filters.styles.css'

function Filters(prop){
    return(
            <label className="filter">
                <input type="radio" value={prop.name} name='filter' checked={prop.checked}/> {/* checkbox to radio */}
                <span className='filler'></span>
                <span className='name'>{prop.name}</span>
            </label>
    );
}

export default Filters;