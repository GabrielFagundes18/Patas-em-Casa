/*
 * ============================================================================
 * ARQUIVO: LandingPage.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Testes automatizados da página inicial: a vitrine (urgentes primeiro), o
 *   atalho de doação (que leva a escolha para /doar), o formulário de voluntário
 *   e o cálculo dos anos de atuação.
 *
 * PRINCIPAIS ITENS:
 *   - jest.mock(...) dos módulos de API (animals, content, volunteers, donations).
 *   - animal(overrides): fábrica de animais de teste.
 *   - animals: lista de 6 animais (2 urgentes).
 *   - renderHome(path): desenha o App numa URL.
 *   - 4 testes.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - app/App.js (o app inteiro), features/home/sections/StatsStrip (anosDeAtuacao).
 *   - api/animals, api/content, api/volunteers, api/donations (substituídos por mocks).
 *   - Indiretamente testa: PetSection, Donation (seção), DonationPage, VolunteerSignup, AnimalCard.
 * ============================================================================
 */

// O quê: testes da Home: vitrine, atalho de doação e inscrição de voluntário.
// Como: serviços de API substituídos por mocks; a navegação usa o App inteiro num roteador de memória.
// Para quê: proteger as regras da Home (urgentes primeiro, escolha levada para /doar, envio da inscrição).
// Verificações extras (toBeInTheDocument, toBeChecked, toHaveValue...).
import '@testing-library/jest-dom';
// render/screen/fireEvent: desenhar, procurar e interagir.
// waitFor: espera uma condição se tornar verdadeira.
// within: limita a busca a um pedaço da tela (ex.: dentro de uma seção ou formulário).
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
// Roteador em memória para testes.
import { MemoryRouter } from 'react-router-dom';
// O app inteiro (para testar a navegação de verdade entre páginas).
import App from 'app/App';
// Função testada diretamente.
import { anosDeAtuacao } from './sections/StatsStrip/StatsStrip';
// As funções abaixo são mocks (por causa do jest.mock).
import { buscarTodoAnimais } from 'api/animals';
import { buscarEtapasAdocao, buscarHistorias, buscarNumeros } from 'api/content';
import { enviarInscricaoVoluntario } from 'api/volunteers';

// Substitui a API de animais por uma função falsa.
jest.mock('api/animals', () => ({
  buscarTodoAnimais: jest.fn(),
}));

// Substitui a API de conteúdo.
jest.mock('api/content', () => ({
  buscarNumeros: jest.fn(),
  buscarHistorias: jest.fn(),
  buscarEtapasAdocao: jest.fn(),
}));

// Substitui a API de voluntários.
jest.mock('api/volunteers', () => ({
  enviarInscricaoVoluntario: jest.fn(),
}));

// Substitui a API de doações (a página /doar a importa; assim nada vai para a rede).
jest.mock('api/donations', () => ({
  iniciarDoacao: jest.fn(),
}));

/*
 * FUNÇÃO: animal (auxiliar de teste)
 * O que faz: cria um animal de teste com valores padrão, permitindo trocar alguns campos.
 * Parâmetros: overrides (objeto) — campos que substituem os padrões.
 * Retorno: objeto no formato da API.
 */
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
    // O spread no final faz os campos de "overrides" sobrescreverem os de cima.
    ...overrides,
  };
}

// Seis animais: Nino e Duque são urgentes (estão no fim de propósito, para testar a ordenação).
const animals = [
  animal({ id: 'a1', nome: 'Caramelo' }),
  animal({ id: 'a2', nome: 'Mel', especie: 'gato', sexo: 'femea', porte: 'pequeno' }),
  animal({ id: 'a3', nome: 'Tobias' }),
  animal({ id: 'a4', nome: 'Bidu' }),
  animal({ id: 'a5', nome: 'Nino', status: 'urgente' }),
  animal({ id: 'a6', nome: 'Duque', status: 'urgente', porte: 'grande' }),
];

/*
 * FUNÇÃO: renderHome (auxiliar de teste)
 * O que faz: desenha o App inteiro começando na URL informada.
 * Parâmetros: path (string, padrão '/').
 * Retorno: o resultado do render (não usado diretamente nos testes).
 */
