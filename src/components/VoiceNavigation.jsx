import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import mic from '../media/mic.png';
import stop from '../media/stop.png';
import './voice-navigation.styles.css';

const departments = ['Automotive', 'Computer', 'Drafting', 'Electrical', 'Electronics'];

function normalizeCompanyName(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function VoiceNavigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const recognitionRef = useRef(null);
    const listeningRef = useRef(false);
    const restartTimerRef = useRef(null);
    const routeRef = useRef(location.pathname);
    const talkBackRef = useRef(true);
    const speakingRef = useRef(false);
    const speechSuppressedUntilRef = useRef(0);
    const speechSequenceRef = useRef(0);
    const [isListening, setIsListening] = useState(false);
    const [talkBackEnabled, setTalkBackEnabled] = useState(true);
    const [status, setStatus] = useState('Voice control off');

    useEffect(() => {
        routeRef.current = location.pathname;
    }, [location.pathname]);

    useEffect(() => () => {
        listeningRef.current = false;
        window.clearTimeout(restartTimerRef.current);
        recognitionRef.current?.stop();
        window.speechSynthesis?.cancel();
    }, []);

    const announce = (message) => {
        setStatus(message);
        if (!talkBackRef.current) return;
        if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
            setStatus('Offline talk back is not supported in this browser');
            return;
        }

        const voices = window.speechSynthesis.getVoices();
        const localVoices = voices.filter((voice) => voice.localService);
        const voice = localVoices.find((candidate) => candidate.lang.toLowerCase().startsWith('en-ph'))
            || localVoices.find((candidate) => candidate.lang.toLowerCase().startsWith('en'))
            || localVoices[0];

        if (!voice) {
            setStatus('Install an offline system voice to use talk back');
            return;
        }

        const sequence = speechSequenceRef.current + 1;
        speechSequenceRef.current = sequence;
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(message);
        utterance.voice = voice;
        utterance.lang = voice.lang;
        utterance.rate = 0.95;
        speakingRef.current = true;

        const finishSpeaking = () => {
            if (speechSequenceRef.current !== sequence) return;
            speakingRef.current = false;
            speechSuppressedUntilRef.current = Date.now() + 700;
        };

        utterance.onend = finishSpeaking;
        utterance.onerror = finishSpeaking;
        window.speechSynthesis.speak(utterance);
    };

    const toggleTalkBack = () => {
        const enabled = !talkBackRef.current;
        talkBackRef.current = enabled;
        setTalkBackEnabled(enabled);

        if (enabled) {
            announce('Talk back enabled');
            return;
        }

        speechSequenceRef.current += 1;
        speakingRef.current = false;
        window.speechSynthesis?.cancel();
        setStatus('Talk back disabled');
    };

    const runCommand = (transcript) => {
        const command = transcript.toLowerCase().replace(/[.,!?]/g, '').trim();

        if (command.includes('stop listening') || command === 'stop voice control') {
            listeningRef.current = false;
            recognitionRef.current?.stop();
            setIsListening(false);
            announce('Voice control off');
            return;
        }

        if (/\b(go back|back to start|start screen|welcome screen|exit home)\b/.test(command)) {
            navigate('/');
            announce('Returned to start');
            return;
        }

        if (/\b(?:back|return) to (?:the )?(?:directory|partners?|partner list|home)\b|\bgo home\b|\btake me home\b/.test(command)) {
            navigate('/home');
            announce('Returned to the partner directory');
            return;
        }

        if (/\b(start|open|show|go to|navigate to|let's)\b.*\b(home|partners|directory)\b/.test(command) || command === 'home' || command === 'start') {
            navigate('/home');
            announce('Opened partners');
            return;
        }

        if (/\b(international|global)\b/.test(command)) {
            if (routeRef.current === '/home') {
                window.dispatchEvent(new CustomEvent('voice-scope', { detail: true }));
                announce('Showing international partners');
            } else {
                announce('Open partners to change scope');
            }
            return;
        }

        if (/\b(local|philippines|philippine)\b/.test(command)) {
            if (routeRef.current === '/home') {
                window.dispatchEvent(new CustomEvent('voice-scope', { detail: false }));
                announce('Showing local partners');
            } else {
                announce('Open partners to change scope');
            }
            return;
        }

        if (routeRef.current === '/home') {
            if (/\b(all|everything)\b/.test(command)) {
                window.dispatchEvent(new CustomEvent('voice-filter', { detail: 'All' }));
                announce('Showing all partners');
                return;
            }

            const department = departments.find((name) => command.includes(name.toLowerCase()));
            if (department) {
                window.dispatchEvent(new CustomEvent('voice-filter', { detail: department }));
                announce(`Filtering ${department}`);
                return;
            }

            const cards = document.querySelector('.cards_wrapper');
            if (cards && /\b(scroll|go) down\b/.test(command)) {
                cards.scrollBy({ top: cards.clientHeight * 0.8, behavior: 'smooth' });
                announce('Scrolled down');
                return;
            }

            if (cards && /\b(scroll|go) up\b/.test(command)) {
                cards.scrollBy({ top: -cards.clientHeight * 0.8, behavior: 'smooth' });
                announce('Scrolled up');
                return;
            }

            const selectionMatch = command.match(/^(?:please\s+)?(?:open|select|click(?:\s+on)?|choose|show|view)\s+(?:(?:(?:the|a|an)\s+)?(?:company|partner|card|partnership)(?:\s+(?:named|called|for))?\s+)?(.+)$/);
            const requestedCompany = selectionMatch?.[1].replace(/^(?:the|a|an)\s+/, '') || command;
            const normalizedRequest = normalizeCompanyName(requestedCompany);
            const partnerCards = Array.from(document.querySelectorAll('.cards_wrapper a.cards'))
                .map((card) => ({
                    element: card,
                    name: card.querySelector('.company')?.textContent?.trim() || '',
                }))
                .filter((card) => card.name);
            const exactMatches = partnerCards.filter(
                (card) => normalizeCompanyName(card.name) === normalizedRequest
            );
            const matches = exactMatches.length > 0
                ? exactMatches
                : selectionMatch && normalizedRequest.length >= 3
                    ? partnerCards.filter((card) => normalizeCompanyName(card.name).includes(normalizedRequest))
                    : [];

            if (matches.length === 1) {
                announce(`Opening ${matches[0].name}`);
                matches[0].element.click();
                return;
            }

            if (selectionMatch) {
                announce(matches.length > 1
                    ? 'More than one partner matched. Say more of the company name.'
                    : `No visible partner matched ${requestedCompany}`);
                return;
            }
        }

        announce(`I heard ${transcript}, but did not find a matching command.`);
    };

    const stopListening = () => {
        listeningRef.current = false;
        window.clearTimeout(restartTimerRef.current);
        recognitionRef.current?.stop();
        setIsListening(false);
        announce('Voice control off');
    };

    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            announce('Voice recognition is not supported in this browser');
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
            announce('Listening');
        };

        recognition.onresult = (event) => {
            if (speakingRef.current || Date.now() < speechSuppressedUntilRef.current) return;

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
                announce('Allow microphone access to use voice control');
            } else if (event.error !== 'no-speech') {
                announce(`Voice error: ${event.error}`);
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
                    announce('Restarting voice control');
                }
            }, 300);
        };

        try {
            recognition.start();
        } catch {
            listeningRef.current = false;
            setIsListening(false);
            announce('Could not start voice control');
        }
    };

    return (
        <div className="voice-navigation">
            <span className="voice-navigation-status" aria-live="polite">{status}</span>
            <button
                className={`voice-navigation-talkback${talkBackEnabled ? ' is-enabled' : ''}`}
                type="button"
                onClick={toggleTalkBack}
                aria-pressed={talkBackEnabled}
                aria-label={`Talk back ${talkBackEnabled ? 'on' : 'off'}`}
                title={`Talk back ${talkBackEnabled ? 'on' : 'off'}`}
            >
                Talk back {talkBackEnabled ? 'on' : 'off'}
            </button>
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