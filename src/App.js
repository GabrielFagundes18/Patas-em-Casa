import './styles/globals.css';
import LandingPage from './pages/LandingPage';
import AdoptionCatalog from './pages/AdoptionCatalog';
import { Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Routes>  
      <Route path="/adotar" element={<AdoptionCatalog />} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}

export default App;
