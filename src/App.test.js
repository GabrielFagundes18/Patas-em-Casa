// O quê: importa matchers, utilitários de renderização, roteador de memória e componentes testados.
// Como: Testing Library interage pela árvore acessível e MemoryRouter simula URLs sem navegador real.
// Para quê: validar navegação, carregamento do catálogo e abertura do fluxo de adoção.
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import Hero from './features/home/sections/Hero/Hero';
import { buscarAnimal, buscarTodoAnimais } from './api/animals';
import { buscarEtapasAdocao, buscarHistorias, buscarNumeros } from './api/content';
import { fetchAdminMe } from './admin/security/authService';

// O quê: substitui a busca de animais por um mock preservando as demais exportações reais.
// Como: jest.mock intercepta o módulo e requireActual mantém os componentes necessários aos testes.
// Para quê: controlar dados remotos e manter os testes determinísticos.
jest.mock('./api/animals', () => ({
  buscarTodoAnimais: jest.fn(),
  buscarAnimal: jest.fn(),
}));

jest.mock('./api/content', () => ({
  buscarNumeros: jest.fn(),
  buscarHistorias: jest.fn(),
  buscarEtapasAdocao: jest.fn(),
}));

jest.mock('./admin/security/authService', () => ({
  fetchAdminMe: jest.fn(),
  loginAdmin: jest.fn(),
}));

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
  buscarAnimal.mockResolvedValue({ ...mockAnimal, temperamento: [], fotos: [] });
  buscarNumeros.mockResolvedValue({ animais_resgatados: 11, adocoes_realizadas: 4, aguardando_lar: 6 });
  buscarHistorias.mockResolvedValue([
    { id: 'h1', autor_nome: 'Fernanda A.', texto: 'Pipoca trouxe paz para a casa.', foto_url: null, animal: { id: 'a1', nome: 'Pipoca', foto_url: null } },
  ]);
  buscarEtapasAdocao.mockResolvedValue([
    { ordem: 1, titulo: 'Encontre', descricao: 'Navegue pelos pets.' },
    { ordem: 2, titulo: 'Leve para casa', descricao: 'Comece a nova vida.' },
  ]);
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

  // Cabeçalho e topo levam ao catálogo.
  const adoptLinks = screen.getAllByRole('link', { name: 'Quero adotar' });
  expect(adoptLinks.length).toBeGreaterThanOrEqual(2);
  adoptLinks.forEach((link) => expect(link).toHaveAttribute('href', '/adotar'));
  expect(screen.getByRole('link', { name: 'Quero doar' })).toHaveAttribute('href', '/doar');

  await screen.findByRole('heading', { name: /Quem está esperando por você/i });
});

// O quê: verifica a jornada catálogo → ficha completa → formulário de adoção.
// Como: o cartão do catálogo é um link para /animais/:id; a ficha abre o formulário.
// Para quê: garantir que a jornada principal do usuário permaneça conectada.
test('goes from the catalog to the full profile and opens the adoption form', async () => {
  render(
    <MemoryRouter initialEntries={['/adotar']}>
      <App />
    </MemoryRouter>
  );

  fireEvent.click(await screen.findByRole('link', { name: /Conhecer o Nino/i }));

  expect(await screen.findByRole('heading', { level: 1, name: 'Nino' })).toBeInTheDocument();
  expect(buscarAnimal).toHaveBeenCalledWith('nino-001', expect.anything());
  fireEvent.click(screen.getByRole('button', { name: /Quero adotar o Nino/i }));

  expect(await screen.findByRole('heading', { name: /Quero adotar Nino/i })).toBeInTheDocument();
});

test('renders the admin login page at the admin route', async () => {
  render(
    <MemoryRouter initialEntries={['/admin/login']}>
      <App />
    </MemoryRouter>
  );

  expect(
    await screen.findByRole('heading', { name: /acesso do painel/i })
  ).toBeInTheDocument();
  expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
});

test('admin navigation and direct routes respect permissions from the backend', async () => {
  fetchAdminMe.mockResolvedValueOnce({
    id: 'user-volunteer',
    nome: 'Luiza',
    role: 'voluntariado',
    permissions: ['volunteers:read'],
  });
  localStorage.setItem('patas_admin_token', 'valid-token');

  render(
    <MemoryRouter initialEntries={['/admin/doacoes']}>
      <App />
    </MemoryRouter>
  );

  expect(await screen.findByRole('heading', { name: /acesso sem permissão/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Voluntários' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Doações' })).not.toBeInTheDocument();
  localStorage.clear();
});

test('clears an expired admin session and returns to login', async () => {
  fetchAdminMe.mockRejectedValueOnce({ response: { status: 401 } });
  localStorage.setItem('patas_admin_token', 'expired-token');
  localStorage.setItem('patas_admin_user', '{"nome":"Admin"}');

  render(
    <MemoryRouter initialEntries={['/admin']}>
      <App />
    </MemoryRouter>
  );

  expect(
    await screen.findByRole('heading', { name: /acesso do painel/i })
  ).toBeInTheDocument();
  expect(localStorage.getItem('patas_admin_token')).toBeNull();
  expect(localStorage.getItem('patas_admin_user')).toBeNull();
});

// O quê: verifica o destaque do topo.
// Como: renderiza o Hero com um animal comum e um urgente.
// Para quê: o caso urgente aparece primeiro, com o link para o perfil dele e o artigo certo.
test('the hero highlights the first urgent animal', () => {
  const pets = [
    { id: 'mel', name: 'Mel', sex: 'Fêmea', urgent: false, image: '' },
    { id: 'duque', name: 'Duque', sex: 'Macho', urgent: true, image: '' },
  ];
  render(
    <MemoryRouter>
      <Hero pets={pets} />
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { name: 'Cada focinho tem uma história.' })).toBeInTheDocument();
  expect(screen.getByText('2 aguardando um lar')).toBeInTheDocument();
  const highlight = screen.getByRole('link', { name: /Duque precisa de um lar/ });
  expect(highlight).toHaveAttribute('href', '/animais/duque');
  expect(highlight).toHaveTextContent('Ver perfil do Duque');
});

test('home shows stories and adoption steps from the backend', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  expect(await screen.findByText(/Pipoca trouxe paz para a casa/)).toBeInTheDocument();
  expect(screen.getByText('Fernanda A.')).toBeInTheDocument();
  expect(screen.getByText(/adotou Pipoca/)).toBeInTheDocument();
  expect(await screen.findByText('Comece a nova vida.')).toBeInTheDocument();
});

test('unknown addresses show the 404 page instead of the home', () => {
  render(
    <MemoryRouter initialEntries={['/pagina-que-nao-existe']}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
});

test('admin routes without a session go to login, keeping the requested page', async () => {
  localStorage.removeItem('patas_admin_token');
  render(
    <MemoryRouter initialEntries={['/admin/historias']}>
      <App />
    </MemoryRouter>
  );

  expect(await screen.findByRole('heading', { name: /acesso do painel/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Esqueci minha senha' })).toHaveAttribute('href', '/admin/esqueci-senha');
  expect(fetchAdminMe).not.toHaveBeenCalled();
});
