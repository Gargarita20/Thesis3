import Speech from "react-text-to-speech";

export default function Speak(prop){
    return <Speech text={prop.text} stableText={true} />
} 