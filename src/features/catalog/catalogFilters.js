/*
 * ============================================================================
 * ARQUIVO: catalogFilters.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Contém TODA a lógica de busca, filtro e ordenação do catálogo de adoção,
 *   além de ler e escrever os filtros na URL (ex.: /adotar?especie=gato&urgente=1).
 *   São funções "puras" (sem tela), o que facilita testar e reaproveitar.
 *
 * PRINCIPAIS FUNÇÕES:
 *   - createInitialFilters()              → filtros vazios (sem restrição).
 *   - normalizeText(value)                → (interna) minúsculas e sem acentos.
 *   - ageGroupOf(ageYears)                → faixa de idade de um animal.
 *   - collectTemperaments(pets)           → traços de temperamento existentes, por frequência.
 *   - filterPets(pets, query, filters, opções) → aplica busca e filtros.
 *   - sortPets(pets, sort)                → ordena sem alterar a lista original.
 *   - QUICK_FILTERS, isFilterOn, toggleFilter → atalhos de um clique.
 *   - getActiveFilterChips, removeFilter  → "chips" dos filtros ativos.
 *   - splitParam (interna), readCatalogParams, writeCatalogParams → filtros na URL.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./catalogOptions.js → AGE_GROUPS e SORT_OPTIONS.
 *   - Usado por: features/catalog/AdoptionCatalog.jsx e
 *     features/catalog/FilterDrawer/FilterDrawer.jsx.
 *   - Testado em: features/catalog/catalogFilters.test.js.
 *   - Trabalha com animais no formato de shared/utils/petMapper.js.
 * ============================================================================
 */

// Faixas de idade e opções de ordenação.
import { AGE_GROUPS, SORT_OPTIONS } from './catalogOptions';

/*
 * FUNÇÃO: createInitialFilters
 * O que faz: cria um objeto de filtros "zerado".
 * Parâmetros: nenhum.
 * Retorno (objeto): listas vazias (species, size, sex, ages, temperament) e
 *   interruptores desligados (castrado, vacinado, urgent, favorites).
 * Onde é usada: no estado inicial do catálogo, ao limpar filtros e em readCatalogParams.
 * Por que é uma função (e não uma constante): cada chamada cria listas NOVAS, evitando
 *   que dois lugares compartilhem (e alterem sem querer) o mesmo array.
 */
// O quê: cria uma nova instância do estado inicial dos filtros.
// Como: recria as listas a cada chamada, evitando compartilhar arrays entre resets.
// Para quê: representar o catálogo sem restrições.
export function createInitialFilters() {
  return {
    species: [], // espécies escolhidas (ex.: ['Gato'])
    size: [], // portes escolhidos
    sex: [], // sexos escolhidos
    ages: [], // faixas de idade escolhidas (ex.: ['filhote'])
    temperament: [], // traços de temperamento exigidos
    castrado: false, // só castrados?
    vacinado: false, // só vacinados?
    urgent: false, // só urgentes?
    favorites: false, // só os favoritos do visitante?
  };
}

// Nomes dos filtros que são LISTAS (os outros são interruptores true/false).
const LIST_KEYS = ['species', 'size', 'sex', 'ages', 'temperament'];

/*
 * FUNÇÃO: normalizeText (interna)
 * O que faz: prepara um texto para comparação: minúsculas, sem acentos e sem espaços nas pontas.
 * Parâmetros: value (qualquer valor; null/undefined viram '').
 * Retorno (string): ex.: "  Fêmea " → "femea".
 * Onde é usada: na busca, no filtro de temperamento e em collectTemperaments.
 */
// O quê: normaliza texto para busca.
// Como: minúsculas e remoção de acentos (NFD sem marcas combinantes).
// Para quê: "femea" encontra "Fêmea" e "medio" encontra "Médio".
function normalizeText(value) {
  // String(value ?? '') garante um texto mesmo se vier null/undefined/número.
  return String(value ?? '')
    // .normalize('NFD') separa cada letra acentuada em "letra + acento" (ê → e + ^).
    .normalize('NFD')
    // Remove os acentos separados: a classe [ ] contém o intervalo Unicode U+0300 a U+036F,
    // que são as "marcas combinantes" (os acentos soltos). Os caracteres estão escritos
    // literalmente dentro da expressão regular (por isso parecem invisíveis).
    .replace(/[̀-ͯ]/g, '')
    // Deixa tudo em minúsculas.
    .toLowerCase()
    // Remove espaços das pontas.
    .trim();
}

