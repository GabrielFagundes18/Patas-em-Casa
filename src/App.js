// O quê: importa o estilo global e as páginas que participam do roteamento.
// Como: os módulos ES são carregados uma vez e os componentes são usados como elementos React.
// Para quê: reúne a composição visual e as telas principais em um ponto de entrada único.
import './styles/globals.css';
import LandingPage from './pages/LandingPage';
import AdoptionCatalog from './pages/AdoptionCatalog';
import { Route, Routes } from 'react-router-dom';

// O quê: declara o componente raiz de navegação da aplicação.
// Como: Routes seleciona a primeira Route compatível com a URL atual.
// Para quê: separa a landing page do catálogo de adoção sem duplicar o bootstrap do React.
function App() {
  return (
    // O quê: registra as rotas públicas da aplicação.
    // Como: a rota explícita /adotar renderiza o catálogo e o curinga cobre os demais caminhos.
    // Para quê: garante uma página inicial funcional e um destino estável para adoção.
    <Routes>  
      <Route path="/adotar" element={<AdoptionCatalog />} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}

// O quê: exporta App como componente padrão.
// Como: permite que o arquivo de inicialização o importe sem conhecer sua implementação.
// Para quê: conecta o roteador à árvore React montada no DOM.
export default App;
