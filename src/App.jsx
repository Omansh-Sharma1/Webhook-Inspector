import { Routes, Route } from 'react-router-dom';
import Home from './components/Home.jsx';
import Dashboard from './components/Dashboard.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/i/:slug" element={<Dashboard />} />
    </Routes>
  );
}
