import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { AdoptionFormModal } from './AdoptionFormModal';
import { enviarPedidoAdocao } from '../../services/adocaoService';

jest.mock('../../services/adocaoService', () => ({
  enviarPedidoAdocao: jest.fn(),
}));

const pet = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Nino',
  meta: 'Cachorro • Vira-lata • 2 anos • Porte médio',
};

function fillForm() {
  fireEvent.change(screen.getByLabelText(/nome completo/i), { target: { value: 'Ana Souza' } });
  fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'ana@example.org' } });
  fireEvent.change(screen.getByLabelText(/telefone/i), { target: { value: '(11) 98888-7777' } });
  fireEvent.change(screen.getByLabelText(/cidade/i), { target: { value: 'Campinas' } });
  fireEvent.change(screen.getByLabelText(/lar e rotina/i), { target: { value: 'Casa com quintal e rotina tranquila.' } });
  fireEvent.click(screen.getByLabelText(/ambiente seguro/i));
  fireEvent.click(screen.getByLabelText(/pós-adoção/i));
}

afterEach(() => {
  jest.clearAllMocks();
});

test('sends the adoption request to the API and shows the protocol', async () => {
  enviarPedidoAdocao.mockResolvedValueOnce({ protocolo: 'PAC-A1B2C3D4', status: 'novo' });
  render(<AdoptionFormModal pet={pet} onClose={() => {}} />);

  fillForm();
  fireEvent.click(screen.getByRole('button', { name: /enviar formulário/i }));

  expect(await screen.findByText('PAC-A1B2C3D4')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /solicitação enviada/i })).toBeInTheDocument();
  expect(enviarPedidoAdocao).toHaveBeenCalledWith({
    animal_id: pet.id,
    nome: 'Ana Souza',
    email: 'ana@example.org',
    telefone: '(11) 98888-7777',
    cidade: 'Campinas',
    rotina: 'Casa com quintal e rotina tranquila.',
    ambiente_seguro: true,
    ciente_pos_adocao: true,
  });
});

test('keeps the form open and shows the API error when the request is rejected', async () => {
  enviarPedidoAdocao.mockRejectedValueOnce({
    response: {
      status: 422,
      data: {
        error: {
          code: 'VALIDACAO_INVALIDA',
          message: 'Verifique os campos informados.',
          details: [{ field: 'telefone', message: 'Informe um telefone com DDD.' }],
        },
      },
    },
  });
  render(<AdoptionFormModal pet={pet} onClose={() => {}} />);

  fillForm();
  fireEvent.click(screen.getByRole('button', { name: /enviar formulário/i }));

  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Verifique os campos informados.');
  expect(alert).toHaveTextContent('Informe um telefone com DDD.');
  expect(screen.getByRole('button', { name: /enviar formulário/i })).toBeEnabled();
  expect(screen.queryByRole('heading', { name: /solicitação enviada/i })).not.toBeInTheDocument();
});

test('explains connection failures without exposing technical details', async () => {
  enviarPedidoAdocao.mockRejectedValueOnce(new Error('Network Error'));
  render(<AdoptionFormModal pet={pet} onClose={() => {}} />);

  fillForm();
  fireEvent.click(screen.getByRole('button', { name: /enviar formulário/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível conectar ao servidor/i);
});
