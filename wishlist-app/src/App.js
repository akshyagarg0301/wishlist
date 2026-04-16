import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './components/Home';
import Occasion from './components/Occasion';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/occasion/:id" element={<Occasion />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;