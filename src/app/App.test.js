/*
 * ============================================================================
 * ARQUIVO: App.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Testes automatizados do componente App (as rotas do site). Eles "abrem" o site
 *   em diferentes endereços, sem navegador de verdade, e conferem se a página
 *   certa aparece: página inicial, catálogo, perfil do animal, login do painel,
 *   permissões, sessão expirada e página 404.
 *
 * PRINCIPAIS ITENS:
 *   - jest.mock(...)  → troca módulos que acessam a API por versões falsas (mocks).
 *   - mockAnimal      → um animal de exemplo usado nos testes.
 *   - beforeAll / beforeEach / afterEach → preparação e limpeza dos testes.
 *   - test(...)       → cada bloco é um cenário de teste independente.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./App.js                                → o componente testado.
 *   - features/home/sections/Hero/Hero.jsx    → testado isoladamente em um cenário.
 *   - api/animals.js, api/content.js          → substituídos por mocks (sem chamar a API real).
 *   - admin/security/authService.js           → substituído por mock (login/sessão).
 *   - @testing-library/react                  → render, screen, fireEvent.
 *   - react-router-dom                        → MemoryRouter (roteador "de mentira" para testes).
 *   - setupTests.js roda antes deste arquivo automaticamente.
 *
 * COMO RODAR: no terminal, dentro de Patas-em-Casa, execute "npm test".
 * ============================================================================
 */

// O quê: importa matchers, utilitários de renderização, roteador de memória e componentes testados.
// Como: Testing Library interage pela árvore acessível e MemoryRouter simula URLs sem navegador real.
// Para quê: validar navegação, carregamento do catálogo e abertura do fluxo de adoção.
// jest-dom adiciona verificações como toBeInTheDocument() e toHaveAttribute().
import '@testing-library/jest-dom';
// render: desenha um componente num "navegador falso" (jsdom).
// screen: permite procurar elementos na tela (por papel, texto, rótulo...).
// fireEvent: simula ações do usuário, como cliques.
import { fireEvent, render, screen } from '@testing-library/react';
// MemoryRouter: roteador que guarda a URL na memória. Com initialEntries escolhemos
// em qual endereço o teste começa, sem precisar de um navegador real.
import { MemoryRouter } from 'react-router-dom';
// O componente que estamos testando.
import App from './App';
// A seção "Hero" (topo da página inicial), testada sozinha em um dos cenários.
import Hero from 'features/home/sections/Hero/Hero';
// Funções da API de animais. Por causa do jest.mock abaixo, aqui elas já são funções FALSAS.
import { buscarAnimal, buscarTodoAnimais } from 'api/animals';
// Funções da API de conteúdo (números, histórias, etapas) — também falsas por causa do mock.
import { buscarEtapasAdocao, buscarHistorias, buscarNumeros } from 'api/content';
// Função que busca o usuário logado no painel — falsa por causa do mock.
import { fetchAdminMe } from 'admin/security/authService';

// O quê: substitui a busca de animais por um mock preservando as demais exportações reais.
// Como: jest.mock intercepta o módulo e requireActual mantém os componentes necessários aos testes.
// Para quê: controlar dados remotos e manter os testes determinísticos.
// (Observação: na prática este mock substitui o módulo INTEIRO por apenas estas duas funções;
// o requireActual citado acima não é usado aqui.)
// jest.mock é "içado" (hoisted) pelo Jest para o topo do arquivo, ou seja, roda ANTES dos imports.
// jest.fn() cria uma função falsa que registra como foi chamada e cuja resposta podemos programar.
jest.mock('api/animals', () => ({
  buscarTodoAnimais: jest.fn(),
  buscarAnimal: jest.fn(),
}));

// Mock do módulo de conteúdo: as três funções viram funções falsas.
jest.mock('api/content', () => ({
  buscarNumeros: jest.fn(),
  buscarHistorias: jest.fn(),
  buscarEtapasAdocao: jest.fn(),
}));

// Mock do serviço de autenticação do painel (buscar usuário logado e fazer login).
jest.mock('admin/security/authService', () => ({
  fetchAdminMe: jest.fn(),
  loginAdmin: jest.fn(),
}));

