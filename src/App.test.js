import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import Hero from './components/home/Hero';
import { buscarTodoAnimais } from './components/home/PetSectionContainer';

jest.mock('./components/home/PetSectionContainer', () => {
  const actual = jest.requireActual('./components/home/PetSectionContainer');

  return {
    __esModule: true,
    ...actual,
    buscarTodoAnimais: jest.fn(),
  };
});

const mockAnimal = {
  id: 'nino-001',
  nome: 'Nino',
  especie: 'cachorro',
  raca: 'Vira-lata',
  sexo: 'macho',
  idade_anos: 2,
  porte: 'medio',
  status: 'disponivel',
  descricao: 'Nino e um cachorro carinhoso.',
  foto_url: 'https://example.com/nino.jpg',
  castrado: true,
  vacinado: true,
};

beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  buscarTodoAnimais.mockResolvedValue([mockAnimal]);
});

afterEach(() => {
  jest.clearAllMocks();
});

test('renders the landing page and links to the adoption catalog', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  expect(
    screen.getByRole('heading', { name: /Cada focinho tem uma/i })
  ).toBeInTheDocument();

  expect(screen.getByRole('link', { name: 'Quero adotar' })).toHaveAttribute(
    'href',
    '/adotar'
  );

  await screen.findByRole('heading', { name: /Quem está esperando por você/i });
});

test('opens the adoption form from a pet detail in the catalog', async () => {
  render(
    <MemoryRouter initialEntries={['/adotar']}>
      <App />
    </MemoryRouter>
  );

  const petButton = await screen.findByRole('button', { name: /Ver ficha/i });
  fireEvent.click(petButton);

  fireEvent.click(
    await screen.findByRole('button', { name: /Quero adotar o\(a\) Nino/i })
  );

  expect(
    screen.getByRole('heading', { name: /Quero adotar Nino/i })
  ).toBeInTheDocument();
});

test('rotates the hero story automatically', () => {
  jest.useFakeTimers();

  render(<Hero />);

  expect(screen.getByText(/Bento/i)).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(3500);
  });

  expect(screen.getByText(/Luna/i)).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(3500);
  });

  expect(screen.getByText(/Milo/i)).toBeInTheDocument();

  jest.useRealTimers();
});