/*
 * FUNÇÃO: ageGroupOf
 * O que faz: diz em qual faixa de idade o animal está.
 * Parâmetros: ageYears (number | null | undefined) — idade em anos.
 * Retorno (string | null): 'filhote', 'jovem', 'adulto', 'idoso', ou null se a idade for desconhecida.
 * Onde é usada: em filterPets (filtro de idade).
 */
// O quê: faixa de idade de um animal ("filhote", "jovem", "adulto", "idoso") ou null se a idade é desconhecida.
export function ageGroupOf(ageYears) {
  // Idade desconhecida → sem faixa.
  if (ageYears === null || ageYears === undefined) return null;
  // Procura a faixa em que min <= idade < max e devolve o "value" dela (ou null se nenhuma servir).
  return AGE_GROUPS.find((group) => ageYears >= group.min && ageYears < group.max)?.value ?? null;
}

/*
 * FUNÇÃO: collectTemperaments
 * O que faz: lista os traços de temperamento que existem nos animais, do mais comum ao menos comum.
 * Parâmetros: pets (array) — animais no formato do petMapper (campo "temperament").
 * Retorno (array de strings): ex.: ['Brincalhão', 'Calmo', 'Dócil'].
 * Onde é usada: na gaveta de filtros, para oferecer só traços que realmente existem.
 */
// O quê: traços de temperamento presentes na lista, do mais comum para o menos comum.
// Como: agrupa ignorando acentos e maiúsculas e mantém a primeira grafia encontrada.
// Para quê: o filtro só oferece traços que existem de fato nos animais cadastrados.
export function collectTemperaments(pets) {
  // Map é uma estrutura chave → valor. Aqui: texto normalizado → { label, count }.
  const counts = new Map();
  // Percorre cada animal...
  pets.forEach((pet) => {
    // ...e cada traço dele ("?? []" se não houver lista).
    (pet.temperament ?? []).forEach((trait) => {
      // Chave sem acento/maiúsculas: "Dócil" e "docil" contam como o mesmo traço.
      const key = normalizeText(trait);
      // Traço vazio: ignora (return dentro do forEach pula para o próximo item).
      if (!key) return;
      // Pega a contagem existente ou cria uma nova com a grafia original.
      const entry = counts.get(key) ?? { label: trait.trim(), count: 0 };
      // Soma uma ocorrência.
      entry.count += 1;
      // Guarda de volta no Map.
      counts.set(key, entry);
    });
  });
  // [...counts.values()] transforma os valores do Map num array.
  return [...counts.values()]
    // Ordena por contagem (maior primeiro); empate → ordem alfabética em português.
    // "||" usa o segundo critério só quando o primeiro dá 0 (empate).
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'))
    // Fica só com o texto de cada traço.
    .map((entry) => entry.label);
}

/*
 * FUNÇÃO: filterPets
 * O que faz: aplica a busca por texto e todos os filtros à lista de animais.
 * Parâmetros:
 *   - pets (array): animais (formato do petMapper).
 *   - query (string): texto digitado na busca.
 *   - filters (objeto): filtros (formato de createInitialFilters).
 *   - opções { favoriteIds } (objeto, padrão {}): favoriteIds = ids favoritados pelo visitante.
 * Retorno (array): somente os animais que passam em TODOS os critérios.
 * Regras: listas vazias não restringem nada; temperamento exige TODOS os traços escolhidos.
 * Onde é usada: no AdoptionCatalog.jsx.
 */
