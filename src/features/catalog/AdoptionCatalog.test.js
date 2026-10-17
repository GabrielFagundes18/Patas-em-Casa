/*
 * ============================================================================
 * ARQUIVO: AdoptionCatalog.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Testes automatizados da página do catálogo (/adotar): erro com "tentar de
 *   novo", ordem dos urgentes, links antigos, filtros rápidos e da gaveta, filtros
 *   na URL, busca com espera (debounce), favoritos, compartilhamento e estados.
 *
 * PRINCIPAIS ITENS:
 *   - nino, mel: animais de exemplo (formato da API).
 *   - LocationProbe: componente de teste que mostra a URL atual na tela.
 *   - ProfileStub: página falsa de perfil (para testar redirecionamentos).
 *   - renderCatalog(url): desenha o catálogo numa URL.
 *   - headerCount, cardNames: auxiliares de consulta.
 *   - 10 testes.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./AdoptionCatalog.jsx → componente testado.
 *   - api/animals            → substituído por mock.
 *   - Indiretamente: FilterDrawer, AnimalCard, PetPhoto, useFavorites, catalogFilters, sharePet.
 * ============================================================================
 */

// Verificações extras do jest-dom.
import '@testing-library/jest-dom';
// Ferramentas da Testing Library.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
// Roteador de memória, rotas e hooks para ler a URL e os parâmetros.
import { MemoryRouter, Route, Routes, useLocation, useParams } from 'react-router-dom';
// Página testada.
import AdoptionCatalog from './AdoptionCatalog';
// Função de API (vira mock abaixo).
import { buscarTodoAnimais } from 'api/animals';

// Substitui a API de animais por uma função falsa.
jest.mock('api/animals', () => ({
  buscarTodoAnimais: jest.fn(),
}));

// Animal de exemplo: cachorro urgente, com temperamento "brincalhão".
const nino = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  nome: 'Nino',
  especie: 'cachorro',
  raca: 'Vira-lata',
  sexo: 'macho',
  idade_anos: '2.0',
  porte: 'medio',
  status: 'urgente',
  descricao: 'Nino adora passeios no fim da tarde.',
  foto_url: 'https://example.com/nino.jpg',
  data_entrada: '2026-08-23',
  castrado: true,
  vacinado: true,
  temperamento: ['brincalhão'],
};

// Animal de exemplo: gata, sem foto (para testar o substituto), não urgente.
const mel = {
  id: '6f1c2a9e-1111-4222-8333-444455556666',
  nome: 'Mel',
  especie: 'gato',
  raca: 'SRD',
  sexo: 'femea',
  idade_anos: '1.0',
  porte: 'pequeno',
  status: 'disponivel',
  descricao: 'Mel é sociável e adora colo.',
  foto_url: null,
  data_entrada: '2026-07-28',
  castrado: true,
  vacinado: false,
  temperamento: [],
};

/*
 * COMPONENTE DE TESTE: LocationProbe
 * O que faz: escreve na tela o caminho + parâmetros da URL atual, num elemento com data-testid.
 * Por quê: permite conferir nos testes o que foi gravado na URL.
 */
// Mostra o endereço atual, para conferir os filtros gravados na URL.
function LocationProbe() {
  // useLocation devolve a localização atual (pathname = caminho, search = "?...").
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

/*
 * COMPONENTE DE TESTE: ProfileStub
 * O que faz: página falsa de perfil que só mostra "Ficha <id>".
 * Por quê: verificar que o redirecionamento chegou ao perfil certo sem desenhar a página real.
 */
function ProfileStub() {
  // useParams lê o ":id" da rota.
  const { id } = useParams();
  return <h1>Ficha {id}</h1>;
}

/*
 * FUNÇÃO AUXILIAR: renderCatalog
 * O que faz: desenha o catálogo (com o LocationProbe) e a rota falsa de perfil.
 * Parâmetros: url (string, padrão '/adotar').
 */
function renderCatalog(url = '/adotar') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/adotar" element={<><AdoptionCatalog /><LocationProbe /></>} />
        <Route path="/animais/:id" element={<ProfileStub />} />
      </Routes>
    </MemoryRouter>
  );
}

// Auxiliar: o parágrafo do cabeçalho com a contagem ("N animais esperando por um lar...").
const headerCount = () => screen.getByText(/esperando por um lar/i);
// Auxiliar: nomes dos cartões na ordem da tela (títulos h2 que sejam "Nino" ou "Mel").
const cardNames = () => screen.getAllByRole('heading', { level: 2 })
  .map((heading) => heading.textContent)
  .filter((name) => ['Nino', 'Mel'].includes(name));

// IntersectionObserver falso (o jsdom não tem).
beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Antes de cada teste: a API devolve Mel e Nino (Mel primeiro, para testar a ordenação).
beforeEach(() => {
  buscarTodoAnimais.mockResolvedValue([mel, nino]);
});

