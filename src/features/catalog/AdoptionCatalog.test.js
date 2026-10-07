import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useParams } from 'react-router-dom';
import AdoptionCatalog from './AdoptionCatalog';
import { buscarTodoAnimais } from '../../api/animals';

jest.mock('../../api/animals', () => ({
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
  temperamento: ['brincalhão'],
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
  temperamento: [],
};

// Mostra o endereço atual, para conferir os filtros gravados na URL.
function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function ProfileStub() {
  const { id } = useParams();
  return <h1>Ficha {id}</h1>;
}

function renderCatalog(url = '/adotar') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/adotar" element={<><AdoptionCatalog /><LocationProbe /></>} />
        <Route path="/animais/:id" element={<ProfileStub />} />
      </Routes>
    </MemoryRouter>
  );
}

const headerCount = () => screen.getByText(/esperando por um lar/i);
const cardNames = () => screen.getAllByRole('heading', { level: 2 })
  .map((heading) => heading.textContent)
  .filter((name) => ['Nino', 'Mel'].includes(name));

beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  buscarTodoAnimais.mockResolvedValue([mel, nino]);
});

afterEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
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

test('the page has the site menu and footer, and urgent animals come first', async () => {
  renderCatalog();
  await screen.findByRole('heading', { name: 'Nino' });

  expect(screen.getByRole('navigation', { name: 'Rodapé' })).toBeInTheDocument();
  expect(cardNames()).toEqual(['Nino', 'Mel']);
  expect(screen.getByRole('combobox', { name: 'Ordenar' })).toHaveValue('urgent');
  expect(screen.getByRole('link', { name: /Conhecer o Nino/ })).toHaveAttribute('href', `/animais/${nino.id}`);
  expect(screen.getByRole('link', { name: /Conhecer a Mel/ })).toBeInTheDocument();
  expect(screen.queryByText(/550E8400/)).not.toBeInTheDocument();
});

test('old shared links (/adotar?pet=<id>) open the full profile', async () => {
  renderCatalog(`/adotar?pet=${nino.id}`);

  expect(await screen.findByRole('heading', { name: `Ficha ${nino.id}` })).toBeInTheDocument();
});

test('quick filters change the list and are saved in the address', async () => {
  renderCatalog();
  await screen.findByRole('heading', { name: 'Nino' });
  expect(headerCount()).toHaveTextContent('2 animais esperando');

  fireEvent.click(screen.getByRole('button', { name: 'Gatos' }));

  expect(screen.getByRole('button', { name: 'Gatos' })).toHaveAttribute('aria-pressed', 'true');
  expect(headerCount()).toHaveTextContent('1 animal esperando');
  expect(cardNames()).toEqual(['Mel']);
  expect(screen.getByTestId('location')).toHaveTextContent('/adotar?especie=gato');
});

test('filters and sort written in the address are applied when the page opens', async () => {
  renderCatalog('/adotar?urgente=1&ordem=nome');
  await screen.findByRole('heading', { name: 'Nino' });

  expect(cardNames()).toEqual(['Nino']);
  expect(screen.getByRole('button', { name: 'Urgentes' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('combobox', { name: 'Ordenar' })).toHaveValue('name');
});

test('drawer filters (size, sex, temperament) show as chips and each chip removes one filter', async () => {
  renderCatalog();
  await screen.findByRole('heading', { name: 'Nino' });

  fireEvent.click(screen.getByRole('button', { name: /^filtros/i }));
  const drawer = screen.getByRole('dialog', { name: /encontre o perfil ideal/i });
  expect(within(drawer).getByRole('button', { name: /Filhote/ })).toBeInTheDocument();
  fireEvent.click(within(drawer).getByRole('button', { name: 'Médio' }));
  fireEvent.click(within(drawer).getByRole('button', { name: 'Fêmea' }));
  expect(within(drawer).getByRole('button', { name: 'Médio' })).toHaveAttribute('aria-pressed', 'true');
  expect(headerCount()).toHaveTextContent('0 animais esperando');

  fireEvent.click(within(drawer).getByRole('button', { name: 'brincalhão' }));
  fireEvent.click(screen.getByRole('button', { name: 'Remover filtro Fêmea' }));

  expect(headerCount()).toHaveTextContent('1 animal esperando');
  expect(screen.getByRole('button', { name: 'Remover filtro Porte médio' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Remover filtro brincalhão' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Remover filtro Fêmea' })).not.toBeInTheDocument();
});

test('search waits for typing to stop and also finds temperament', async () => {
  renderCatalog();
  await screen.findByRole('heading', { name: 'Nino' });

  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'brincalhao' } });

  await waitFor(() => expect(cardNames()).toEqual(['Nino']));
  expect(screen.getByTestId('location')).toHaveTextContent('q=brincalhao');
});

test('favorites are saved in the browser and can be shown alone', async () => {
  renderCatalog();
  await screen.findByRole('heading', { name: 'Mel' });
  expect(screen.queryByRole('button', { name: /Meus favoritos/ })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Favoritar Mel' }));

  expect(screen.getByRole('button', { name: 'Favoritar Mel' })).toHaveAttribute('aria-pressed', 'true');
  expect(JSON.parse(window.localStorage.getItem('patas:favoritos'))).toEqual([mel.id]);

  fireEvent.click(screen.getByRole('button', { name: /Meus favoritos \(1\)/ }));
  expect(cardNames()).toEqual(['Mel']);
  expect(screen.getByTestId('location')).toHaveTextContent('favoritos=1');
});

test('sharing copies a link that opens the animal and confirms it', async () => {
  const writeText = jest.fn().mockResolvedValue();
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  renderCatalog();

  fireEvent.click(await screen.findByRole('button', { name: 'Compartilhar Mel' }));

  expect(await screen.findByText('Link da ficha de Mel copiado.')).toBeInTheDocument();
  expect(writeText).toHaveBeenCalledWith(`http://localhost/animais/${mel.id}`);
});

test('missing photos show a placeholder and the end of the list invites to help', async () => {
  renderCatalog();
  await screen.findByRole('heading', { name: 'Mel' });

  expect(screen.getByRole('img', { name: 'Mel, gato da raça SRD' })).toHaveClass('pet-photo-placeholder');
  const invite = screen.getByRole('complementary', { name: 'Não encontrou agora?' });
  expect(within(invite).getByRole('link', { name: /Quero doar/ })).toHaveAttribute('href', '/doar');
  expect(within(invite).getByRole('link', { name: 'Ser voluntário' })).toHaveAttribute('href', '/#voluntariado');
});
