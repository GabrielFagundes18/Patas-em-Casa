import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CancelSubscriptionPage from './CancelSubscriptionPage';
import DonationPage, { redirectTo } from './DonationPage';
import DonationReturnPage from './DonationReturnPage';
import { cancelarDoacaoMensal, consultarDoacao, iniciarDoacao, pedirLinkCancelamento } from 'api/donations';

jest.mock('api/donations', () => ({
  iniciarDoacao: jest.fn(),
  consultarDoacao: jest.fn(),
  pedirLinkCancelamento: jest.fn(),
  cancelarDoacaoMensal: jest.fn(),
}));

function renderAt(path, element, route) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route element={element} path={route} /></Routes>
    </MemoryRouter>
  );
}

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
