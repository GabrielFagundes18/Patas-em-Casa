/*
 * ============================================================================
 * ARQUIVO: AnimalProfilePage.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Testes automatizados da página de perfil do animal: galeria, temperamento,
 *   saúde, abertura do formulário de adoção e os casos "já adotado" (410) e
 *   "não encontrado" (404).
 *
 * PRINCIPAIS ITENS:
 *   - nino: animal de exemplo com duas fotos.
 *   - renderAt(path, element, route): desenha um elemento numa rota.
 *   - 3 testes.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./AnimalProfilePage.jsx → componente testado.
 *   - api/animals             → buscarAnimal substituído por mock.
 *   - Indiretamente: AdoptionFormModal (o formulário que abre).
 * ============================================================================
 */

// Verificações extras.
import '@testing-library/jest-dom';
// Ferramentas da Testing Library.
import { fireEvent, render, screen, within } from '@testing-library/react';
// Roteador de memória e rotas (a página precisa do ":id" da rota).
import { MemoryRouter, Route, Routes } from 'react-router-dom';
// Página testada.
import AnimalProfilePage from './AnimalProfilePage';
// Função de API (vira mock).
import { buscarAnimal } from 'api/animals';

// Substitui a API por uma função falsa.
jest.mock('api/animals', () => ({ buscarAnimal: jest.fn() }));

// Animal de exemplo, com duas fotos e dois traços de temperamento.
const nino = {
  id: '11111111-1111-4111-8111-111111111111',
  nome: 'Nino',
  especie: 'cachorro',
  raca: null,
  sexo: 'macho',
  idade_anos: 2,
  porte: 'medio',
  status: 'disponivel',
  descricao: 'Adora passear.',
  foto_url: 'https://api.example/uploads/animais/a.jpg',
  data_entrada: '2026-08-23',
  castrado: true,
  vacinado: false,
  temperamento: ['brincalhão', 'convive com gatos'],
  fotos: [
    { id: 'f1', url: 'https://api.example/uploads/animais/a.jpg', principal: true },
    { id: 'f2', url: 'https://api.example/uploads/animais/b.jpg', principal: false },
  ],
};

/*
 * FUNÇÃO AUXILIAR: renderAt
 * O que faz: desenha "element" na rota "route", começando no endereço "path".
 * Parâmetros: path (URL inicial), element (JSX da página), route (padrão da rota, ex.: '/animais/:id').
 */
function renderAt(path, element, route) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route element={element} path={route} /></Routes>
    </MemoryRouter>
  );
}

// Teste 1: perfil completo e abertura do formulário de adoção.
test('the animal profile shows the gallery, temperament and health, and opens the adoption form', async () => {
  // A API devolve o Nino.
  buscarAnimal.mockResolvedValue(nino);
  renderAt(`/animais/${nino.id}`, <AnimalProfilePage />, '/animais/:id');

  // Título com o nome.
  expect(await screen.findByRole('heading', { level: 1, name: 'Nino' })).toBeInTheDocument();
  // A busca usou o id da URL.
  expect(buscarAnimal).toHaveBeenCalledWith(nino.id, expect.anything());
  // A foto 1 de 2 aparece primeiro.
  expect(screen.getByRole('img', { name: /foto 1 de 2/ })).toHaveAttribute('src', nino.fotos[0].url);
  // Clicar na miniatura 2 troca a foto.
  fireEvent.click(screen.getByRole('button', { name: 'Ver foto 2' }));
  expect(screen.getByRole('img', { name: /foto 2 de 2/ })).toHaveAttribute('src', nino.fotos[1].url);
  // Temperamento e saúde (castração realizada, vacinação pendente).
  expect(screen.getByText('convive com gatos')).toBeInTheDocument();
  expect(screen.getByText('Realizada')).toBeInTheDocument();
  expect(screen.getByText('Pendente')).toBeInTheDocument();

  // Abre o formulário de adoção.
  fireEvent.click(screen.getByRole('button', { name: 'Quero adotar o Nino' }));
  // O formulário é um diálogo com título "Quero adotar Nino", começando no passo 1.
  const form = await screen.findByRole('dialog', { name: 'Quero adotar Nino' });
  expect(within(form).getByText('Passo 1 de 3')).toBeInTheDocument();
  expect(within(form).getByLabelText('Nome completo')).toBeInTheDocument();
});

// Teste 2: animal adotado (410) mostra a mensagem do backend e o link para o catálogo.
test('an adopted animal shows the API message and a link to the catalog', async () => {
  // mockRejectedValue: a busca falha com um objeto parecido com o erro do axios.
  buscarAnimal.mockRejectedValue({ response: { status: 410, data: { error: { message: 'Nino já encontrou um lar.' } } } });
  renderAt(`/animais/${nino.id}`, <AnimalProfilePage />, '/animais/:id');

  expect(await screen.findByRole('heading', { name: 'Nino já encontrou um lar.' })).toBeInTheDocument();
  // Procura o link dentro do <main> (role "main") para não confundir com links do menu.
  expect(within(screen.getByRole('main')).getByRole('link', { name: 'Ver animais para adoção' })).toHaveAttribute('href', '/adotar');
});

// Teste 3: animal inexistente (404) mostra "não encontrado".
test('a missing animal shows "not found"', async () => {
  buscarAnimal.mockRejectedValue({ response: { status: 404 } });
  renderAt('/animais/x', <AnimalProfilePage />, '/animais/:id');
  expect(await screen.findByRole('heading', { name: 'Não encontramos este animal' })).toBeInTheDocument();
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   Em cada teste, a API falsa responde de um jeito (sucesso, 410 ou 404); a página
 *   é desenhada na rota /animais/:id e os testes conferem o que aparece e o que
 *   acontece ao interagir (trocar foto, abrir o formulário).
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Testar rotas com parâmetros (MemoryRouter + Routes + Route).
 *   - Simular erros HTTP com mockRejectedValue (objeto com response.status).
 *   - within() para restringir a busca a uma região (main, dialog).
 *   - Consultas por papel: heading (com level), img, button, dialog, link, main.
 * ============================================================================
 */
