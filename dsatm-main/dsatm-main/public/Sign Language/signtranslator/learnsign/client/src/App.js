import './App.css'
import React from "react";
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import Convert from './Pages/Convert';
import LearnSign from './Pages/LearnSign';
import AnimateWithAI from './Pages/AnimateWithAI';
import AISigningVideo from './Pages/AISigningVideo';
import Navbar from './Components/Navbar';

function App() {
  return(
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/sign-kit/convert" replace />} />
          <Route exact path='/sign-kit/convert' element={<Convert />} />
          <Route exact path='/sign-kit/learn-sign' element={<LearnSign />} />
          <Route exact path='/sign-kit/animate-with-ai' element={<AnimateWithAI />} />
          <Route exact path='/sign-kit/ai-signing-video' element={<AISigningVideo />} />
          <Route exact path='*' element={<Navigate to="/sign-kit/convert" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App;