// O quê: aplica busca textual e filtros à lista de animais.
// Como: compara os campos estruturados de mapPetFromApi; listas vazias não restringem.
// Temperamento exige todos os traços escolhidos; "favoritos" usa os ids salvos no navegador.
// Para quê: ser a única regra de filtragem usada pelo catálogo.
export function filterPets(pets, query, filters, { favoriteIds = [] } = {}) {
  // Busca normalizada (sem acento, minúscula).
  const normalizedQuery = normalizeText(query);
  // Traços exigidos, normalizados.
  const wantedTraits = filters.temperament.map(normalizeText);

  // .filter mantém só os animais para os quais a função devolve true.
  return pets.filter((pet) => {
    // Traços deste animal, normalizados.
    const traits = (pet.temperament ?? []).map(normalizeText);
    // Busca: sem texto → passa; com texto → procura em nome, raça, linha de informações e traços.
    const matchesQuery = !normalizedQuery
      || normalizeText([pet.name, pet.breed, pet.meta, ...traits].join(' ')).includes(normalizedQuery);
    // Para cada filtro de lista: lista vazia (!length) → passa; senão, o valor do animal precisa estar na lista.
    const matchesSpecies = !filters.species.length || filters.species.includes(pet.species);
    const matchesSize = !filters.size.length || filters.size.includes(pet.size);
    const matchesSex = !filters.sex.length || filters.sex.includes(pet.sex);
    const matchesAge = !filters.ages.length || filters.ages.includes(ageGroupOf(pet.ageYears));
    // .every: TODOS os traços exigidos precisam estar no animal (lista vazia → true).
    const matchesTemperament = wantedTraits.every((trait) => traits.includes(trait));
    // Interruptores: desligado → passa; ligado → o animal precisa ter a característica.
    const matchesCare = (!filters.castrado || pet.castrado) && (!filters.vacinado || pet.vacinado);
    const matchesStatus = !filters.urgent || pet.urgent;
    const matchesFavorites = !filters.favorites || favoriteIds.includes(pet.id);

    // O animal fica na lista só se passar em todos os critérios.
    return matchesQuery && matchesSpecies && matchesSize && matchesSex && matchesAge
      && matchesTemperament && matchesCare && matchesStatus && matchesFavorites;
  });
}

/*
 * FUNÇÃO: sortPets
 * O que faz: devolve uma NOVA lista ordenada (a original não é alterada).
 * Parâmetros:
 *   - pets (array): animais.
 *   - sort (string): 'urgent' (padrão), 'waiting', 'recent' ou 'name'.
 * Retorno (array): a lista ordenada.
 * Regras: datas AAAA-MM-DD podem ser comparadas como texto; animais sem data vão para o fim.
 * Onde é usada: no AdoptionCatalog.jsx.
 */
