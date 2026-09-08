import './styles/root.css';
import './styles/layout.css';
import './styles/hero.css';
import './styles/cards.css';
import './styles/donation.css';
import './styles/footer.css';
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
