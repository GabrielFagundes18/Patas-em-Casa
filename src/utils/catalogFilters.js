import { AGE_GROUPS, SORT_OPTIONS } from '../constants/catalogOptions';

// O quê: cria uma nova instância do estado inicial dos filtros.
// Como: recria as listas a cada chamada, evitando compartilhar arrays entre resets.
// Para quê: representar o catálogo sem restrições.
export function createInitialFilters() {
  return {
    species: [],
    size: [],
    sex: [],
    ages: [],
    temperament: [],
    castrado: false,
    vacinado: false,
    urgent: false,
    favorites: false,
  };
}

const LIST_KEYS = ['species', 'size', 'sex', 'ages', 'temperament'];

// O quê: normaliza texto para busca.
// Como: minúsculas e remoção de acentos (NFD sem marcas combinantes).
// Para quê: "femea" encontra "Fêmea" e "medio" encontra "Médio".
function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// O quê: faixa de idade de um animal ("filhote", "jovem", "adulto", "idoso") ou null se a idade é desconhecida.
export function ageGroupOf(ageYears) {
  if (ageYears === null || ageYears === undefined) return null;
  return AGE_GROUPS.find((group) => ageYears >= group.min && ageYears < group.max)?.value ?? null;
}

// O quê: traços de temperamento presentes na lista, do mais comum para o menos comum.
// Como: agrupa ignorando acentos e maiúsculas e mantém a primeira grafia encontrada.
// Para quê: o filtro só oferece traços que existem de fato nos animais cadastrados.
export function collectTemperaments(pets) {
  const counts = new Map();
  pets.forEach((pet) => {
    (pet.temperament ?? []).forEach((trait) => {
      const key = normalizeText(trait);
      if (!key) return;
      const entry = counts.get(key) ?? { label: trait.trim(), count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    });
  });
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'))
    .map((entry) => entry.label);
}

// O quê: aplica busca textual e filtros à lista de animais.
// Como: compara os campos estruturados de mapPetFromApi; listas vazias não restringem.
// Temperamento exige todos os traços escolhidos; "favoritos" usa os ids salvos no navegador.
// Para quê: ser a única regra de filtragem usada pelo catálogo.
export function filterPets(pets, query, filters, { favoriteIds = [] } = {}) {
  const normalizedQuery = normalizeText(query);
  const wantedTraits = filters.temperament.map(normalizeText);

  return pets.filter((pet) => {
    const traits = (pet.temperament ?? []).map(normalizeText);
    const matchesQuery = !normalizedQuery
      || normalizeText([pet.name, pet.breed, pet.meta, ...traits].join(' ')).includes(normalizedQuery);
    const matchesSpecies = !filters.species.length || filters.species.includes(pet.species);
    const matchesSize = !filters.size.length || filters.size.includes(pet.size);
    const matchesSex = !filters.sex.length || filters.sex.includes(pet.sex);
    const matchesAge = !filters.ages.length || filters.ages.includes(ageGroupOf(pet.ageYears));
    const matchesTemperament = wantedTraits.every((trait) => traits.includes(trait));
    const matchesCare = (!filters.castrado || pet.castrado) && (!filters.vacinado || pet.vacinado);
    const matchesStatus = !filters.urgent || pet.urgent;
    const matchesFavorites = !filters.favorites || favoriteIds.includes(pet.id);

    return matchesQuery && matchesSpecies && matchesSize && matchesSex && matchesAge
      && matchesTemperament && matchesCare && matchesStatus && matchesFavorites;
  });
}

// O quê: ordena os animais sem alterar a lista recebida.
// Como: datas AAAA-MM-DD comparam como texto; animais sem data ficam por último.
// Para quê: "Urgentes primeiro" (padrão) e "Esperando há mais tempo" dão visibilidade a quem mais precisa.
export function sortPets(pets, sort) {
  const byName = (a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
  const byRecent = (a, b) => (b.entryDate || '').localeCompare(a.entryDate || '');
  const byWaiting = (a, b) => {
    if (!a.entryDate || !b.entryDate) return Number(!a.entryDate) - Number(!b.entryDate);
    return a.entryDate.localeCompare(b.entryDate);
  };

  if (sort === 'name') return [...pets].sort(byName);
  if (sort === 'recent') return [...pets].sort((a, b) => byRecent(a, b) || byName(a, b));
  if (sort === 'waiting') return [...pets].sort((a, b) => byWaiting(a, b) || byName(a, b));
  return [...pets].sort((a, b) => Number(b.urgent) - Number(a.urgent) || byWaiting(a, b) || byName(a, b));
}

// O quê: atalhos de um clique acima da grade (o restante fica na gaveta de filtros).
export const QUICK_FILTERS = [
  { id: 'caes', label: 'Cães', key: 'species', value: 'Cachorro' },
  { id: 'gatos', label: 'Gatos', key: 'species', value: 'Gato' },
  { id: 'urgentes', label: 'Urgentes', key: 'urgent' },
  { id: 'filhotes', label: 'Filhotes', key: 'ages', value: 'filhote' },
  { id: 'pequenos', label: 'Porte pequeno', key: 'size', value: 'Pequeno' },
];

// Um critério ({ key, value? }) está ligado? Sem value, é um filtro liga/desliga.
export function isFilterOn(filters, { key, value }) {
  return value === undefined ? Boolean(filters[key]) : filters[key].includes(value);
}

// Liga ou desliga um critério sem mexer nos demais.
export function toggleFilter(filters, { key, value }) {
  if (value === undefined) return { ...filters, [key]: !filters[key] };
  const list = filters[key];
  return { ...filters, [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
}

const AGE_LABELS = Object.fromEntries(AGE_GROUPS.map((group) => [group.value, group.label]));

// O quê: descreve os filtros ativos como chips removíveis.
// Como: cada chip guarda a chave do filtro e, para listas, o valor selecionado.
// Para quê: permitir remover um critério sem limpar todos os outros.
export function getActiveFilterChips(filters) {
  return [
    ...filters.species.map((value) => ({ key: 'species', value, label: value })),
    ...filters.size.map((value) => ({ key: 'size', value, label: `Porte ${value.toLowerCase()}` })),
    ...filters.sex.map((value) => ({ key: 'sex', value, label: value })),
    ...filters.ages.map((value) => ({ key: 'ages', value, label: AGE_LABELS[value] ?? value })),
    ...filters.temperament.map((value) => ({ key: 'temperament', value, label: value })),
    filters.urgent ? { key: 'urgent', label: 'Urgentes' } : null,
    filters.castrado ? { key: 'castrado', label: 'Castrados' } : null,
    filters.vacinado ? { key: 'vacinado', label: 'Vacinados' } : null,
    filters.favorites ? { key: 'favorites', label: 'Meus favoritos' } : null,
  ].filter(Boolean);
}

// O quê: remove um único critério dos filtros.
// Como: listas perdem só o valor do chip; flags voltam a false.
// Para quê: implementar o "x" de cada chip ativo.
export function removeFilter(filters, chip) {
  if (LIST_KEYS.includes(chip.key)) {
    return { ...filters, [chip.key]: filters[chip.key].filter((item) => item !== chip.value) };
  }
  return { ...filters, [chip.key]: false };
}

// ---------- Filtros no endereço (/adotar?especie=gato&urgente=1) ----------
// Valores legíveis e sem acento no endereço; a interface continua usando os rótulos do petMapper.
const URL_LISTS = [
  { key: 'species', param: 'especie', slugs: { Cachorro: 'cachorro', Gato: 'gato', Outro: 'outro' } },
  { key: 'size', param: 'porte', slugs: { Pequeno: 'pequeno', Médio: 'medio', Grande: 'grande' } },
  { key: 'sex', param: 'sexo', slugs: { Macho: 'macho', Fêmea: 'femea' } },
  { key: 'ages', param: 'idade', slugs: Object.fromEntries(AGE_GROUPS.map((group) => [group.value, group.value])) },
];
const URL_FLAGS = [
  { key: 'urgent', param: 'urgente' },
  { key: 'castrado', param: 'castrado' },
  { key: 'vacinado', param: 'vacinado' },
  { key: 'favorites', param: 'favoritos' },
];
const DEFAULT_SORT = SORT_OPTIONS[0];

function splitParam(params, name) {
  return [...new Set((params.get(name) || '').split(',').map((item) => item.trim()).filter(Boolean))];
}

// O quê: lê busca, filtros e ordenação do endereço; valores desconhecidos são ignorados.
export function readCatalogParams(params) {
  const filters = createInitialFilters();
  URL_LISTS.forEach(({ key, param, slugs }) => {
    const bySlug = Object.fromEntries(Object.entries(slugs).map(([label, slug]) => [slug, label]));
    filters[key] = splitParam(params, param).map((slug) => bySlug[slug]).filter(Boolean);
  });
  filters.temperament = splitParam(params, 'temperamento').slice(0, 10);
  URL_FLAGS.forEach(({ key, param }) => {
    filters[key] = params.get(param) === '1';
  });

  const sort = SORT_OPTIONS.find((option) => option.param === params.get('ordem'))?.value ?? DEFAULT_SORT.value;
  return { query: params.get('q') ?? '', filters, sort };
}

// O quê: escreve busca, filtros e ordenação no endereço, só com o que difere do padrão.
export function writeCatalogParams({ query, filters, sort }) {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  URL_LISTS.forEach(({ key, param, slugs }) => {
    const values = filters[key].map((label) => slugs[label]).filter(Boolean);
    if (values.length) params.set(param, values.join(','));
  });
  if (filters.temperament.length) params.set('temperamento', filters.temperament.join(','));
  URL_FLAGS.forEach(({ key, param }) => {
    if (filters[key]) params.set(param, '1');
  });
  if (sort !== DEFAULT_SORT.value) {
    params.set('ordem', SORT_OPTIONS.find((option) => option.value === sort)?.param ?? DEFAULT_SORT.param);
  }
  return params;
}
