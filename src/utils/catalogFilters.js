import { MAX_AGE_FILTER } from '../constants/catalogOptions';

// O quê: cria uma nova instância do estado inicial dos filtros.
// Como: recria as listas a cada chamada, evitando compartilhar arrays entre resets.
// Para quê: representar o catálogo sem restrições.
export function createInitialFilters() {
  return {
    species: [],
    size: [],
    sex: [],
    age: MAX_AGE_FILTER,
    castrado: false,
    vacinado: false,
    urgent: false,
  };
}

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

// O quê: aplica busca textual e filtros à lista de animais.
// Como: compara os campos estruturados de mapPetFromApi; listas vazias não restringem.
// Para quê: ser a única regra de filtragem usada pelo catálogo.
export function filterPets(pets, query, filters) {
  const normalizedQuery = normalizeText(query);
  const ageLimit = Number(filters.age);

  return pets.filter((pet) => {
    const matchesQuery = !normalizedQuery
      || normalizeText([pet.name, pet.code, pet.breed, pet.meta].join(' ')).includes(normalizedQuery);
    const matchesSpecies = !filters.species.length || filters.species.includes(pet.species);
    const matchesSize = !filters.size.length || filters.size.includes(pet.size);
    const matchesSex = !filters.sex.length || filters.sex.includes(pet.sex);
    const matchesAge = ageLimit >= MAX_AGE_FILTER || (pet.ageYears !== null && pet.ageYears <= ageLimit);
    const matchesCare = (!filters.castrado || pet.castrado) && (!filters.vacinado || pet.vacinado);
    const matchesStatus = !filters.urgent || pet.urgent;

    return matchesQuery && matchesSpecies && matchesSize && matchesSex
      && matchesAge && matchesCare && matchesStatus;
  });
}

// O quê: ordena os animais sem alterar a lista recebida.
// Como: datas AAAA-MM-DD comparam como texto; animais sem data ficam por último.
// Para quê: "Mais recentes" usar a data de entrada e "Mais urgentes" priorizar casos urgentes.
export function sortPets(pets, sort) {
  const byRecent = (a, b) => (b.entryDate || '').localeCompare(a.entryDate || '');
  const byName = (a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });

  if (sort === 'name') return [...pets].sort(byName);
  if (sort === 'urgent') {
    return [...pets].sort((a, b) => Number(b.urgent) - Number(a.urgent) || byRecent(a, b) || byName(a, b));
  }
  return [...pets].sort((a, b) => byRecent(a, b) || byName(a, b));
}

// O quê: descreve os filtros ativos como chips removíveis.
// Como: cada chip guarda a chave do filtro e, para listas, o valor selecionado.
// Para quê: permitir remover um critério sem limpar todos os outros.
export function getActiveFilterChips(filters) {
  const ageLimit = Number(filters.age);

  return [
    ...filters.species.map((value) => ({ key: 'species', value, label: value })),
    ...filters.size.map((value) => ({ key: 'size', value, label: `Porte ${value.toLowerCase()}` })),
    ...filters.sex.map((value) => ({ key: 'sex', value, label: value })),
    ageLimit < MAX_AGE_FILTER
      ? { key: 'age', label: `Até ${ageLimit} ${ageLimit === 1 ? 'ano' : 'anos'}` }
      : null,
    filters.urgent ? { key: 'urgent', label: 'Urgentes' } : null,
    filters.castrado ? { key: 'castrado', label: 'Castrados' } : null,
    filters.vacinado ? { key: 'vacinado', label: 'Vacinados' } : null,
  ].filter(Boolean);
}

// O quê: remove um único critério dos filtros.
// Como: listas perdem só o valor do chip; idade volta ao máximo; flags voltam a false.
// Para quê: implementar o "x" de cada chip ativo.
export function removeFilter(filters, chip) {
  if (['species', 'size', 'sex'].includes(chip.key)) {
    return { ...filters, [chip.key]: filters[chip.key].filter((item) => item !== chip.value) };
  }
  if (chip.key === 'age') return { ...filters, age: MAX_AGE_FILTER };
  return { ...filters, [chip.key]: false };
}