// Depois de cada teste: limpa mocks, favoritos salvos e a trava de rolagem da gaveta.
afterEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  document.body.style.overflow = '';
});

// Teste 1: falha da API mostra erro com botão de tentar de novo (e não "nenhum animal").
test('shows an error with retry instead of an empty catalog when the API fails', async () => {
  // Só a primeira chamada falha.
  buscarTodoAnimais.mockRejectedValueOnce(new Error('Network Error'));
  renderCatalog();

  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Não conseguimos carregar os animais');
  // Não pode confundir erro com lista vazia.
  expect(screen.queryByText(/nenhum animal encontrado/i)).not.toBeInTheDocument();

  // Clica em "Tentar novamente"...
  fireEvent.click(within(alert).getByRole('button', { name: /tentar novamente/i }));

  // ...e agora os animais aparecem; a API foi chamada 2 vezes.
  expect(await screen.findByRole('heading', { name: 'Nino' })).toBeInTheDocument();
  expect(buscarTodoAnimais).toHaveBeenCalledTimes(2);
});

// Teste 2: a página tem menu e rodapé, e os urgentes vêm primeiro.
test('the page has the site menu and footer, and urgent animals come first', async () => {
  renderCatalog();
  await screen.findByRole('heading', { name: 'Nino' });

  // Rodapé presente (nav com aria-label "Rodapé").
  expect(screen.getByRole('navigation', { name: 'Rodapé' })).toBeInTheDocument();
  // Nino (urgente) antes de Mel.
  expect(cardNames()).toEqual(['Nino', 'Mel']);
  // <select> tem o papel "combobox"; ordenação padrão "urgent".
  expect(screen.getByRole('combobox', { name: 'Ordenar' })).toHaveValue('urgent');
  // Links dos cartões, com artigo certo.
  expect(screen.getByRole('link', { name: /Conhecer o Nino/ })).toHaveAttribute('href', `/animais/${nino.id}`);
  expect(screen.getByRole('link', { name: /Conhecer a Mel/ })).toBeInTheDocument();
  // O código interno do animal não deve aparecer para o visitante.
  expect(screen.queryByText(/550E8400/)).not.toBeInTheDocument();
});

// Teste 3: links antigos com ?pet= redirecionam para o perfil completo.
test('old shared links (/adotar?pet=<id>) open the full profile', async () => {
  renderCatalog(`/adotar?pet=${nino.id}`);

  expect(await screen.findByRole('heading', { name: `Ficha ${nino.id}` })).toBeInTheDocument();
});

// Teste 4: filtros rápidos mudam a lista e são gravados na URL.
test('quick filters change the list and are saved in the address', async () => {
  renderCatalog();
  await screen.findByRole('heading', { name: 'Nino' });
  expect(headerCount()).toHaveTextContent('2 animais esperando');

  // Clica no atalho "Gatos".
  fireEvent.click(screen.getByRole('button', { name: 'Gatos' }));

  // O atalho fica "pressionado", a contagem muda (singular) e só a Mel aparece.
  expect(screen.getByRole('button', { name: 'Gatos' })).toHaveAttribute('aria-pressed', 'true');
  expect(headerCount()).toHaveTextContent('1 animal esperando');
  expect(cardNames()).toEqual(['Mel']);
  // A URL guardou o filtro.
  expect(screen.getByTestId('location')).toHaveTextContent('/adotar?especie=gato');
});

// Teste 5: filtros e ordenação vindos da URL são aplicados ao abrir.
test('filters and sort written in the address are applied when the page opens', async () => {
  renderCatalog('/adotar?urgente=1&ordem=nome');
  await screen.findByRole('heading', { name: 'Nino' });

  expect(cardNames()).toEqual(['Nino']);
  expect(screen.getByRole('button', { name: 'Urgentes' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('combobox', { name: 'Ordenar' })).toHaveValue('name');
});

// Teste 6: filtros da gaveta viram chips, e cada chip remove só o seu filtro.
test('drawer filters (size, sex, temperament) show as chips and each chip removes one filter', async () => {
  renderCatalog();
  await screen.findByRole('heading', { name: 'Nino' });

  // Abre a gaveta (o nome do botão começa com "Filtros": regex /^filtros/i).
  fireEvent.click(screen.getByRole('button', { name: /^filtros/i }));
  const drawer = screen.getByRole('dialog', { name: /encontre o perfil ideal/i });
  // A faixa "Filhote" existe na gaveta.
  expect(within(drawer).getByRole('button', { name: /Filhote/ })).toBeInTheDocument();
  // Escolhe "Médio" e "Fêmea" → nenhum animal combina.
  fireEvent.click(within(drawer).getByRole('button', { name: 'Médio' }));
  fireEvent.click(within(drawer).getByRole('button', { name: 'Fêmea' }));
  expect(within(drawer).getByRole('button', { name: 'Médio' })).toHaveAttribute('aria-pressed', 'true');
  expect(headerCount()).toHaveTextContent('0 animais esperando');

  // Escolhe o traço "brincalhão" e remove o chip "Fêmea".
  fireEvent.click(within(drawer).getByRole('button', { name: 'brincalhão' }));
  fireEvent.click(screen.getByRole('button', { name: 'Remover filtro Fêmea' }));

  // Agora o Nino combina (médio + brincalhão).
  expect(headerCount()).toHaveTextContent('1 animal esperando');
  expect(screen.getByRole('button', { name: 'Remover filtro Porte médio' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Remover filtro brincalhão' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Remover filtro Fêmea' })).not.toBeInTheDocument();
});

// Teste 7: a busca espera a digitação parar e também procura no temperamento.
test('search waits for typing to stop and also finds temperament', async () => {
  renderCatalog();
  await screen.findByRole('heading', { name: 'Nino' });

  // <input type="search"> tem o papel "searchbox". Digita "brincalhao" (sem acento).
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'brincalhao' } });

  // waitFor espera o debounce (300 ms) e o resultado aparecer.
  await waitFor(() => expect(cardNames()).toEqual(['Nino']));
  expect(screen.getByTestId('location')).toHaveTextContent('q=brincalhao');
});

