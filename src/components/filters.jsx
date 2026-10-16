import './filters.styles.css'

function Filters(prop){
    const value = prop.value ?? prop.name;

    return(
            <label className="filter">
                <input type="radio" name="filter" checked={prop.checked} onChange={prop.change} value={value}/>
                
                <span className='filler'></span>
                <span className='name'>{prop.name}</span>
            </label>
    );
}

export default Filters;