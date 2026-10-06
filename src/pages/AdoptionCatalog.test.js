import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdoptionCatalog from './AdoptionCatalog';
import { buscarTodoAnimais } from '../services/animaisService';

jest.mock('../services/animaisService', () => ({
  buscarTodoAnimais: jest.fn(),
}));

const nino = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  nome: 'Nino',
  especie: 'cachorro',
  raca: 'Vira-lata',
  sexo: 'macho',
  idade_anos: '2.0',
  porte: 'medio',
  status: 'urgente',
  descricao: 'Nino adora passeios no fim da tarde.',
  foto_url: 'https://example.com/nino.jpg',
  data_entrada: '2026-08-23',
  castrado: true,
  vacinado: true,
};

const mel = {
  id: '6f1c2a9e-1111-4222-8333-444455556666',
  nome: 'Mel',
  especie: 'gato',
  raca: 'SRD',
  sexo: 'femea',
  idade_anos: '1.0',
  porte: 'pequeno',
  status: 'disponivel',
  descricao: 'Mel é sociável e adora colo.',
  foto_url: null,
  data_entrada: '2026-07-28',
  castrado: true,
  vacinado: false,
};

function renderCatalog(url = '/adotar') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AdoptionCatalog />
    </MemoryRouter>
  );
}

function headerCount() {
  return screen.getByText(/esperando por um lar/i);
}

beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  buscarTodoAnimais.mockResolvedValue([nino, mel]);
});

afterEach(() => {
  jest.clearAllMocks();
  document.body.style.overflow = '';
});

test('shows an error with retry instead of an empty catalog when the API fails', async () => {
  buscarTodoAnimais.mockRejectedValueOnce(new Error('Network Error'));
  renderCatalog();

  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Não conseguimos carregar os animais');
  expect(screen.queryByText(/nenhum animal encontrado/i)).not.toBeInTheDocument();

  fireEvent.click(within(alert).getByRole('button', { name: /tentar novamente/i }));

  expect(await screen.findByRole('heading', { name: 'Nino' })).toBeInTheDocument();
  expect(buscarTodoAnimais).toHaveBeenCalledTimes(2);
});

test('opens the pet detail with real data from a shared link', async () => {
  renderCatalog(`/adotar?pet=${nino.id}`);

  const dialog = await screen.findByRole('dialog', { name: 'Nino' });
  expect(dialog).toHaveTextContent('Nino adora passeios no fim da tarde.');
  expect(dialog).toHaveTextContent('23 de agosto de 2026');
  expect(within(dialog).getByRole('button', { name: /quero adotar o nino/i })).toBeInTheDocument();
  expect(dialog).not.toHaveTextContent('12 mar 2024');
});

test('warns when a shared link points to an animal that is no longer listed', async () => {
  renderCatalog('/adotar?pet=00000000-0000-4000-8000-000000000000');

  expect(await screen.findByText(/não está mais disponível para adoção/i)).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('size filter uses the same labels as the drawer and each chip removes one filter', async () => {
  renderCatalog();
  await screen.findByRole('heading', { name: 'Nino' });
  expect(headerCount()).toHaveTextContent('2 animais esperando');

  fireEvent.click(screen.getByRole('button', { name: /^filtros/i }));
  const drawer = screen.getByRole('dialog', { name: /encontre o perfil ideal/i });
  fireEvent.click(within(drawer).getByRole('button', { name: 'Médio' }));
  fireEvent.click(within(drawer).getByRole('button', { name: 'Gato' }));
  expect(within(drawer).getByRole('button', { name: 'Médio' })).toHaveAttribute('aria-pressed', 'true');
  expect(headerCount()).toHaveTextContent('0 animais esperando');

  fireEvent.click(screen.getByRole('button', { name: 'Remover filtro Gato' }));

  expect(headerCount()).toHaveTextContent('1 animal esperando');
  expect(screen.getByRole('button', { name: 'Remover filtro Porte médio' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Remover filtro Gato' })).not.toBeInTheDocument();
});

test('"Voltar para a ficha" reopens the detail of the same animal', async () => {
  renderCatalog();

  fireEvent.click(await screen.findByRole('button', { name: 'Ver ficha de Nino' }));
  const detail = await screen.findByRole('dialog', { name: 'Nino' });
  fireEvent.click(within(detail).getByRole('button', { name: /quero adotar o nino/i }));

  const form = await screen.findByRole('dialog', { name: /quero adotar nino/i });
  fireEvent.click(within(form).getByRole('button', { name: /voltar para a ficha/i }));

  await waitFor(() => expect(document.querySelector('main')).toHaveClass('has-detail'));
  expect(screen.getAllByRole('dialog', { name: 'Nino' }).length).toBeGreaterThan(0);
});

test('Escape closes the detail', async () => {
  renderCatalog();

  fireEvent.click(await screen.findByRole('button', { name: 'Ver ficha de Mel' }));
  await screen.findByRole('dialog', { name: 'Mel' });
  expect(document.querySelector('main')).toHaveClass('has-detail');

  fireEvent.keyDown(document, { key: 'Escape' });

  await waitFor(() => expect(document.querySelector('main')).not.toHaveClass('has-detail'));
});

test('sharing copies a link that opens the animal and confirms it', async () => {
  const writeText = jest.fn().mockResolvedValue();
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  renderCatalog();

  fireEvent.click(await screen.findByRole('button', { name: 'Compartilhar Mel' }));

  expect(await screen.findByText('Link da ficha de Mel copiado.')).toBeInTheDocument();
  expect(writeText).toHaveBeenCalledWith(`http://localhost/adotar?pet=${mel.id}`);
});

test('missing photos show a placeholder instead of an empty image', async () => {
  renderCatalog();
  await screen.findByRole('heading', { name: 'Mel' });

  expect(screen.getByRole('img', { name: 'Mel, gato da raça SRD' })).toHaveClass('pet-photo-placeholder');
});
