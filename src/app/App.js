/*
 * ============================================================================
 * ARQUIVO: App.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É o componente RAIZ da aplicação e o "mapa" de rotas do site. Ele diz qual
 *   página aparece para cada endereço (URL), por exemplo:
 *     /            → página inicial (LandingPage)
 *     /adotar      → catálogo de animais
 *     /admin/...   → painel administrativo (protegido por login)
 *
 * PRINCIPAIS ITENS:
 *   - AdminLoginPage, AdminDashboardPage, AdminForgotPasswordPage,
 *     AdminResetPasswordPage: páginas do painel carregadas sob demanda (lazy).
 *   - ADMIN_TABS: lista das abas do painel, cada uma vira uma rota.
 *   - App(): o componente que monta as rotas (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - styles/globals.css                          → estilos globais.
 *   - features/home/LandingPage                   → página inicial.
 *   - features/catalog/AdoptionCatalog            → catálogo de adoção.
 *   - features/animal-profile/AnimalProfilePage   → perfil de um animal.
 *   - features/adoption/HowAdoptionWorksPage      → "como funciona a adoção".
 *   - features/donation/DonationPage, DonationReturnPage, CancelSubscriptionPage → doações.
 *   - admin/security/RequireAdminSession          → "porteiro" das rotas do painel.
 *   - admin/security/AdminLoginPage, AdminForgotPasswordPage, AdminResetPasswordPage.
 *   - admin/AdminDashboardPage                    → o painel com suas abas.
 *   - ./NotFoundPage                              → página de erro 404.
 *   - react (lazy, Suspense) e react-router-dom (Routes, Route).
 *   - Quem usa este arquivo: src/index.js, que desenha <App /> na tela.
 * ============================================================================
 */

// O quê: importa o estilo global e as páginas que participam do roteamento.
// Como: os módulos ES são carregados uma vez e os componentes são usados como elementos React.
// Para quê: reúne a composição visual e as telas principais em um ponto de entrada único.
// Estilos globais do site (o caminho 'styles/...' parte da pasta src, graças ao jsconfig.json).
import 'styles/globals.css';
// Página inicial do site.
import LandingPage from 'features/home/LandingPage';
// Catálogo com a lista de animais para adoção.
import AdoptionCatalog from 'features/catalog/AdoptionCatalog';
// lazy: permite carregar um componente só quando ele for necessário (divide o código em partes).
// Suspense: mostra algo provisório (ex.: "Carregando...") enquanto essa parte é baixada.
import { lazy, Suspense } from 'react';
// Componente que só deixa entrar nas rotas do painel quem está logado.
import RequireAdminSession from 'admin/security/RequireAdminSession';
// Página com o perfil completo de um animal.
import AnimalProfilePage from 'features/animal-profile/AnimalProfilePage';
// Página para cancelar uma doação mensal (assinatura).
import CancelSubscriptionPage from 'features/donation/CancelSubscriptionPage';
// Página de doação.
import DonationPage from 'features/donation/DonationPage';
// Página exibida quando o visitante volta do pagamento (Mercado Pago).
import DonationReturnPage from 'features/donation/DonationReturnPage';
// Página explicando o passo a passo da adoção.
import HowAdoptionWorksPage from 'features/adoption/HowAdoptionWorksPage';
// Página de "não encontrado" (erro 404).
import NotFoundPage from './NotFoundPage';
// Routes: agrupa as rotas e escolhe qual mostrar. Route: define UMA rota (caminho → página).
import { Route, Routes } from 'react-router-dom';

// O painel só é baixado por quem abre /admin: visitantes do site não carregam o código administrativo.
// lazy(() => import('...')) usa o "import dinâmico": o arquivo só é baixado quando o componente
// for desenhado pela primeira vez. Isso deixa o site público mais leve e rápido.
// Página de login do painel.
const AdminLoginPage = lazy(() => import('admin/security/AdminLoginPage'));
// Página principal do painel (com menu lateral e abas).
const AdminDashboardPage = lazy(() => import('admin/AdminDashboardPage'));
// Página "esqueci minha senha".
const AdminForgotPasswordPage = lazy(() => import('admin/security/AdminForgotPasswordPage'));
// Página para definir uma nova senha (aberta pelo link enviado por e-mail).
const AdminResetPasswordPage = lazy(() => import('admin/security/AdminResetPasswordPage'));

