// O quê: importa o estilo global e as páginas que participam do roteamento.
// Como: os módulos ES são carregados uma vez e os componentes são usados como elementos React.
// Para quê: reúne a composição visual e as telas principais em um ponto de entrada único.
import './styles/globals.css';
import LandingPage from './pages/LandingPage';
import AdoptionCatalog from './pages/AdoptionCatalog';
import AdminLoginPage from './admin/security/AdminLoginPage';
import AdminDashboardPage from './admin/AdminDashboardPage';
import { Route, Routes } from 'react-router-dom';

// O quê: declara o componente raiz de navegação da aplicação.
// Como: Routes seleciona a primeira Route compatível com a URL atual.
// Para quê: separa a landing page do catálogo de adoção sem duplicar o bootstrap do React.
function App() {
  return (
    <Routes>
      <Route path="/adotar" element={<AdoptionCatalog />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/admin/animais" element={<AdminDashboardPage activeTab="animais" />} />
      <Route path="/admin/adocoes" element={<AdminDashboardPage activeTab="adocoes" />} />
      <Route path="/admin/doacoes" element={<AdminDashboardPage activeTab="doacoes" />} />
      <Route path="/admin/voluntarios" element={<AdminDashboardPage activeTab="voluntarios" />} />
      <Route path="/admin/configuracoes" element={<AdminDashboardPage activeTab="configuracoes" />} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}

// O quê: exporta App como componente padrão.
// Como: permite que o arquivo de inicialização o importe sem conhecer sua implementação.
// Para quê: conecta o roteador à árvore React montada no DOM.
export default App;
