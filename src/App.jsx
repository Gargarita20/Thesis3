import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import Idle from "./page/idle"
import Home from "./page/home"

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

  return (
    <>
      <AnimatePresence mode="wait">
        {/* Pass location and location.pathname as the key */}
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageWrapper>
                <Idle />
              </PageWrapper>
            }
          />
          <Route
            path="/home"
            element={
              <PageWrapper>
                <Home />
              </PageWrapper>
            }
          />
        </Routes>
      </AnimatePresence>
    </>
  );
}


function App() {
  const location = useLocation();
  return (
    <MainContent/>
  )
}



export default App