// O quê: define o animal usado nos cenários de catálogo.
// Como: representa o formato esperado pela camada de normalização da API.
// Para quê: permitir verificar nome, ficha e formulário com dados conhecidos.
// O objeto imita o formato que o backend devolve (campos em português, com "_").
// O nome começa com "mock" porque o Jest só permite usar variáveis externas dentro
// de jest.mock se o nome começar com "mock" (regra de segurança do "hoisting").
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
// beforeAll: roda UMA vez, antes de todos os testes deste arquivo.
// IntersectionObserver é uma API do navegador que avisa quando um elemento aparece na tela
// (usada em animações). O jsdom não tem, então criamos uma classe "vazia" que não faz nada.
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
// beforeEach: roda antes de CADA teste.
beforeEach(() => {
  // A lista de animais do catálogo terá só o Nino.
  buscarTodoAnimais.mockResolvedValue([mockAnimal]);
  // O perfil do animal: "...mockAnimal" copia os campos e acrescenta temperamento e fotos vazios.
  buscarAnimal.mockResolvedValue({ ...mockAnimal, temperamento: [], fotos: [] });
  // Números exibidos na página inicial.
  buscarNumeros.mockResolvedValue({ animais_resgatados: 11, adocoes_realizadas: 4, aguardando_lar: 6 });
  // Uma história de adoção de exemplo.
  buscarHistorias.mockResolvedValue([
    { id: 'h1', autor_nome: 'Fernanda A.', texto: 'Pipoca trouxe paz para a casa.', foto_url: null, animal: { id: 'a1', nome: 'Pipoca', foto_url: null } },
  ]);
  // Duas etapas do processo de adoção.
  buscarEtapasAdocao.mockResolvedValue([
    { ordem: 1, titulo: 'Encontre', descricao: 'Navegue pelos pets.' },
    { ordem: 2, titulo: 'Leve para casa', descricao: 'Comece a nova vida.' },
  ]);
});

// O quê: limpa chamadas e estados dos mocks depois de cada teste.
// Como: clearAllMocks remove histórico sem substituir as implementações configuradas.
// Para quê: impedir que um caso influencie as asserções do seguinte.
// afterEach: roda depois de CADA teste.
afterEach(() => {
  jest.clearAllMocks();
});

// O quê: verifica a landing page e o link para o catálogo.
// Como: renderiza com rota raiz e consulta papéis acessíveis e conteúdo assíncrono.
// Para quê: proteger a entrada principal da aplicação e sua chamada para adoção.
// test('descrição', função): define um cenário. "async" porque esperaremos conteúdo carregado depois.
test('renders the landing page and links to the adoption catalog', async () => {
  // Desenha o App começando na URL "/" (página inicial).
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  // getByRole procura um elemento pelo seu "papel" de acessibilidade (heading = título).
  // /.../i é uma expressão regular; o "i" ignora maiúsculas/minúsculas.
  expect(
    screen.getByRole('heading', { name: /Cada focinho tem uma/i })
  ).toBeInTheDocument();

  // Cabeçalho e topo levam ao catálogo.
  // getAllByRole devolve TODOS os links com esse nome (há mais de um na página).
  const adoptLinks = screen.getAllByRole('link', { name: 'Quero adotar' });
  // Confere que existem pelo menos 2 links "Quero adotar".
  expect(adoptLinks.length).toBeGreaterThanOrEqual(2);
  // Cada um deles deve apontar para /adotar.
  adoptLinks.forEach((link) => expect(link).toHaveAttribute('href', '/adotar'));
  // O link "Quero doar" deve apontar para /doar.
  expect(screen.getByRole('link', { name: 'Quero doar' })).toHaveAttribute('href', '/doar');

  // findByRole ESPERA o elemento aparecer (devolve uma Promise), útil para conteúdo
  // que chega depois de uma chamada à API (aqui, a seção de animais).
  await screen.findByRole('heading', { name: /Quem está esperando por você/i });
});