// Teste 8: favoritos ficam salvos no navegador e podem ser filtrados.
test('favorites are saved in the browser and can be shown alone', async () => {
  renderCatalog();
  await screen.findByRole('heading', { name: 'Mel' });
  // Sem favoritos, o botão "Meus favoritos" não aparece.
  expect(screen.queryByRole('button', { name: /Meus favoritos/ })).not.toBeInTheDocument();

  // Favorita a Mel.
  fireEvent.click(screen.getByRole('button', { name: 'Favoritar Mel' }));

  // Coração pressionado e id salvo no localStorage.
  expect(screen.getByRole('button', { name: 'Favoritar Mel' })).toHaveAttribute('aria-pressed', 'true');
  expect(JSON.parse(window.localStorage.getItem('patas:favoritos'))).toEqual([mel.id]);

  // Filtra só os favoritos (os parênteses estão escapados na regex: \( e \)).
  fireEvent.click(screen.getByRole('button', { name: /Meus favoritos \(1\)/ }));
  expect(cardNames()).toEqual(['Mel']);
  expect(screen.getByTestId('location')).toHaveTextContent('favoritos=1');
});

// Teste 9: compartilhar copia o link do perfil e mostra a confirmação.
test('sharing copies a link that opens the animal and confirms it', async () => {
  // Área de transferência falsa (o jsdom não tem). mockResolvedValue() = Promise resolvida sem valor.
  const writeText = jest.fn().mockResolvedValue();
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  renderCatalog();

  fireEvent.click(await screen.findByRole('button', { name: 'Compartilhar Mel' }));

  // Aviso de sucesso e o link correto copiado (no jsdom, a origem é http://localhost).
  expect(await screen.findByText('Link da ficha de Mel copiado.')).toBeInTheDocument();
  expect(writeText).toHaveBeenCalledWith(`http://localhost/animais/${mel.id}`);
});

// Teste 10: foto ausente mostra o substituto e o fim da lista convida a ajudar.
test('missing photos show a placeholder and the end of the list invites to help', async () => {
  renderCatalog();
  await screen.findByRole('heading', { name: 'Mel' });

  // O substituto tem role="img" e o texto alternativo; e a classe certa.
  expect(screen.getByRole('img', { name: 'Mel, gato da raça SRD' })).toHaveClass('pet-photo-placeholder');
  // <aside> tem o papel "complementary".
  const invite = screen.getByRole('complementary', { name: 'Não encontrou agora?' });
  expect(within(invite).getByRole('link', { name: /Quero doar/ })).toHaveAttribute('href', '/doar');
  expect(within(invite).getByRole('link', { name: 'Ser voluntário' })).toHaveAttribute('href', '/#voluntariado');
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   A API é um mock que devolve 2 animais. Cada teste abre o catálogo numa URL,
 *   interage (cliques, digitação) e verifica a tela, a URL (via LocationProbe),
 *   o localStorage e as chamadas de mocks.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Componentes auxiliares de teste ("probes" e "stubs").
 *   - Testar estado na URL e redirecionamentos com MemoryRouter + Routes.
 *   - Papéis acessíveis: alert, navigation, combobox, searchbox, dialog, complementary, img.
 *   - mockRejectedValueOnce para simular falhas; toHaveBeenCalledTimes.
 *   - Simular APIs do navegador (clipboard) com Object.defineProperty.
 *   - waitFor para lógica com atraso (debounce).
 *   - Limpeza entre testes (afterEach) para evitar interferências.
 * ============================================================================
 */