// Abas do painel: cada uma é uma rota protegida que abre a mesma página com a seção correspondente.
// Esta lista de textos vira rotas como /admin/animais, /admin/adocoes etc. (veja o .map no JSX).
const ADMIN_TABS = ['animais', 'adocoes', 'adotantes', 'historias', 'doacoes', 'voluntarios', 'configuracoes'];

/*
 * COMPONENTE: App
 * O que faz: define todas as rotas do site e qual página aparece em cada uma.
 * Parâmetros: nenhum (não recebe props).
 * Retorno: JSX com o <Suspense> envolvendo as <Routes>.
 * Onde é usado: em src/index.js, dentro do <BrowserRouter>.
 */
// O quê: declara o componente raiz de navegação da aplicação.
// Como: Routes seleciona a primeira Route compatível com a URL atual.
// Para quê: separa a landing page do catálogo de adoção sem duplicar o bootstrap do React.
function App() {
  return (
    // Suspense: enquanto uma página "lazy" estiver sendo baixada, mostra o "fallback".
    // role="status" faz leitores de tela anunciarem a mensagem "Carregando...".
    <Suspense fallback={<p className="route-loading" role="status">Carregando...</p>}>
    {/* Routes olha a URL atual e desenha a Route que combinar com ela. */}
    <Routes>
      {/* ----- Rotas públicas do site ----- */}
      {/* path é o endereço; element é o componente (página) que aparece nesse endereço. */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/adotar" element={<AdoptionCatalog />} />
      {/* ":id" é um parâmetro dinâmico: em /animais/42, a página lê id = "42" com useParams(). */}
      <Route path="/animais/:id" element={<AnimalProfilePage />} />
      <Route path="/como-funciona" element={<HowAdoptionWorksPage />} />
      <Route path="/doar" element={<DonationPage />} />
      <Route path="/doar/retorno" element={<DonationReturnPage />} />
      <Route path="/doar/cancelar" element={<CancelSubscriptionPage />} />
      {/* ----- Rotas do painel que NÃO exigem login ----- */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/esqueci-senha" element={<AdminForgotPasswordPage />} />
      <Route path="/admin/redefinir-senha" element={<AdminResetPasswordPage />} />
      {/* ----- Rotas protegidas do painel -----
          Esta Route não tem "path": ela é uma "rota de layout". O RequireAdminSession roda
          primeiro; se o usuário estiver logado, ele desenha a rota filha (via <Outlet />);
          se não estiver, redireciona para o login. */}
      <Route element={<RequireAdminSession />}>
        {/* /admin sem aba: abre o painel na visão geral (dashboard). */}
        <Route path="/admin" element={<AdminDashboardPage />} />
        {/* .map() cria uma Route para cada aba da lista ADMIN_TABS.
            Todas usam o mesmo AdminDashboardPage, mudando só a prop activeTab.
            "key" é obrigatória em listas e ajuda o React a identificar cada item.
            A template string `/admin/${tab}` monta o caminho, ex.: "/admin/animais". */}
        {ADMIN_TABS.map((tab) => (
          <Route element={<AdminDashboardPage activeTab={tab} />} key={tab} path={`/admin/${tab}`} />
        ))}
      </Route>
      {/* path="*" combina com QUALQUER endereço que não foi atendido acima → página 404. */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
}

// O quê: exporta App como componente padrão.
// Como: permite que o arquivo de inicialização o importe sem conhecer sua implementação.
// Para quê: conecta o roteador à árvore React montada no DOM.
export default App;

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. O index.js desenha <App /> dentro do BrowserRouter.
 *   2. O App desenha <Routes>, que compara a URL atual com cada <Route>.
 *   3. Se for uma rota pública (ex.: /adotar), a página aparece diretamente.
 *   4. Se for uma rota do painel (ex.: /admin/animais), primeiro passa pelo
 *      RequireAdminSession, que confere o login.
 *   5. Páginas do painel são "lazy": na primeira visita, o código delas é baixado,
 *      e o Suspense mostra "Carregando..." enquanto isso.
 *   6. Se nenhuma rota combinar, aparece a NotFoundPage (404).
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - React Router v6: Routes, Route, parâmetros de rota (:id) e rota coringa (*).
 *   - Rotas aninhadas e "rotas de layout" (Route sem path + Outlet) para proteger páginas.
 *   - Code splitting (divisão de código) com React.lazy, import() dinâmico e Suspense.
 *   - Gerar elementos a partir de listas com .map() e a prop "key".
 *   - Template strings para montar caminhos.
 *   - export default e organização de um componente raiz.
 * ============================================================================
 */
