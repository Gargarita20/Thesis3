import './switch.style.css'



function Switch(props){
    return(
        <label className="switch">
            <input type="checkbox" />
            <span className='slider'></span>
        </label>
    );
}

export default Switch;
            
            