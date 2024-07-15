import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './styles/main.scss';
import Home from './P-Home.js';
import Blog from './P-Blog.js';
import SideHustle from './P-Side-hustle.js';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/side-hustle" element={<SideHustle />} />
      </Routes>
    </Router>
  );
}

export default App;
