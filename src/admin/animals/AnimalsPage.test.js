/*
 * ============================================================================
 * ARQUIVO: AnimalsPage.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Testes automatizados da tela de animais do painel: carregar a lista,
 *   aplicar filtros (gravados na URL) e cadastrar um animal pelo formulário.
 *
 * PRINCIPAIS ITENS:
 *   - animal: animal de exemplo.
 *   - beforeEach/afterEach: preparam e limpam os mocks.
 *   - 3 testes.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./AnimalsPage.jsx  → tela testada.
 *   - ./animalService    → substituído por mocks.
 *   - Indiretamente: AnimalFormDialog e AdminDialog.
 * ============================================================================
 */

// Verificações extras.
import '@testing-library/jest-dom';
// Ferramentas da Testing Library.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
// A tela usa useSearchParams, então precisa de um roteador.
import { MemoryRouter } from 'react-router-dom';
// Tela testada.
import AnimalsPage from './AnimalsPage';
// Funções de API usadas nas verificações (viram mocks).
import { createAnimal, listAnimals } from './animalService';

// Substitui todas as funções do service usadas pela tela.
jest.mock('./animalService', () => ({
  listAnimals: jest.fn(),
  createAnimal: jest.fn(),
  updateAnimal: jest.fn(),
  updateAnimalStatus: jest.fn(),
  deleteAnimal: jest.fn(),
}));

// Animal de exemplo no formato da API.
const animal = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  nome: 'Nino',
  especie: 'cachorro',
  raca: 'Vira-lata',
  sexo: 'macho',
  idade_anos: 2,
  porte: 'medio',
  status: 'disponivel',
  castrado: true,
  vacinado: true,
};

// Antes de cada teste: a lista tem só o Nino; o cadastro devolve um animal com id novo.
beforeEach(() => {
  listAnimals.mockResolvedValue({
    items: [animal],
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  });
  createAnimal.mockResolvedValue({ ...animal, id: 'created-animal' });
});

// Depois de cada teste: limpa o histórico dos mocks.
afterEach(() => {
  jest.clearAllMocks();
});

// Teste 1: carrega a lista e mostra status e cuidados traduzidos.
test('loads animals from the service and displays mapped status and care', async () => {
  render(
    <MemoryRouter>
      <AnimalsPage user={{ permissions: ['animals:read'] }} />
    </MemoryRouter>
  );

  expect(await screen.findByText('Nino')).toBeInTheDocument();
  // O status "disponivel" vira o selo "Disponível".
  expect(screen.getByText('Disponível', { selector: '.admin-badge' })).toBeInTheDocument();
  // Cuidados juntos por vírgula.
  expect(screen.getByText('Castrado, Vacinado')).toBeInTheDocument();
  // A primeira busca usou página 1 e 20 por página.
  expect(listAnimals).toHaveBeenCalledWith(expect.objectContaining({ page: '1', pageSize: '20' }));
});

// Teste 2: filtros vão para a URL e disparam nova busca.
test('applies filters through URL-backed search parameters', async () => {
  render(
    <MemoryRouter>
      <AnimalsPage user={{ permissions: ['animals:read'] }} />
    </MemoryRouter>
  );

  await screen.findByText('Nino');
  // O <select> de espécie (papel "combobox") muda para "gato".
  fireEvent.change(screen.getByRole('combobox', { name: /espécie/i }), { target: { value: 'gato' } });
  // Clica em "Filtrar".
  fireEvent.click(screen.getByRole('button', { name: /filtrar/i }));

  // A última busca deve ter o filtro de espécie.
  await waitFor(() => expect(listAnimals).toHaveBeenLastCalledWith(expect.objectContaining({ especie: 'gato' })));
});

// Teste 3: cadastro de um animal com os campos do formulário.
test('creates an animal with the current schema fields', async () => {
  // Garante showModal/close no <dialog> (o setupTests.js também faz isso).
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
    HTMLDialogElement.prototype.close = function close() { this.open = false; };
  }

  // Usuário com permissão de cadastrar (o botão só aparece assim).
  render(
    <MemoryRouter>
      <AnimalsPage user={{ permissions: ['animals:read', 'animals:create'] }} />
    </MemoryRouter>
  );

  await screen.findByText('Nino');
  // Abre o formulário.
  fireEvent.click(screen.getByRole('button', { name: /cadastrar animal/i }));
  // A janela é um "dialog" nomeado pelo título.
  const dialog = screen.getByRole('dialog', { name: /cadastrar animal/i });
  // Preenche nome (regex ^nome: rótulo que COMEÇA com "nome") e espécie.
  fireEvent.change(within(dialog).getByLabelText(/^nome/i), { target: { value: 'Mel' } });
  fireEvent.change(within(dialog).getByLabelText(/espécie/i), { target: { value: 'gato' } });
  // Envia (botão dentro da janela).
  fireEvent.click(within(dialog).getByRole('button', { name: /cadastrar animal/i }));

  // O service recebeu os dados (status padrão "disponivel").
  await waitFor(() => expect(createAnimal).toHaveBeenCalledWith(expect.objectContaining({
    nome: 'Mel',
    especie: 'gato',
    status: 'disponivel',
  })));
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   O service é falso; a tela é desenhada com permissões diferentes conforme o
 *   teste. Os testes conferem a tabela, a chamada com filtros e o envio do
 *   formulário de cadastro.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Testar telas que dependem de permissões (props do usuário).
 *   - toHaveBeenLastCalledWith e expect.objectContaining.
 *   - within(dialog) para interagir só dentro da janela.
 *   - Polyfill pontual dentro de um teste.
 * ============================================================================
 */
