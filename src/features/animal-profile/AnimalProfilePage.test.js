import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AnimalProfilePage from './AnimalProfilePage';
import { buscarAnimal } from 'api/animals';

jest.mock('api/animals', () => ({ buscarAnimal: jest.fn() }));

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

function renderAt(path, element, route) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route element={element} path={route} /></Routes>
    </MemoryRouter>
  );
}

test('the animal profile shows the gallery, temperament and health, and opens the adoption form', async () => {
  buscarAnimal.mockResolvedValue(nino);
  renderAt(`/animais/${nino.id}`, <AnimalProfilePage />, '/animais/:id');

  expect(await screen.findByRole('heading', { level: 1, name: 'Nino' })).toBeInTheDocument();
  expect(buscarAnimal).toHaveBeenCalledWith(nino.id, expect.anything());
  expect(screen.getByRole('img', { name: /foto 1 de 2/ })).toHaveAttribute('src', nino.fotos[0].url);
  fireEvent.click(screen.getByRole('button', { name: 'Ver foto 2' }));
  expect(screen.getByRole('img', { name: /foto 2 de 2/ })).toHaveAttribute('src', nino.fotos[1].url);
  expect(screen.getByText('convive com gatos')).toBeInTheDocument();
  expect(screen.getByText('Realizada')).toBeInTheDocument();
  expect(screen.getByText('Pendente')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Quero adotar o Nino' }));
  const form = await screen.findByRole('dialog', { name: 'Quero adotar Nino' });
  expect(within(form).getByText('Passo 1 de 3')).toBeInTheDocument();
  expect(within(form).getByLabelText('Nome completo')).toBeInTheDocument();
});

test('an adopted animal shows the API message and a link to the catalog', async () => {
  buscarAnimal.mockRejectedValue({ response: { status: 410, data: { error: { message: 'Nino já encontrou um lar.' } } } });
  renderAt(`/animais/${nino.id}`, <AnimalProfilePage />, '/animais/:id');

  expect(await screen.findByRole('heading', { name: 'Nino já encontrou um lar.' })).toBeInTheDocument();
  expect(within(screen.getByRole('main')).getByRole('link', { name: 'Ver animais para adoção' })).toHaveAttribute('href', '/adotar');
});

test('a missing animal shows "not found"', async () => {
  buscarAnimal.mockRejectedValue({ response: { status: 404 } });
  renderAt('/animais/x', <AnimalProfilePage />, '/animais/:id');
  expect(await screen.findByRole('heading', { name: 'Não encontramos este animal' })).toBeInTheDocument();
});
