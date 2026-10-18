import { Routes, Route, useLocation, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"
import Idle from "./page/idle"
import Home from "./page/home"
import Partnership from "./page/partnership"
import RemoteControl from "./page/remote-control"
import VoiceNavigation from "./components/VoiceNavigation"
import { API_URL, SOCKET_URL } from "./config"

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0}}
    animate={{ opacity: 1}}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);

function MainContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [remoteUrl, setRemoteUrl] = useState('');
  const currentPathRef = useRef(location.pathname);
  const navigateRef = useRef(navigate);
  currentPathRef.current = location.pathname;
  navigateRef.current = navigate;

  useEffect(() => {
    if (currentPathRef.current.startsWith('/remote/')) return undefined;

    let cancelled = false;
    let socket;
    fetch(`${API_URL}/api/remote-session`, { method: 'POST' })
      .then((response) => {
        if (!response.ok) throw new Error('Could not create a remote session');
        return response.json();
      })
      .then(({ token }) => {
        if (cancelled) return;
        setRemoteUrl(`${window.location.origin}/remote/${token}`);
        socket = io(SOCKET_URL);
        socket.on('connect', () => socket.emit('remote:kiosk', token));
        socket.on('remote:command', (command) => {
          if (command === 'home' || command === 'start') navigateRef.current('/home');
          else if (command === 'back') {
            navigateRef.current(currentPathRef.current === '/partnership' ? '/home' : '/');
          } else if (command === 'local' || command === 'international') {
            window.dispatchEvent(new CustomEvent('voice-scope', { detail: command === 'international' }));
          } else if (command === 'all') {
            window.dispatchEvent(new CustomEvent('voice-filter', { detail: 'All' }));
          } else if (command === 'scroll-up' || command === 'scroll-down') {
            const cards = document.querySelector('.cards_wrapper');
            cards?.scrollBy({
              top: (command === 'scroll-down' ? 1 : -1) * (cards.clientHeight * 0.8),
              behavior: 'smooth',
            });
          } else {
            window.dispatchEvent(new CustomEvent('voice-filter', { detail: command }));
          }
        });
      })
      .catch((error) => console.error('Remote control unavailable:', error));

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageWrapper>
                <Idle remoteUrl={remoteUrl} />
              </PageWrapper>
            }
          />
          <Route
            path="/remote/:token"
            element={<PageWrapper><RemoteControl /></PageWrapper>}
          />
          <Route
            path="/home"
            element={
              <PageWrapper>
                <Home />
              </PageWrapper>
            }
          />
          <Route
            path="/partnership"
            element={
              <PageWrapper>
                <Partnership />
              </PageWrapper>
            }
          />
        </Routes>
      </AnimatePresence>
      {!location.pathname.startsWith('/remote/')}
      {/* {!location.pathname.startsWith('/remote/') && <VoiceNavigation />} */}
    </>
  );
}

function App() {
  return <MainContent />
}

export default App