function renderHome(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

// Antes de todos os testes: IntersectionObserver falso (o jsdom não tem).
beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Antes de cada teste: programa as respostas das APIs falsas.
beforeEach(() => {
  buscarTodoAnimais.mockResolvedValue(animals);
  buscarNumeros.mockResolvedValue({ animais_resgatados: 11, adocoes_realizadas: 4, aguardando_lar: 6 });
  // Sem histórias e sem etapas (a seção de histórias não aparece; as etapas usam o padrão).
  buscarHistorias.mockResolvedValue([]);
  buscarEtapasAdocao.mockResolvedValue([]);
});

// Teste 1: a vitrine mostra 4 animais, urgentes primeiro, com textos e links corretos.
test('the showcase shows 4 animals with the urgent ones first and links to all of them', async () => {
  renderHome();

  // Uma <section> com aria-labelledby vira uma "region" com nome; procuramos pelo título dela.
  const section = await screen.findByRole('region', { name: 'Quem está esperando por você' });
  // Espera os cartões carregarem (o título "Nino" aparecer dentro da seção).
  await within(section).findByRole('heading', { name: 'Nino' });

  // Pega os nomes de todos os títulos <h3> (nomes dos cartões), na ordem da tela.
  const names = within(section).getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
  // Urgentes (Nino, Duque) primeiro; depois os demais na ordem original; só 4.
  expect(names).toEqual(['Nino', 'Duque', 'Caramelo', 'Mel']);
  // Dois selos "Urgente".
  expect(within(section).getAllByText('Urgente')).toHaveLength(2);
  // Botão para o catálogo com o total de animais.
  expect(within(section).getByRole('link', { name: /Ver todos os 6 animais/ })).toHaveAttribute('href', '/adotar');
  // Link do cartão da Mel com artigo feminino e endereço certo.
  expect(within(section).getByRole('link', { name: /Conhecer a Mel/ })).toHaveAttribute('href', '/animais/a2');
  // Linha de informações com concordância ("Gata").
  expect(within(section).getByText('Gata · Fêmea · 2 anos · Porte pequeno')).toBeInTheDocument();
  // Cuidado no feminino ("Castrada").
  expect(within(section).getByText('Castrada')).toBeInTheDocument();
});

// Teste 2: o atalho de doação da home abre /doar já com o tipo e o valor escolhidos.
test('the donation shortcut opens /doar with the chosen type and amount', async () => {
  renderHome();

  // Um <form> com nome acessível tem o papel "form".
  const form = screen.getByRole('form', { name: 'Doar online' });
  // Escolhe "Única" e "R$ 100" e envia.
  fireEvent.click(within(form).getByRole('radio', { name: 'Única' }));
  fireEvent.click(within(form).getByRole('radio', { name: 'R$ 100' }));
  fireEvent.click(within(form).getByRole('button', { name: 'Doar R$ 100' }));

  // Já na página /doar: o rádio de 100,00 deve estar marcado...
  expect(await screen.findByRole('radio', { name: /100,00/ })).toBeChecked();
  // ...e o tipo "única" também.
  expect(screen.getByRole('radio', { name: /única/i })).toBeChecked();
});

// Teste 3: o formulário de voluntário exige uma área, depois envia e confirma.
test('volunteer sign-up requires an area, then sends the form and confirms', async () => {
  // A API falsa responde com um protocolo.
  enviarInscricaoVoluntario.mockResolvedValue({ protocolo: 'VOL-2026-0042', status: 'recebida' });
  renderHome();

  // Encontra o formulário pelo título ("Tem um tempinho...").
  const form = screen.getByRole('form', { name: /Tem um tempinho/ });
  // fireEvent.change simula digitar: muda o valor do campo.
  fireEvent.change(within(form).getByLabelText('Nome completo'), { target: { value: 'Ana Souza' } });
  fireEvent.change(within(form).getByLabelText('E-mail'), { target: { value: 'ana@email.com' } });
  fireEvent.change(within(form).getByLabelText('Telefone com DDD'), { target: { value: '(11) 98888-7777' } });

  // Envia SEM escolher área: deve aparecer o alerta e a API não deve ser chamada.
  fireEvent.click(within(form).getByRole('button', { name: 'Quero ser voluntário' }));
  expect(within(form).getByRole('alert')).toHaveTextContent('Escolha ao menos uma área');
  expect(enviarInscricaoVoluntario).not.toHaveBeenCalled();

  // Escolhe duas áreas e envia de novo.
  fireEvent.click(within(form).getByRole('checkbox', { name: 'Passeios' }));
  fireEvent.click(within(form).getByRole('checkbox', { name: 'Fotografia' }));
  fireEvent.click(within(form).getByRole('button', { name: 'Quero ser voluntário' }));

  // Deve aparecer a confirmação com o protocolo.
  expect(await within(form).findByRole('status')).toHaveTextContent('protocolo VOL-2026-0042');
  // E a API deve ter recebido exatamente estes dados (inclusive o campo-isca vazio).
  expect(enviarInscricaoVoluntario).toHaveBeenCalledWith({
    nome: 'Ana Souza',
    email: 'ana@email.com',
    telefone: '(11) 98888-7777',
    areas: ['passeios', 'fotografia'],
    website: '',
  });
  // Depois do envio, o formulário é limpo (waitFor espera até a condição valer).
  await waitFor(() => expect(within(form).getByLabelText('Nome completo')).toHaveValue(''));
});

// Teste 4: anos de atuação calculados a partir de 2019.
test('years of activity are counted from the founding year', () => {
  // Em 2026 → 7 anos; em 2030 → 11 anos.
  expect(anosDeAtuacao(new Date(2026, 9, 6))).toBe(7);
  expect(anosDeAtuacao(new Date(2030, 0, 1))).toBe(11);
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   As APIs são trocadas por mocks com respostas programadas. Cada teste desenha
 *   o app em "/", interage como um usuário (cliques, digitação) e confere o que
 *   aparece na tela e como as APIs foram chamadas.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - "Fábricas" de dados de teste com valores padrão e overrides (spread).
 *   - within() para limitar consultas a uma região da tela.
 *   - Papéis acessíveis: region, form, radio, checkbox, heading, link, alert, status.
 *   - fireEvent.change e fireEvent.click para simular o usuário.
 *   - waitFor e findBy* para conteúdo assíncrono.
 *   - toHaveBeenCalledWith / not.toHaveBeenCalled para verificar chamadas de mocks.
 *   - Testes de integração (vários componentes juntos) x testes unitários (uma função).
 * ============================================================================
 */
