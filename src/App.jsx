import { BrowserRouter, Routes, Route } from "react-router-dom"
import Idle from "./page/idle"
import Home from "./page/home"


function App() {
  return (
    <BrowserRouter>
     <Routes>
      <Route element={<Idle/>} path="/" />
      <Route element={<Home/>} path="/home" />
     </Routes>
    </BrowserRouter>
     
  )
}

export default App
