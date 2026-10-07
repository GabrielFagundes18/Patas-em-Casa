// O quê: importa o runtime do React, o renderizador DOM, o roteador e a composição principal.
// Como: os imports registram dependências antes da criação da raiz e carregam o estilo global.
// Para quê: prepara o ambiente necessário para inicializar a aplicação no navegador.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/globals.css';
import App from './app/App';

const root = ReactDOM.createRoot(document.getElementById('root'));
// O quê: monta a árvore React no elemento root do documento.
// Como: StrictMode executa verificações adicionais em desenvolvimento, enquanto BrowserRouter fornece o histórico de navegação.
// Para quê: habilita roteamento no cliente e detecta padrões potencialmente problemáticos durante o desenvolvimento.
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals

