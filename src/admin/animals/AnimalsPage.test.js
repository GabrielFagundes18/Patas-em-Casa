import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AnimalsPage from './AnimalsPage';
import { createAnimal, listAnimals } from './animalService';

jest.mock('./animalService', () => ({
  listAnimals: jest.fn(),
  createAnimal: jest.fn(),
  updateAnimal: jest.fn(),
  updateAnimalStatus: jest.fn(),
  deleteAnimal: jest.fn(),
}));

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

beforeEach(() => {
  listAnimals.mockResolvedValue({
    items: [animal],
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  });
  createAnimal.mockResolvedValue({ ...animal, id: 'created-animal' });
});

afterEach(() => {
  jest.clearAllMocks();
});

test('loads animals from the service and displays mapped status and care', async () => {
  render(
    <MemoryRouter>
      <AnimalsPage user={{ permissions: ['animals:read'] }} />
    </MemoryRouter>
  );

  expect(await screen.findByText('Nino')).toBeInTheDocument();
  expect(screen.getByText('Disponível', { selector: '.admin-badge' })).toBeInTheDocument();
  expect(screen.getByText('Castrado, Vacinado')).toBeInTheDocument();
  expect(listAnimals).toHaveBeenCalledWith(expect.objectContaining({ page: '1', pageSize: '20' }));
});

test('applies filters through URL-backed search parameters', async () => {
  render(
    <MemoryRouter>
      <AnimalsPage user={{ permissions: ['animals:read'] }} />
    </MemoryRouter>
  );

  await screen.findByText('Nino');
  fireEvent.change(screen.getByRole('combobox', { name: /espécie/i }), { target: { value: 'gato' } });
  fireEvent.click(screen.getByRole('button', { name: /filtrar/i }));

  await waitFor(() => expect(listAnimals).toHaveBeenLastCalledWith(expect.objectContaining({ especie: 'gato' })));
});

test('creates an animal with the current schema fields', async () => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
    HTMLDialogElement.prototype.close = function close() { this.open = false; };
  }

  render(
    <MemoryRouter>
      <AnimalsPage user={{ permissions: ['animals:read', 'animals:create'] }} />
    </MemoryRouter>
  );

  await screen.findByText('Nino');
  fireEvent.click(screen.getByRole('button', { name: /cadastrar animal/i }));
  const dialog = screen.getByRole('dialog', { name: /cadastrar animal/i });
  fireEvent.change(within(dialog).getByLabelText(/^nome/i), { target: { value: 'Mel' } });
  fireEvent.change(within(dialog).getByLabelText(/espécie/i), { target: { value: 'gato' } });
  fireEvent.click(within(dialog).getByRole('button', { name: /cadastrar animal/i }));

  await waitFor(() => expect(createAnimal).toHaveBeenCalledWith(expect.objectContaining({
    nome: 'Mel',
    especie: 'gato',
    status: 'disponivel',
  })));
});