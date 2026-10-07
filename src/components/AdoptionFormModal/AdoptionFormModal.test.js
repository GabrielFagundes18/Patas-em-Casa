import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdoptionFormModal, composeRotina, formatPhone } from './AdoptionFormModal';
import { enviarPedidoAdocao } from '../../api/adoptions';

jest.mock('../../api/adoptions', () => ({
  enviarPedidoAdocao: jest.fn(),
}));

const pet = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Nino',
  sex: 'Macho',
  meta: 'Cachorro • Vira-lata • 2 anos • Porte médio',
};

function renderForm() {
  return render(
    <MemoryRouter>
      <AdoptionFormModal pet={pet} onClose={() => {}} />
    </MemoryRouter>
  );
}

const next = () => fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
const send = () => fireEvent.click(screen.getByRole('button', { name: /^enviar pedido$/i }));

function fillStepOne() {
  fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Ana Souza' } });
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@example.org' } });
  fireEvent.change(screen.getByLabelText('Telefone com DDD'), { target: { value: '(11) 98888-7777' } });
  fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'Campinas' } });
  next();
}

function fillStepTwo() {
  fireEvent.click(screen.getByRole('radio', { name: 'Apartamento' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Outros adultos' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Crianças' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Gatos' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Metade do dia' }));
  fireEvent.change(screen.getByLabelText(/quer contar mais/i), { target: { value: 'Casa com tela e rotina tranquila.' } });
  next();
}

function fillStepThree() {
  fireEvent.click(screen.getByRole('checkbox', { name: /ambiente seguro/i }));
  fireEvent.click(screen.getByRole('checkbox', { name: /acompanhamento pós-adoção/i }));
}

afterEach(() => {
  jest.clearAllMocks();
});

test('goes through the three steps, reviews the data and sends the request in the API format', async () => {
  enviarPedidoAdocao.mockResolvedValueOnce({ protocolo: 'PAC-A1B2C3D4', status: 'novo' });
  renderForm();

  expect(screen.getByText('Passo 1 de 3')).toBeInTheDocument();
  fillStepOne();
  expect(screen.getByText('Passo 2 de 3')).toBeInTheDocument();
  fillStepTwo();
  expect(screen.getByText('Passo 3 de 3')).toBeInTheDocument();

  expect(screen.getByText(/Ana Souza · ana@example.org · \(11\) 98888-7777 · Campinas/)).toBeInTheDocument();
  expect(screen.getByText(/Apartamento · Outros adultos, Crianças · Metade do dia/)).toBeInTheDocument();
  fillStepThree();
  send();

  expect(await screen.findByText('PAC-A1B2C3D4')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Pedido enviado!' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ver outros animais' })).toHaveAttribute('href', '/adotar');
  expect(enviarPedidoAdocao).toHaveBeenCalledWith({
    animal_id: pet.id,
    nome: 'Ana Souza',
    email: 'ana@example.org',
    telefone: '(11) 98888-7777',
    cidade: 'Campinas',
    rotina: 'Moradia: Apartamento\nMora com: Outros adultos, Crianças\nOutros animais: Gatos\nTempo em casa: Metade do dia\n\nCasa com tela e rotina tranquila.',
    ambiente_seguro: true,
    ciente_pos_adocao: true,
    website: '',
  });
});

test('each step shows what is missing next to the field and does not move on', () => {
  renderForm();

  next();
  expect(screen.getByText('Passo 1 de 3')).toBeInTheDocument();
  expect(screen.getByLabelText('Nome completo')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByText('Informe seu nome completo.')).toBeInTheDocument();
  expect(screen.getByText('Informe um telefone com DDD.')).toBeInTheDocument();

  fillStepOne();
  next();
  expect(screen.getByText('Passo 2 de 3')).toBeInTheDocument();
  expect(screen.getByText('Escolha o tipo de moradia.')).toBeInTheDocument();
  expect(screen.getByRole('group', { name: 'Onde você mora?' })).toHaveAttribute('aria-invalid', 'true');

  fillStepTwo();
  send();
  expect(screen.getByText('Confirme que você tem um ambiente seguro para o animal.')).toBeInTheDocument();
  expect(enviarPedidoAdocao).not.toHaveBeenCalled();
});

test('"none" options exclude the others in the same question', () => {
  renderForm();
  fillStepOne();

  fireEvent.click(screen.getByRole('checkbox', { name: 'Cães' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Não tenho' }));
  expect(screen.getByRole('checkbox', { name: 'Cães' })).not.toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Não tenho' })).toBeChecked();

  fireEvent.click(screen.getByRole('checkbox', { name: 'Gatos' }));
  expect(screen.getByRole('checkbox', { name: 'Não tenho' })).not.toBeChecked();
});

test('an API error on a field takes the person back to that step with the message', async () => {
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
  renderForm();
  fillStepOne();
  fillStepTwo();
  fillStepThree();
  send();

  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Verifique os campos informados.');
  expect(screen.getByText('Passo 1 de 3')).toBeInTheDocument();
  expect(screen.getByLabelText('Telefone com DDD')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.queryByRole('heading', { name: 'Pedido enviado!' })).not.toBeInTheDocument();
});

test('explains connection failures without exposing technical details', async () => {
  enviarPedidoAdocao.mockRejectedValueOnce(new Error('Network Error'));
  renderForm();
  fillStepOne();
  fillStepTwo();
  fillStepThree();
  send();

  expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível conectar ao servidor/i);
  expect(screen.getByRole('button', { name: /^enviar pedido$/i })).toBeEnabled();
});

test('the phone is formatted when leaving the field', () => {
  renderForm();
  const phone = screen.getByLabelText('Telefone com DDD');
  fireEvent.change(phone, { target: { value: '11988887777' } });
  fireEvent.blur(phone);
  expect(phone).toHaveValue('(11) 98888-7777');

  expect(formatPhone('1140000000')).toBe('(11) 4000-0000');
  expect(formatPhone('+55 11 98888-7777')).toBe('+55 11 98888-7777');
});

test('the routine text sent to the API lists the answers in a fixed order', () => {
  const rotina = composeRotina({
    moradia: 'Casa',
    moradores: ['Só eu'],
    outrosAnimais: ['Não tenho'],
    tempoEmCasa: 'Quase o dia todo',
    rotinaLivre: '   ',
  });
  expect(rotina).toBe('Moradia: Casa\nMora com: Só eu\nOutros animais: Não tenho\nTempo em casa: Quase o dia todo');
  expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();
});
