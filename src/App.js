// O quê: importa o estilo global e as páginas que participam do roteamento.
// Como: os módulos ES são carregados uma vez e os componentes são usados como elementos React.
// Para quê: reúne a composição visual e as telas principais em um ponto de entrada único.
import './styles/globals.css';
import LandingPage from './pages/LandingPage';
import AdoptionCatalog from './pages/AdoptionCatalog';
import { lazy, Suspense } from 'react';
import RequireAdminSession from './admin/security/RequireAdminSession';
import AnimalProfilePage from './pages/AnimalProfilePage';
import CancelSubscriptionPage from './pages/CancelSubscriptionPage';
import DonationPage from './pages/DonationPage';
import DonationReturnPage from './pages/DonationReturnPage';
import HowAdoptionWorksPage from './pages/HowAdoptionWorksPage';
import NotFoundPage from './pages/NotFoundPage';
import { Route, Routes } from 'react-router-dom';

// O painel só é baixado por quem abre /admin: visitantes do site não carregam o código administrativo.
const AdminLoginPage = lazy(() => import('./admin/security/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./admin/AdminDashboardPage'));
const AdminForgotPasswordPage = lazy(() => import('./admin/security/AdminForgotPasswordPage'));
const AdminResetPasswordPage = lazy(() => import('./admin/security/AdminResetPasswordPage'));

// Abas do painel: cada uma é uma rota protegida que abre a mesma página com a seção correspondente.
const ADMIN_TABS = ['animais', 'adocoes', 'adotantes', 'historias', 'doacoes', 'voluntarios', 'configuracoes'];

// O quê: declara o componente raiz de navegação da aplicação.
// Como: Routes seleciona a primeira Route compatível com a URL atual.
// Para quê: separa a landing page do catálogo de adoção sem duplicar o bootstrap do React.
function App() {
  return (
    <Suspense fallback={<p className="route-loading" role="status">Carregando...</p>}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/adotar" element={<AdoptionCatalog />} />
      <Route path="/animais/:id" element={<AnimalProfilePage />} />
      <Route path="/como-funciona" element={<HowAdoptionWorksPage />} />
      <Route path="/doar" element={<DonationPage />} />
      <Route path="/doar/retorno" element={<DonationReturnPage />} />
      <Route path="/doar/cancelar" element={<CancelSubscriptionPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/esqueci-senha" element={<AdminForgotPasswordPage />} />
      <Route path="/admin/redefinir-senha" element={<AdminResetPasswordPage />} />
      <Route element={<RequireAdminSession />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        {ADMIN_TABS.map((tab) => (
          <Route element={<AdminDashboardPage activeTab={tab} />} key={tab} path={`/admin/${tab}`} />
        ))}
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
}

// O quê: exporta App como componente padrão.
// Como: permite que o arquivo de inicialização o importe sem conhecer sua implementação.
// Para quê: conecta o roteador à árvore React montada no DOM.
export default App;
