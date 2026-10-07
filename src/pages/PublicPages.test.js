import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AnimalProfilePage from '../features/animal-profile/AnimalProfilePage';
import CancelSubscriptionPage from './CancelSubscriptionPage';
import DonationPage, { redirectTo } from './DonationPage';
import DonationReturnPage from './DonationReturnPage';
import HowAdoptionWorksPage from './HowAdoptionWorksPage';
import { buscarAnimal } from '../api/animals';
import { buscarEtapasAdocao } from '../api/content';
import { cancelarDoacaoMensal, consultarDoacao, iniciarDoacao, pedirLinkCancelamento } from '../api/donations';

jest.mock('../api/animals', () => ({ buscarAnimal: jest.fn() }));
jest.mock('../api/content', () => ({ buscarEtapasAdocao: jest.fn() }));
jest.mock('../api/donations', () => ({
  iniciarDoacao: jest.fn(),
  consultarDoacao: jest.fn(),
  pedirLinkCancelamento: jest.fn(),
  cancelarDoacaoMensal: jest.fn(),
}));

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

beforeEach(() => {
  buscarEtapasAdocao.mockResolvedValue([]);
});

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

test('the how-it-works page lists steps, requirements, documents and the call to action', async () => {
  buscarEtapasAdocao.mockResolvedValue([{ titulo: 'Escolha o animal', descricao: 'Veja o catálogo.' }]);
  renderAt('/como-funciona', <HowAdoptionWorksPage />, '/como-funciona');

  expect(await screen.findByRole('heading', { name: 'Escolha o animal' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Requisitos' })).toBeInTheDocument();
  expect(screen.getByText(/Comprovante de residência/)).toBeInTheDocument();
  expect(within(screen.getByRole('main')).getByRole('link', { name: 'Ver animais para adoção' })).toHaveAttribute('href', '/adotar');
});

test('the donation page sends amount, type and donor, then goes to Mercado Pago', async () => {
  const go = jest.spyOn(redirectTo, 'go').mockImplementation(() => {});
  iniciarDoacao.mockResolvedValue({ checkout_url: 'https://mp.example/checkout' });
  renderAt('/doar', <DonationPage />, '/doar');

  fireEvent.click(screen.getByRole('radio', { name: 'Todo mês' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Outro valor' }));
  fireEvent.change(screen.getByLabelText(/quanto você quer doar/i), { target: { value: '35' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), { target: { value: 'Ana Souza' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'E-mail' }), { target: { value: 'ana@example.org' } });
  fireEvent.click(screen.getByRole('button', { name: /doar r\$\s?35,00 por mês/i }));

  await waitFor(() => expect(go).toHaveBeenCalledWith('https://mp.example/checkout'));
  expect(iniciarDoacao).toHaveBeenCalledWith({ valor: 35, nome: 'Ana Souza', email: 'ana@example.org', tipo: 'recorrente' });
  go.mockRestore();
});

test('when online donation is unavailable the page points to the Pix key', async () => {
  iniciarDoacao.mockRejectedValue({ response: { status: 503, data: { error: { message: 'A doação online está temporariamente indisponível. Use a chave Pix da página.' } } } });
  renderAt('/doar', <DonationPage />, '/doar');

  fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), { target: { value: 'Ana Souza' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'E-mail' }), { target: { value: 'ana@example.org' } });
  fireEvent.click(screen.getByRole('button', { name: /doar r\$\s?50,00/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent('temporariamente indisponível');
  expect(screen.getByRole('heading', { name: 'Doe agora pelo Pix' })).toBeInTheDocument();
});

test('the return page confirms the donation', async () => {
  consultarDoacao.mockResolvedValue({ tipo: 'unica', status: 'confirmada', valor: 50 });
  renderAt('/doar/retorno?ref=abc', <DonationReturnPage />, '/doar/retorno');

  expect(await screen.findByRole('heading', { name: 'Muito obrigado!' })).toBeInTheDocument();
  expect(screen.getByText(/Valor: R\$\s?50,00/)).toBeInTheDocument();
  expect(consultarDoacao).toHaveBeenCalledWith('abc', expect.anything());
});

test('the cancellation page cancels with the e-mailed token, or sends a new link', async () => {
  cancelarDoacaoMensal.mockResolvedValue({ status: 'cancelada', valor: 25 });
  const { unmount } = renderAt('/doar/cancelar?token=tok-123456789012345678901', <CancelSubscriptionPage />, '/doar/cancelar');
  fireEvent.click(screen.getByRole('button', { name: 'Sim, cancelar' }));
  expect(await screen.findByRole('heading', { name: 'Doação mensal cancelada' })).toBeInTheDocument();
  expect(cancelarDoacaoMensal).toHaveBeenCalledWith('tok-123456789012345678901');
  unmount();

  pedirLinkCancelamento.mockResolvedValue({ mensagem: 'Se houver doação mensal ativa com este e-mail, enviaremos o link de cancelamento.' });
  renderAt('/doar/cancelar', <CancelSubscriptionPage />, '/doar/cancelar');
  fireEvent.change(screen.getByRole('textbox', { name: 'E-mail' }), { target: { value: 'ana@example.org' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar link de cancelamento' }));
  expect(await screen.findByRole('heading', { name: 'Confira seu e-mail' })).toBeInTheDocument();
});