// O quê: ordena os animais sem alterar a lista recebida.
// Como: datas AAAA-MM-DD comparam como texto; animais sem data ficam por último.
// Para quê: "Urgentes primeiro" (padrão) e "Esperando há mais tempo" dão visibilidade a quem mais precisa.
export function sortPets(pets, sort) {
  // Funções de comparação para .sort: devolvem negativo (a antes), positivo (b antes) ou 0 (empate).
  // Por nome, em português, ignorando maiúsculas e acentos (sensitivity: 'base').
  const byName = (a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
  // Mais recentes primeiro (data maior antes): compara b com a.
  const byRecent = (a, b) => (b.entryDate || '').localeCompare(a.entryDate || '');
  // Há mais tempo esperando primeiro (data menor antes); sem data vai para o fim.
  const byWaiting = (a, b) => {
    // Se algum não tem data: Number(true) = 1 e Number(false) = 0.
    // Quem não tem data recebe 1 e vai para depois de quem tem (0).
    if (!a.entryDate || !b.entryDate) return Number(!a.entryDate) - Number(!b.entryDate);
    // Ambos têm data: compara como texto (funciona no formato AAAA-MM-DD).
    return a.entryDate.localeCompare(b.entryDate);
  };

  // [...pets] cria uma cópia antes de ordenar, porque .sort altera o array no lugar.
  if (sort === 'name') return [...pets].sort(byName);
  // Empate na data → desempata por nome ("||").
  if (sort === 'recent') return [...pets].sort((a, b) => byRecent(a, b) || byName(a, b));
  if (sort === 'waiting') return [...pets].sort((a, b) => byWaiting(a, b) || byName(a, b));
  // Padrão ("urgent"): urgentes primeiro (Number(true)=1); depois quem espera há mais tempo; depois nome.
  return [...pets].sort((a, b) => Number(b.urgent) - Number(a.urgent) || byWaiting(a, b) || byName(a, b));
}

// O quê: atalhos de um clique acima da grade (o restante fica na gaveta de filtros).
// Cada atalho: id (identificador), label (texto do botão), key (qual filtro) e value
// (valor a ligar numa lista). Sem value, o atalho é um interruptor (ex.: urgent).
export const QUICK_FILTERS = [
  { id: 'caes', label: 'Cães', key: 'species', value: 'Cachorro' },
  { id: 'gatos', label: 'Gatos', key: 'species', value: 'Gato' },
  { id: 'urgentes', label: 'Urgentes', key: 'urgent' },
  { id: 'filhotes', label: 'Filhotes', key: 'ages', value: 'filhote' },
  { id: 'pequenos', label: 'Porte pequeno', key: 'size', value: 'Pequeno' },
];

/*
 * FUNÇÃO: isFilterOn
 * O que faz: diz se um critério está ligado.
 * Parâmetros:
 *   - filters (objeto de filtros).
 *   - { key, value } (critério): sem value = interruptor; com value = item de uma lista.
 * Retorno (boolean).
 * Onde é usada: nos atalhos rápidos do catálogo (para marcar o botão como ativo).
 */
// Um critério ({ key, value? }) está ligado? Sem value, é um filtro liga/desliga.
export function isFilterOn(filters, { key, value }) {
  // Interruptor: converte o valor para boolean. Lista: verifica se contém o valor.
  return value === undefined ? Boolean(filters[key]) : filters[key].includes(value);
}

/*
 * FUNÇÃO: toggleFilter
 * O que faz: liga/desliga um critério, devolvendo um NOVO objeto de filtros (sem alterar o original).
 * Parâmetros: filters (objeto) e { key, value } (critério).
 * Retorno (objeto): filtros atualizados.
 * Onde é usada: nos atalhos rápidos e na gaveta de filtros.
 */
// Liga ou desliga um critério sem mexer nos demais.
export function toggleFilter(filters, { key, value }) {
  // Interruptor: inverte o valor ([key] = nome de propriedade calculado).
  if (value === undefined) return { ...filters, [key]: !filters[key] };
  // Lista: remove o valor se já estiver; senão, adiciona.
  const list = filters[key];
  return { ...filters, [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
}

// Tabela "código da faixa → rótulo" (ex.: { filhote: 'Filhote', ... }).
// Object.fromEntries transforma uma lista de pares [chave, valor] num objeto.
const AGE_LABELS = Object.fromEntries(AGE_GROUPS.map((group) => [group.value, group.label]));

/*
 * FUNÇÃO: getActiveFilterChips
 * O que faz: transforma os filtros ativos numa lista de "chips" (etiquetas com botão de remover).
 * Parâmetros: filters (objeto de filtros).
 * Retorno (array): ex.: [{ key: 'species', value: 'Gato', label: 'Gato' }, { key: 'urgent', label: 'Urgentes' }].
 * Onde é usada: no AdoptionCatalog.jsx, acima da grade de cartões.
 */
// O quê: descreve os filtros ativos como chips removíveis.
// Como: cada chip guarda a chave do filtro e, para listas, o valor selecionado.
// Para quê: permitir remover um critério sem limpar todos os outros.
export function getActiveFilterChips(filters) {
  return [
    // Um chip por item de cada lista ("..." espalha os chips de cada lista no array final).
    ...filters.species.map((value) => ({ key: 'species', value, label: value })),
    ...filters.size.map((value) => ({ key: 'size', value, label: `Porte ${value.toLowerCase()}` })),
    ...filters.sex.map((value) => ({ key: 'sex', value, label: value })),
    // Para idades, mostra o rótulo ("Filhote") em vez do código ("filhote").
    ...filters.ages.map((value) => ({ key: 'ages', value, label: AGE_LABELS[value] ?? value })),
    ...filters.temperament.map((value) => ({ key: 'temperament', value, label: value })),
    // Interruptores ligados viram um chip; desligados viram null...
    filters.urgent ? { key: 'urgent', label: 'Urgentes' } : null,
    filters.castrado ? { key: 'castrado', label: 'Castrados' } : null,
    filters.vacinado ? { key: 'vacinado', label: 'Vacinados' } : null,
    filters.favorites ? { key: 'favorites', label: 'Meus favoritos' } : null,
    // ...e o filter(Boolean) remove os null.
  ].filter(Boolean);
}

/*
 * FUNÇÃO: removeFilter
 * O que faz: remove um único critério (o do chip clicado).
 * Parâmetros: filters (objeto) e chip ({ key, value? }).
 * Retorno (objeto): novos filtros.
 * Onde é usada: no "x" de cada chip ativo.
 */
// O quê: remove um único critério dos filtros.
// Como: listas perdem só o valor do chip; flags voltam a false.
// Para quê: implementar o "x" de cada chip ativo.
export function removeFilter(filters, chip) {
  // Se o chip é de uma lista, tira só aquele valor da lista.
  if (LIST_KEYS.includes(chip.key)) {
    return { ...filters, [chip.key]: filters[chip.key].filter((item) => item !== chip.value) };
  }
  // Se é um interruptor, desliga.
  return { ...filters, [chip.key]: false };
}

// ---------- Filtros no endereço (/adotar?especie=gato&urgente=1) ----------
// Valores legíveis e sem acento no endereço; a interface continua usando os rótulos do petMapper.
// Para cada filtro de lista: key (nome no objeto de filtros), param (nome na URL) e
// slugs (tabela "rótulo → texto da URL", ex.: Médio → medio).
const URL_LISTS = [
  { key: 'species', param: 'especie', slugs: { Cachorro: 'cachorro', Gato: 'gato', Outro: 'outro' } },
  { key: 'size', param: 'porte', slugs: { Pequeno: 'pequeno', Médio: 'medio', Grande: 'grande' } },
  { key: 'sex', param: 'sexo', slugs: { Macho: 'macho', Fêmea: 'femea' } },
  // Para idades, o código já é o próprio texto da URL (filhote → filhote).
  { key: 'ages', param: 'idade', slugs: Object.fromEntries(AGE_GROUPS.map((group) => [group.value, group.value])) },
];
// Interruptores: na URL aparecem como "nome=1" quando ligados.
const URL_FLAGS = [
  { key: 'urgent', param: 'urgente' },
  { key: 'castrado', param: 'castrado' },
  { key: 'vacinado', param: 'vacinado' },
  { key: 'favorites', param: 'favoritos' },
];
// Ordenação padrão (a primeira da lista: "Urgentes primeiro").
const DEFAULT_SORT = SORT_OPTIONS[0];

/*
 * FUNÇÃO: splitParam (interna)
 * O que faz: lê um parâmetro da URL com valores separados por vírgula e devolve uma lista limpa.
 * Parâmetros: params (URLSearchParams) e name (nome do parâmetro).
 * Retorno (array): ex.: "gato, cachorro,,gato" → ['gato', 'cachorro'] (sem vazios nem repetidos).
 * Onde é usada: em readCatalogParams.
 */
function splitParam(params, name) {
  // new Set(...) remove repetidos; [...set] volta a ser array.
  return [...new Set((params.get(name) || '').split(',').map((item) => item.trim()).filter(Boolean))];
}

/*
 * FUNÇÃO: readCatalogParams
 * O que faz: lê da URL a busca, os filtros e a ordenação.
 * Parâmetros: params (URLSearchParams) — os parâmetros da URL atual.
 * Retorno (objeto): { query, filters, sort }. Valores desconhecidos na URL são ignorados.
 * Onde é usada: no AdoptionCatalog.jsx, para montar o estado a partir do endereço.
 */
// O quê: lê busca, filtros e ordenação do endereço; valores desconhecidos são ignorados.
export function readCatalogParams(params) {
  // Começa com filtros zerados.
  const filters = createInitialFilters();
  // Para cada filtro de lista...
  URL_LISTS.forEach(({ key, param, slugs }) => {
    // Inverte a tabela: "texto da URL → rótulo" (ex.: medio → Médio).
    const bySlug = Object.fromEntries(Object.entries(slugs).map(([label, slug]) => [slug, label]));
    // Converte cada valor da URL para o rótulo; valores desconhecidos viram undefined e são removidos.
    filters[key] = splitParam(params, param).map((slug) => bySlug[slug]).filter(Boolean);
  });
  // Temperamento: usa o texto como veio, limitado a 10 traços (proteção contra URLs enormes).
  filters.temperament = splitParam(params, 'temperamento').slice(0, 10);
  // Interruptores: ligados só se o valor na URL for exatamente "1".
  URL_FLAGS.forEach(({ key, param }) => {
    filters[key] = params.get(param) === '1';
  });

  // Ordenação: procura a opção cujo "param" é igual ao ?ordem= da URL; se não achar, usa a padrão.
  const sort = SORT_OPTIONS.find((option) => option.param === params.get('ordem'))?.value ?? DEFAULT_SORT.value;
  // Busca (?q=) ou texto vazio.
  return { query: params.get('q') ?? '', filters, sort };
}

/*
 * FUNÇÃO: writeCatalogParams
 * O que faz: transforma busca, filtros e ordenação em parâmetros de URL.
 * Parâmetros: objeto { query, filters, sort }.
 * Retorno (URLSearchParams): só com o que é diferente do padrão (URL curta e limpa).
 * Onde é usada: no AdoptionCatalog.jsx, sempre que o visitante muda algo.
 */
// O quê: escreve busca, filtros e ordenação no endereço, só com o que difere do padrão.
export function writeCatalogParams({ query, filters, sort }) {
  // Começa vazio.
  const params = new URLSearchParams();
  // Busca, se houver texto.
  if (query.trim()) params.set('q', query.trim());
  // Listas: converte rótulos em textos de URL e junta com vírgula (ex.: especie=gato,cachorro).
  URL_LISTS.forEach(({ key, param, slugs }) => {
    const values = filters[key].map((label) => slugs[label]).filter(Boolean);
    if (values.length) params.set(param, values.join(','));
  });
  // Temperamento: os traços separados por vírgula.
  if (filters.temperament.length) params.set('temperamento', filters.temperament.join(','));
  // Interruptores ligados viram "nome=1".
  URL_FLAGS.forEach(({ key, param }) => {
    if (filters[key]) params.set(param, '1');
  });
  // Ordenação só vai para a URL se for diferente da padrão.
  if (sort !== DEFAULT_SORT.value) {
    params.set('ordem', SORT_OPTIONS.find((option) => option.value === sort)?.param ?? DEFAULT_SORT.param);
  }
  // Devolve os parâmetros prontos.
  return params;
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. Ao abrir /adotar, o catálogo chama readCatalogParams para transformar a URL
 *      em { query, filters, sort }.
 *   2. Com os animais carregados, chama filterPets (busca + filtros) e sortPets (ordem).
 *   3. Os atalhos e a gaveta usam toggleFilter/isFilterOn; os chips usam
 *      getActiveFilterChips/removeFilter.
 *   4. A cada mudança, writeCatalogParams gera a nova URL (assim o link pode ser
 *      compartilhado e o botão "voltar" funciona).
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Funções puras e imutabilidade (spread, cópia antes de .sort).
 *   - Normalização Unicode (NFD) e expressões regulares para remover acentos.
 *   - Array: filter, map, every, find, sort, includes; Set (sem repetidos) e Map (contagens).
 *   - Funções de comparação para .sort e desempate com "||"; localeCompare.
 *   - Estado na URL: URLSearchParams (get/set) e "slugs".
 *   - Object.fromEntries / Object.entries para inverter tabelas.
 *   - Parâmetros com desestruturação e valores padrão.
 * ============================================================================
 */
