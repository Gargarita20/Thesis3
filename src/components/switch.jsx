import './switch.style.css'



function Switch(props){
    return(
        <label className="switch">
            <input type="checkbox" checked={props.switch} onChange={props.onchange} />
            <span className='slider'></span>
        </label>
    );
}

export default Switch;
            
            