// O quê: verifica a jornada catálogo → ficha completa → formulário de adoção.
// Como: o cartão do catálogo é um link para /animais/:id; a ficha abre o formulário.
// Para quê: garantir que a jornada principal do usuário permaneça conectada.
test('goes from the catalog to the full profile and opens the adoption form', async () => {
  // Começa no catálogo (/adotar).
  render(
    <MemoryRouter initialEntries={['/adotar']}>
      <App />
    </MemoryRouter>
  );

  // Espera o cartão do Nino aparecer e clica no link "Conhecer o Nino".
  fireEvent.click(await screen.findByRole('link', { name: /Conhecer o Nino/i }));

  // Agora deve estar no perfil: um título de nível 1 (<h1>) com o nome "Nino".
  expect(await screen.findByRole('heading', { level: 1, name: 'Nino' })).toBeInTheDocument();
  // Confere que o perfil buscou o animal pelo id certo.
  // expect.anything() aceita qualquer valor no 2º argumento (aqui, as opções da requisição).
  expect(buscarAnimal).toHaveBeenCalledWith('nino-001', expect.anything());
  // Clica no botão para abrir o formulário de adoção.
  fireEvent.click(screen.getByRole('button', { name: /Quero adotar o Nino/i }));

  // O formulário deve abrir com o título "Quero adotar Nino".
  expect(await screen.findByRole('heading', { name: /Quero adotar Nino/i })).toBeInTheDocument();
});

// Verifica que /admin/login mostra a página de login do painel.
test('renders the admin login page at the admin route', async () => {
  render(
    <MemoryRouter initialEntries={['/admin/login']}>
      <App />
    </MemoryRouter>
  );

  // A página de login é "lazy", por isso usamos findByRole (espera ela carregar).
  expect(
    await screen.findByRole('heading', { name: /acesso do painel/i })
  ).toBeInTheDocument();
  // getByLabelText encontra campos pelo texto do <label> ligado a eles.
  expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
});

// Verifica que o painel respeita as permissões vindas do backend.
test('admin navigation and direct routes respect permissions from the backend', async () => {
  // mockResolvedValueOnce: só na PRÓXIMA chamada, fetchAdminMe devolverá esta voluntária,
  // que tem apenas a permissão de ver voluntários.
  fetchAdminMe.mockResolvedValueOnce({
    id: 'user-volunteer',
    nome: 'Luiza',
    role: 'voluntariado',
    permissions: ['volunteers:read'],
  });
  // Simula que existe um token de login salvo no navegador.
  localStorage.setItem('patas_admin_token', 'valid-token');

  // Tenta abrir direto a aba de doações (que ela NÃO pode ver).
  render(
    <MemoryRouter initialEntries={['/admin/doacoes']}>
      <App />
    </MemoryRouter>
  );

  // Deve aparecer o aviso de "acesso sem permissão".
  expect(await screen.findByRole('heading', { name: /acesso sem permissão/i })).toBeInTheDocument();
  // O menu deve ter "Voluntários"...
  expect(screen.getByRole('link', { name: 'Voluntários' })).toBeInTheDocument();
  // ...e NÃO deve ter "Doações". queryByRole devolve null (em vez de erro) se não achar.
  expect(screen.queryByRole('link', { name: 'Doações' })).not.toBeInTheDocument();
  // Limpa o armazenamento para não afetar os próximos testes.
  localStorage.clear();
});

// Verifica que uma sessão expirada é limpa e o usuário volta ao login.
test('clears an expired admin session and returns to login', async () => {
  // mockRejectedValueOnce: a próxima chamada falha, imitando a resposta 401 (não autorizado).
  fetchAdminMe.mockRejectedValueOnce({ response: { status: 401 } });
  // Simula um token antigo e um usuário salvos no navegador.
  localStorage.setItem('patas_admin_token', 'expired-token');
  localStorage.setItem('patas_admin_user', '{"nome":"Admin"}');

  render(
    <MemoryRouter initialEntries={['/admin']}>
      <App />
    </MemoryRouter>
  );

  // Deve voltar para a tela de login...
  expect(
    await screen.findByRole('heading', { name: /acesso do painel/i })
  ).toBeInTheDocument();
  // ...e apagar o token e o usuário salvos.
  expect(localStorage.getItem('patas_admin_token')).toBeNull();
  expect(localStorage.getItem('patas_admin_user')).toBeNull();
});

