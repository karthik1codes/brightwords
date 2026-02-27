import './App.css'
import React from "react";
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import Convert from './Pages/Convert';
import LearnSign from './Pages/LearnSign';
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
          <Route exact path='*' element={<Navigate to="/sign-kit/convert" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App;
