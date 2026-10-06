import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdoptionsPage from './AdoptionsPage';
import {
  getAdoptionRequest,
  listAdoptionRequests,
  rejectAdoptionRequest,
  scheduleAdoptionRequest,
} from './adoptionService';

jest.mock('./adoptionService', () => ({
  approveAdoptionRequest: jest.fn(),
  getAdoptionRequest: jest.fn(),
  listAdoptionRequests: jest.fn(),
  rejectAdoptionRequest: jest.fn(),
  revealAdoptionRequest: jest.fn(),
  scheduleAdoptionRequest: jest.fn(),
}));

const manager = { permissions: ['adoptions:read', 'adoptions:update', 'adoptions:approve', 'adopters:reveal'] };

const request = {
  id: 'p1',
  status: 'visita_agendada',
  prioridade: 'alto',
  termo_assinado: false,
  data_pedido: '2026-10-04T12:00:00.000Z',
  animal: { id: 'a1', nome: 'Nino', especie: 'cachorro' },
  adotante: { id: 'd1', nome: 'Ana Souza', cidade: 'Campinas', estado: 'SP', email: 'an***@example.org' },
  responsavel: { id: 'u1', nome: 'Carla' },
};

test('lists adoption requests from the API with translated status and filters in the URL', async () => {
  listAdoptionRequests.mockResolvedValue({ items: [request], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } });
  render(<MemoryRouter><AdoptionsPage /></MemoryRouter>);

  expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
  expect(screen.getByText('Visita agendada', { selector: '.admin-badge' })).toBeInTheDocument();
  expect(screen.getByText('Alta', { selector: '.admin-badge' })).toBeInTheDocument();
  expect(screen.getByText('Campinas / SP')).toBeInTheDocument();

  fireEvent.change(screen.getByRole('combobox', { name: /status/i }), { target: { value: 'novo' } });
  await waitFor(() => expect(listAdoptionRequests).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'novo', page: '1' })));
});

const detail = {
  ...request,
  status: 'novo',
  animal: { ...request.animal, status: 'disponivel', foto_url: null },
  adotante: { ...request.adotante, telefone: '*******7777' },
  observacoes: 'Solicitação enviada pelo site.\n\nSobre o lar e a rotina:\nCasa com quintal.',
};

async function openDetail() {
  listAdoptionRequests.mockResolvedValue({ items: [request], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } });
  getAdoptionRequest.mockResolvedValue(detail);
  render(<MemoryRouter><AdoptionsPage user={manager} /></MemoryRouter>);

  fireEvent.click(await screen.findByRole('button', { name: /ver detalhes do pedido de ana souza/i }));
  expect(await screen.findByRole('heading', { name: 'Ana Souza quer adotar Nino' })).toBeInTheDocument();
}

test('shows the full request with the form answers and history', async () => {
  await openDetail();

  expect(getAdoptionRequest).toHaveBeenCalledWith('p1');
  expect(screen.getByText(/Casa com quintal/)).toBeInTheDocument();
  expect(screen.getByText('*******7777')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /mostrar contatos completos/i })).toBeInTheDocument();
});

test('declining a request requires a justification and refreshes the list', async () => {
  await openDetail();
  rejectAdoptionRequest.mockResolvedValue({ ...detail, status: 'reprovado' });

  fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
  fireEvent.change(screen.getByRole('textbox', { name: /justificativa/i }), { target: { value: 'Ambiente sem segurança para o animal.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar recusa' }));

  expect(await screen.findByText('Pedido recusado.')).toBeInTheDocument();
  expect(rejectAdoptionRequest).toHaveBeenCalledWith('p1', 'Ambiente sem segurança para o animal.');
  expect(screen.getByText(/já foi decidido/)).toBeInTheDocument();
  await waitFor(() => expect(listAdoptionRequests).toHaveBeenCalledTimes(2));
});

test('scheduling a visit sends the email option and reports when the email could not be sent', async () => {
  await openDetail();
  scheduleAdoptionRequest.mockResolvedValue({
    pedido: { ...detail, status: 'visita_agendada' },
    email: { enviado: false, motivo: 'O envio de e-mails não está configurado no servidor (SMTP).' },
  });

  fireEvent.click(screen.getByRole('button', { name: /agendar visita ou entrevista/i }));
  fireEvent.change(screen.getByLabelText(/data e horário/i), { target: { value: '2099-10-10T14:00' } });
  fireEvent.change(screen.getByRole('textbox', { name: /endereço da visita/i }), { target: { value: 'Rua das Flores, 10' } });
  fireEvent.click(screen.getByRole('button', { name: 'Agendar e enviar e-mail' }));

  expect(await screen.findByText(/Visita agendada, mas o e-mail não foi enviado/)).toBeInTheDocument();
  expect(scheduleAdoptionRequest).toHaveBeenCalledWith('p1', {
    tipo: 'visita',
    data_hora: '2099-10-10T14:00',
    local: 'Rua das Flores, 10',
    mensagem: '',
    enviar_email: true,
  });
});

test('an interview can be scheduled without sending an email', async () => {
  await openDetail();
  scheduleAdoptionRequest.mockResolvedValue({ pedido: { ...detail, status: 'em_analise' }, email: null });

  fireEvent.click(screen.getByRole('button', { name: /agendar visita ou entrevista/i }));
  fireEvent.click(screen.getByRole('radio', { name: 'Entrevista' }));
  fireEvent.change(screen.getByLabelText(/data e horário/i), { target: { value: '2099-10-11T09:30' } });
  fireEvent.click(screen.getByRole('checkbox', { name: /enviar e-mail a ana/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Agendar' }));

  expect(await screen.findByText('Entrevista agendada.')).toBeInTheDocument();
  expect(scheduleAdoptionRequest).toHaveBeenCalledWith('p1', expect.objectContaining({ tipo: 'entrevista', enviar_email: false }));
});