// O quê: verifica o destaque do topo.
// Como: renderiza o Hero com um animal comum e um urgente.
// Para quê: o caso urgente aparece primeiro, com o link para o perfil dele e o artigo certo.
// Este teste não é assíncrono: o Hero recebe os dados direto pela prop "pets".
test('the hero highlights the first urgent animal', () => {
  // Dois animais já no formato usado pelo front-end (name, sex, urgent...).
  const pets = [
    { id: 'mel', name: 'Mel', sex: 'Fêmea', urgent: false, image: '' },
    { id: 'duque', name: 'Duque', sex: 'Macho', urgent: true, image: '' },
  ];
  // O Hero usa Link, então precisa estar dentro de um roteador.
  render(
    <MemoryRouter>
      <Hero pets={pets} />
    </MemoryRouter>
  );

  // Título principal do topo.
  expect(screen.getByRole('heading', { name: 'Cada focinho tem uma história.' })).toBeInTheDocument();
  // Contador de animais esperando um lar.
  expect(screen.getByText('2 aguardando um lar')).toBeInTheDocument();
  // O destaque deve ser o Duque (o urgente).
  const highlight = screen.getByRole('link', { name: /Duque precisa de um lar/ });
  // O link do destaque leva ao perfil do Duque.
  expect(highlight).toHaveAttribute('href', '/animais/duque');
  // E o texto usa o artigo masculino "do Duque".
  expect(highlight).toHaveTextContent('Ver perfil do Duque');
});

// Verifica que a página inicial mostra histórias e etapas vindas do backend (aqui, dos mocks).
test('home shows stories and adoption steps from the backend', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  // Espera o texto da história aparecer.
  expect(await screen.findByText(/Pipoca trouxe paz para a casa/)).toBeInTheDocument();
  // O nome da autora deve aparecer.
  expect(screen.getByText('Fernanda A.')).toBeInTheDocument();
  // E a frase indicando qual animal foi adotado.
  expect(screen.getByText(/adotou Pipoca/)).toBeInTheDocument();
  // Uma das etapas de adoção também deve aparecer.
  expect(await screen.findByText('Comece a nova vida.')).toBeInTheDocument();
});

// Verifica que endereços desconhecidos mostram a página 404.
test('unknown addresses show the 404 page instead of the home', () => {
  render(
    <MemoryRouter initialEntries={['/pagina-que-nao-existe']}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
});

// Verifica que rotas do painel sem login levam à tela de login.
test('admin routes without a session go to login, keeping the requested page', async () => {
  // Garante que não há token salvo.
  localStorage.removeItem('patas_admin_token');
  render(
    <MemoryRouter initialEntries={['/admin/historias']}>
      <App />
    </MemoryRouter>
  );

  // Deve aparecer o login...
  expect(await screen.findByRole('heading', { name: /acesso do painel/i })).toBeInTheDocument();
  // ...com o link "Esqueci minha senha" apontando para a página certa.
  expect(screen.getByRole('link', { name: 'Esqueci minha senha' })).toHaveAttribute('href', '/admin/esqueci-senha');
  // Sem token, o app nem tenta buscar o usuário no backend.
  expect(fetchAdminMe).not.toHaveBeenCalled();
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. O Jest carrega o arquivo; os jest.mock trocam os módulos de API por funções falsas.
 *   2. beforeAll cria um IntersectionObserver falso.
 *   3. Antes de cada teste, beforeEach programa o que cada função falsa devolve.
 *   4. Cada teste desenha o App em uma URL (MemoryRouter), interage (clica) e
 *      verifica o resultado com expect(...).
 *   5. Depois de cada teste, afterEach limpa o histórico dos mocks.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Testes com Jest: test, expect, beforeAll, beforeEach, afterEach.
 *   - Mocks: jest.mock, jest.fn, mockResolvedValue(Once), mockRejectedValueOnce.
 *   - Testing Library: render, screen, getBy x queryBy x findBy, fireEvent.
 *   - Consultas por acessibilidade (getByRole, getByLabelText) — testar como o usuário enxerga.
 *   - MemoryRouter para testar rotas.
 *   - Testes assíncronos com async/await.
 *   - localStorage e simulação de sessão de login.
 * ============================================================================
 */
