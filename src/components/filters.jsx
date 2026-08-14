import './filters.styles.css'

function Filters(prop){
    return(
            <label className="filter">
                <input type="radio" name="filter" checked={prop.checked} onChange={prop.change} value={prop.name}/> {/* checkbox to radio */}
                
                <span className='filler'></span>
                <span className='name'>{prop.name}</span>
            </label>
    );
}

export default Filters;