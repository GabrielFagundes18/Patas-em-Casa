// O quê: testes da Home: vitrine, atalho de doação e inscrição de voluntário.
// Como: serviços de API substituídos por mocks; a navegação usa o App inteiro num roteador de memória.
// Para quê: proteger as regras da Home (urgentes primeiro, escolha levada para /doar, envio da inscrição).
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from 'app/App';
import { anosDeAtuacao } from './sections/StatsStrip/StatsStrip';
import { buscarTodoAnimais } from 'api/animals';
import { buscarEtapasAdocao, buscarHistorias, buscarNumeros } from 'api/content';
import { enviarInscricaoVoluntario } from 'api/volunteers';

jest.mock('api/animals', () => ({
  buscarTodoAnimais: jest.fn(),
}));

jest.mock('api/content', () => ({
  buscarNumeros: jest.fn(),
  buscarHistorias: jest.fn(),
  buscarEtapasAdocao: jest.fn(),
}));

jest.mock('api/volunteers', () => ({
  enviarInscricaoVoluntario: jest.fn(),
}));

jest.mock('api/donations', () => ({
  iniciarDoacao: jest.fn(),
}));

function animal(overrides) {
  return {
    especie: 'cachorro',
    raca: 'SRD',
    sexo: 'macho',
    idade_anos: 2,
    porte: 'medio',
    status: 'disponivel',
    descricao: '',
    foto_url: null,
    castrado: true,
    vacinado: true,
    ...overrides,
  };
}

const animals = [
  animal({ id: 'a1', nome: 'Caramelo' }),
  animal({ id: 'a2', nome: 'Mel', especie: 'gato', sexo: 'femea', porte: 'pequeno' }),
  animal({ id: 'a3', nome: 'Tobias' }),
  animal({ id: 'a4', nome: 'Bidu' }),
  animal({ id: 'a5', nome: 'Nino', status: 'urgente' }),
  animal({ id: 'a6', nome: 'Duque', status: 'urgente', porte: 'grande' }),
];

function renderHome(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  buscarTodoAnimais.mockResolvedValue(animals);
  buscarNumeros.mockResolvedValue({ animais_resgatados: 11, adocoes_realizadas: 4, aguardando_lar: 6 });
  buscarHistorias.mockResolvedValue([]);
  buscarEtapasAdocao.mockResolvedValue([]);
});

test('the showcase shows 4 animals with the urgent ones first and links to all of them', async () => {
  renderHome();

  const section = await screen.findByRole('region', { name: 'Quem está esperando por você' });
  await within(section).findByRole('heading', { name: 'Nino' });

  const names = within(section).getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
  expect(names).toEqual(['Nino', 'Duque', 'Caramelo', 'Mel']);
  expect(within(section).getAllByText('Urgente')).toHaveLength(2);
  expect(within(section).getByRole('link', { name: /Ver todos os 6 animais/ })).toHaveAttribute('href', '/adotar');
  expect(within(section).getByRole('link', { name: /Conhecer a Mel/ })).toHaveAttribute('href', '/animais/a2');
  expect(within(section).getByText('Gata · Fêmea · 2 anos · Porte pequeno')).toBeInTheDocument();
  expect(within(section).getByText('Castrada')).toBeInTheDocument();
});

test('the donation shortcut opens /doar with the chosen type and amount', async () => {
  renderHome();

  const form = screen.getByRole('form', { name: 'Doar online' });
  fireEvent.click(within(form).getByRole('radio', { name: 'Única' }));
  fireEvent.click(within(form).getByRole('radio', { name: 'R$ 100' }));
  fireEvent.click(within(form).getByRole('button', { name: 'Doar R$ 100' }));

  expect(await screen.findByRole('radio', { name: /100,00/ })).toBeChecked();
  expect(screen.getByRole('radio', { name: /única/i })).toBeChecked();
});

test('volunteer sign-up requires an area, then sends the form and confirms', async () => {
  enviarInscricaoVoluntario.mockResolvedValue({ protocolo: 'VOL-2026-0042', status: 'recebida' });
  renderHome();

  const form = screen.getByRole('form', { name: /Tem um tempinho/ });
  fireEvent.change(within(form).getByLabelText('Nome completo'), { target: { value: 'Ana Souza' } });
  fireEvent.change(within(form).getByLabelText('E-mail'), { target: { value: 'ana@email.com' } });
  fireEvent.change(within(form).getByLabelText('Telefone com DDD'), { target: { value: '(11) 98888-7777' } });

  fireEvent.click(within(form).getByRole('button', { name: 'Quero ser voluntário' }));
  expect(within(form).getByRole('alert')).toHaveTextContent('Escolha ao menos uma área');
  expect(enviarInscricaoVoluntario).not.toHaveBeenCalled();

  fireEvent.click(within(form).getByRole('checkbox', { name: 'Passeios' }));
  fireEvent.click(within(form).getByRole('checkbox', { name: 'Fotografia' }));
  fireEvent.click(within(form).getByRole('button', { name: 'Quero ser voluntário' }));

  expect(await within(form).findByRole('status')).toHaveTextContent('protocolo VOL-2026-0042');
  expect(enviarInscricaoVoluntario).toHaveBeenCalledWith({
    nome: 'Ana Souza',
    email: 'ana@email.com',
    telefone: '(11) 98888-7777',
    areas: ['passeios', 'fotografia'],
    website: '',
  });
  await waitFor(() => expect(within(form).getByLabelText('Nome completo')).toHaveValue(''));
});

test('years of activity are counted from the founding year', () => {
  expect(anosDeAtuacao(new Date(2026, 9, 6))).toBe(7);
  expect(anosDeAtuacao(new Date(2030, 0, 1))).toBe(11);
});
