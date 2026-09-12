// O quê: importa matchers, utilitários de renderização, roteador de memória e componentes testados.
// Como: Testing Library interage pela árvore acessível e MemoryRouter simula URLs sem navegador real.
// Para quê: validar navegação, carregamento do catálogo e abertura do fluxo de adoção.
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import Hero from './components/Hero/Hero';
import { buscarTodoAnimais } from './components/PetSectionContainer/PetSectionContainer';

// O quê: substitui a busca de animais por um mock preservando as demais exportações reais.
// Como: jest.mock intercepta o módulo e requireActual mantém os componentes necessários aos testes.
// Para quê: controlar dados remotos e manter os testes determinísticos.
jest.mock('./components/PetSectionContainer/PetSectionContainer', () => {
  const actual = jest.requireActual('./components/PetSectionContainer/PetSectionContainer');

  return {
    __esModule: true,
    ...actual,
    buscarTodoAnimais: jest.fn(),
  };
});

// O quê: define o animal usado nos cenários de catálogo.
// Como: representa o formato esperado pela camada de normalização da API.
// Para quê: permitir verificar nome, ficha e formulário com dados conhecidos.
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

// O quê: instala uma implementação mínima do IntersectionObserver.
// Como: os métodos são stubs suficientes para componentes que apenas registram observadores.
// Para quê: evitar dependência de APIs de navegador ausentes no ambiente Jest.
beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// O quê: configura a resposta padrão da busca antes de cada teste.
// Como: mockResolvedValue entrega uma Promise resolvida com o animal de teste.
// Para quê: garantir que cada cenário comece com dados previsíveis.
beforeEach(() => {
  buscarTodoAnimais.mockResolvedValue([mockAnimal]);
});

// O quê: limpa chamadas e estados dos mocks depois de cada teste.
// Como: clearAllMocks remove histórico sem substituir as implementações configuradas.
// Para quê: impedir que um caso influencie as asserções do seguinte.
afterEach(() => {
  jest.clearAllMocks();
});

// O quê: verifica a landing page e o link para o catálogo.
// Como: renderiza com rota raiz e consulta papéis acessíveis e conteúdo assíncrono.
// Para quê: proteger a entrada principal da aplicação e sua chamada para adoção.
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

// O quê: verifica a transição do catálogo para o formulário de adoção.
// Como: simula cliques nos botões acessíveis após aguardar o card carregado.
// Para quê: garantir que a jornada principal do usuário permaneça conectada.
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

// O quê: verifica a rotação automática da história do hero.
// Como: substitui timers reais por fake timers e avança o relógio dentro de act.
// Para quê: validar conteúdo temporal sem depender da passagem real do tempo.
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
