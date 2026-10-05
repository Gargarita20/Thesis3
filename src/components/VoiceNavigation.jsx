import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import mic from '../media/mic.png';
import stop from '../media/stop.png';
import './voice-navigation.styles.css';

const departments = ['Automotive', 'Computer', 'Drafting', 'Electrical', 'Electronics'];

function VoiceNavigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const recognitionRef = useRef(null);
    const listeningRef = useRef(false);
    const restartTimerRef = useRef(null);
    const routeRef = useRef(location.pathname);
    const [isListening, setIsListening] = useState(false);
    const [status, setStatus] = useState('Voice control off');

    useEffect(() => {
        routeRef.current = location.pathname;
    }, [location.pathname]);

    useEffect(() => () => {
        listeningRef.current = false;
        window.clearTimeout(restartTimerRef.current);
        recognitionRef.current?.stop();
    }, []);

    const runCommand = (transcript) => {
        const command = transcript.toLowerCase().replace(/[.,!?]/g, '').trim();

        if (command.includes('stop listening') || command === 'stop voice control') {
            listeningRef.current = false;
            recognitionRef.current?.stop();
            setIsListening(false);
            setStatus('Voice control off');
            return;
        }

        if (/\b(go back|back to start|start screen|welcome screen|exit home)\b/.test(command)) {
            navigate('/');
            setStatus('Returned to start');
            return;
        }

        if (/\b(start|open|show|go to|navigate to)\b.*\b(home|partners|directory)\b/.test(command) || command === 'home' || command === 'start') {
            navigate('/home');
            setStatus('Opened partners');
            return;
        }

        if (/\b(international|global)\b/.test(command)) {
            if (routeRef.current === '/home') {
                window.dispatchEvent(new CustomEvent('voice-scope', { detail: true }));
                setStatus('Showing international partners');
            } else {
                setStatus('Open partners to change scope');
            }
            return;
        }

        if (/\b(local|philippines|philippine)\b/.test(command)) {
            if (routeRef.current === '/home') {
                window.dispatchEvent(new CustomEvent('voice-scope', { detail: false }));
                setStatus('Showing local partners');
            } else {
                setStatus('Open partners to change scope');
            }
            return;
        }

        if (routeRef.current === '/home') {
            if (/\b(all|everything)\b/.test(command)) {
                window.dispatchEvent(new CustomEvent('voice-filter', { detail: 'All' }));
                setStatus('Showing all partners');
                return;
            }

            const department = departments.find((name) => command.includes(name.toLowerCase()));
            if (department) {
                window.dispatchEvent(new CustomEvent('voice-filter', { detail: department }));
                setStatus(`Filtering ${department}`);
                return;
            }

            const cards = document.querySelector('.cards_wrapper');
            if (cards && /\b(scroll|go) down\b/.test(command)) {
                cards.scrollBy({ top: cards.clientHeight * 0.8, behavior: 'smooth' });
                setStatus('Scrolled down');
                return;
            }

            if (cards && /\b(scroll|go) up\b/.test(command)) {
                cards.scrollBy({ top: -cards.clientHeight * 0.8, behavior: 'smooth' });
                setStatus('Scrolled up');
                return;
            }
        }

        setStatus(`Heard: ${transcript}`);
    };

    const stopListening = () => {
        listeningRef.current = false;
        window.clearTimeout(restartTimerRef.current);
        recognitionRef.current?.stop();
        setIsListening(false);
        setStatus('Voice control off');
    };

    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setStatus('Voice recognition is not supported in this browser');
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        listeningRef.current = true;
        recognition.lang = 'en-PH';
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            setStatus('Listening');
        };

        recognition.onresult = (event) => {
            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                if (event.results[index].isFinal) {
                    runCommand(event.results[index][0].transcript);
                }
            }
        };

        recognition.onerror = (event) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                listeningRef.current = false;
                setIsListening(false);
                setStatus('Allow microphone access to use voice control');
            } else if (event.error !== 'no-speech') {
                setStatus(`Voice error: ${event.error}`);
            }
        };

        recognition.onend = () => {
            if (!listeningRef.current || recognitionRef.current !== recognition) {
                setIsListening(false);
                return;
            }

            restartTimerRef.current = window.setTimeout(() => {
                if (!listeningRef.current || recognitionRef.current !== recognition) return;
                try {
                    recognition.start();
                } catch {
                    setStatus('Restarting voice control');
                }
            }, 300);
        };

        try {
            recognition.start();
        } catch {
            listeningRef.current = false;
            setIsListening(false);
            setStatus('Could not start voice control');
        }
    };

    return (
        <div className="voice-navigation">
            <span className="voice-navigation-status" aria-live="polite">{status}</span>
            <button
                className="voice-navigation-button"
                type="button"
                onClick={isListening ? stopListening : startListening}
                aria-label={isListening ? 'Stop voice control' : 'Start voice control'}
                title={isListening ? 'Stop voice control' : 'Start voice control'}
            >
                <img src={isListening ? stop : mic} alt="" />
            </button>
        </div>
    );
}

export default VoiceNavigation;