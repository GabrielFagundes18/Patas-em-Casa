/*
 * ============================================================================
 * ARQUIVO: index.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É o PONTO DE ENTRADA do front-end. Quando o navegador abre o site, o
 *   Create React App (react-scripts) executa este arquivo primeiro. Ele "liga" o
 *   React dentro da página HTML (public/index.html), no elemento <div id="root">.
 *
 * PRINCIPAIS ITENS:
 *   - root: a "raiz" do React, criada a partir do elemento #root do HTML.
 *   - root.render(...): desenha o componente <App /> dentro dessa raiz.
 *   (Não há funções declaradas aqui; o arquivo só executa a inicialização.)
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react / react-dom/client  → biblioteca React e o "renderizador" para o navegador.
 *   - react-router-dom          → BrowserRouter, que habilita as rotas (URLs) do site.
 *   - ./styles/globals.css      → estilos globais (cores, fontes, classes comuns).
 *   - ./app/App.js              → componente raiz, que define todas as rotas/páginas.
 *   - public/index.html         → contém o <div id="root"> onde tudo é desenhado.
 * ============================================================================
 */

// O quê: importa o runtime do React, o renderizador DOM, o roteador e a composição principal.
// Como: os imports registram dependências antes da criação da raiz e carregam o estilo global.
// Para quê: prepara o ambiente necessário para inicializar a aplicação no navegador.
// React: a biblioteca principal. Aqui é usada para acessar o React.StrictMode.
import React from 'react';
// ReactDOM (versão "client"): sabe transformar componentes React em elementos HTML reais.
import ReactDOM from 'react-dom/client';
// BrowserRouter: componente do React Router que "escuta" a URL do navegador
// e permite trocar de página sem recarregar o site (SPA — Single Page Application).
import { BrowserRouter } from 'react-router-dom';
// Importar um arquivo .css aqui faz o Webpack (usado pelo react-scripts) incluir
// esses estilos na página. Não há variável: o import serve só pelo "efeito".
import './styles/globals.css';
// O componente principal da aplicação, que decide qual página mostrar em cada URL.
import App from './app/App';

// document.getElementById('root') pega o <div id="root"> do public/index.html.
// ReactDOM.createRoot cria a "raiz" do React nesse elemento (API do React 18+).
// A variável "root" guarda essa raiz, que usamos logo abaixo para desenhar a aplicação.
const root = ReactDOM.createRoot(document.getElementById('root'));
// O quê: monta a árvore React no elemento root do documento.
// Como: StrictMode executa verificações adicionais em desenvolvimento, enquanto BrowserRouter fornece o histórico de navegação.
// Para quê: habilita roteamento no cliente e detecta padrões potencialmente problemáticos durante o desenvolvimento.
// root.render recebe o JSX que deve aparecer na tela. A ordem de "embrulho" importa:
//   StrictMode (por fora) → BrowserRouter → App (por dentro).
// Assim, App e todas as páginas dentro dele conseguem usar recursos de rota (useNavigate, Link...).
root.render(
  // React.StrictMode não aparece na tela: ele só liga avisos extras no modo de desenvolvimento
  // (por exemplo, roda alguns efeitos duas vezes para revelar bugs). Em produção não tem efeito.
  <React.StrictMode>
    {/* BrowserRouter fornece o "contexto" de navegação para todos os componentes de dentro. */}
    <BrowserRouter>
      {/* O componente raiz da aplicação. */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// (Comentário que veio do modelo do Create React App. Ele fala do "reportWebVitals",
// uma ferramenta de medição de desempenho que não é usada neste projeto.)

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. O navegador carrega o public/index.html, que tem um <div id="root"> vazio.
 *   2. O react-scripts executa este index.js.
 *   3. Os estilos globais são carregados e o React cria uma raiz no #root.
 *   4. O React desenha <App /> (dentro do StrictMode e do BrowserRouter).
 *   5. A partir daí, o App escolhe a página de acordo com a URL.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Ponto de entrada de uma aplicação React (Create React App).
 *   - ReactDOM.createRoot e root.render (React 18+).
 *   - SPA (Single Page Application) e roteamento no navegador com BrowserRouter.
 *   - React.StrictMode e para que servem os avisos do modo de desenvolvimento.
 *   - Importar CSS em JavaScript (recurso do Webpack/bundler).
 *   - Composição de componentes (um componente "embrulhando" outro).
 * ============================================================================
 */
