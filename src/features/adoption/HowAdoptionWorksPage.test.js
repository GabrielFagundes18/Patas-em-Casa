/*
 * ============================================================================
 * ARQUIVO: HowAdoptionWorksPage.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Teste automatizado da página "Como funciona a adoção": confere se ela mostra
 *   as etapas vindas da API, os requisitos, os documentos e o link para o catálogo.
 *
 * PRINCIPAIS ITENS:
 *   - renderAt(path, element, route): desenha a página numa rota.
 *   - 1 teste.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./HowAdoptionWorksPage.jsx → página testada.
 *   - api/content                → buscarEtapasAdocao substituída por mock.
 * ============================================================================
 */

// Verificações extras.
import '@testing-library/jest-dom';
// Ferramentas da Testing Library.
import { render, screen, within } from '@testing-library/react';
// Roteador de memória e rotas.
import { MemoryRouter, Route, Routes } from 'react-router-dom';
// Página testada.
import HowAdoptionWorksPage from './HowAdoptionWorksPage';
// Função de API (vira mock).
import { buscarEtapasAdocao } from 'api/content';

// Substitui o módulo de conteúdo por uma função falsa.
jest.mock('api/content', () => ({ buscarEtapasAdocao: jest.fn() }));

/*
 * FUNÇÃO AUXILIAR: renderAt
 * O que faz: desenha "element" na rota "route" a partir do endereço "path".
 */
function renderAt(path, element, route) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route element={element} path={route} /></Routes>
    </MemoryRouter>
  );
}

// Teste: etapas da API, requisitos, documentos e chamada final.
test('the how-it-works page lists steps, requirements, documents and the call to action', async () => {
  // A API devolve uma etapa (no formato do backend: titulo/descricao).
  buscarEtapasAdocao.mockResolvedValue([{ titulo: 'Escolha o animal', descricao: 'Veja o catálogo.' }]);
  renderAt('/como-funciona', <HowAdoptionWorksPage />, '/como-funciona');

  // A etapa da API substitui as etapas padrão (findByRole espera a resposta).
  expect(await screen.findByRole('heading', { name: 'Escolha o animal' })).toBeInTheDocument();
  // Bloco de requisitos.
  expect(screen.getByRole('heading', { name: 'Requisitos' })).toBeInTheDocument();
  // Um dos documentos.
  expect(screen.getByText(/Comprovante de residência/)).toBeInTheDocument();
  // Link da chamada final (dentro do <main>, para não pegar links do menu).
  expect(within(screen.getByRole('main')).getByRole('link', { name: 'Ver animais para adoção' })).toHaveAttribute('href', '/adotar');
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   A API falsa devolve uma etapa; a página é desenhada e o teste confere que a
 *   etapa aparece (substituindo as padrão) junto com os blocos fixos da página.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Mock de módulo com jest.mock e mockResolvedValue.
 *   - findBy* para conteúdo que chega depois (assíncrono).
 *   - within() para limitar a busca a uma região da página.
 * ============================================================================
 */
