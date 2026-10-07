import {
  QUICK_FILTERS,
  ageGroupOf,
  collectTemperaments,
  createInitialFilters,
  filterPets,
  getActiveFilterChips,
  readCatalogParams,
  removeFilter,
  sortPets,
  toggleFilter,
  writeCatalogParams,
} from './catalogFilters';
import { mapPetsFromApi } from 'shared/utils/petMapper';

const pets = mapPetsFromApi([
  { id: 'a', nome: 'Nino', especie: 'cachorro', raca: 'Vira-lata', sexo: 'macho', idade_anos: '2.0', porte: 'medio', status: 'urgente', data_entrada: '2026-08-02', castrado: true, vacinado: true, temperamento: ['Brincalhão', 'convive com gatos'] },
  { id: 'b', nome: 'Mel', especie: 'gato', raca: 'SRD', sexo: 'femea', idade_anos: '0.5', porte: 'pequeno', status: 'disponivel', data_entrada: '2026-08-23', castrado: false, vacinado: true, temperamento: ['calma', 'convive com gatos'] },
  { id: 'c', nome: 'Duque', especie: 'cachorro', raca: 'Vira-lata', sexo: 'macho', idade_anos: '16', porte: 'grande', status: 'disponivel', data_entrada: '2026-07-02', castrado: true, vacinado: false },
  { id: 'd', nome: 'Íris', especie: 'outro', raca: null, sexo: null, idade_anos: null, porte: null, status: 'disponivel', data_entrada: null },
]);

const names = (list) => list.map((pet) => pet.name);
const withFilters = (changes) => ({ ...createInitialFilters(), ...changes });

test('default filters show every animal, including older ones and unknown ages', () => {
  expect(names(filterPets(pets, '', createInitialFilters()))).toEqual(['Nino', 'Mel', 'Duque', 'Íris']);
});

test('size, species and sex filters match the labels shown in the drawer', () => {
  expect(names(filterPets(pets, '', withFilters({ size: ['Médio'] })))).toEqual(['Nino']);
  expect(names(filterPets(pets, '', withFilters({ species: ['Outro'] })))).toEqual(['Íris']);
  expect(names(filterPets(pets, '', withFilters({ sex: ['Fêmea'] })))).toEqual(['Mel']);
});

test('age groups use real ages and leave out animals without an age', () => {
  expect(ageGroupOf(0.5)).toBe('filhote');
  expect(ageGroupOf(1)).toBe('jovem');
  expect(ageGroupOf(7.9)).toBe('adulto');
  expect(ageGroupOf(16)).toBe('idoso');
  expect(ageGroupOf(null)).toBeNull();
  expect(names(filterPets(pets, '', withFilters({ ages: ['filhote'] })))).toEqual(['Mel']);
  expect(names(filterPets(pets, '', withFilters({ ages: ['jovem', 'idoso'] })))).toEqual(['Nino', 'Duque']);
});

test('temperament requires every chosen trait, ignoring accents and case', () => {
  expect(names(filterPets(pets, '', withFilters({ temperament: ['convive com gatos'] })))).toEqual(['Nino', 'Mel']);
  expect(names(filterPets(pets, '', withFilters({ temperament: ['brincalhao', 'convive com gatos'] })))).toEqual(['Nino']);
  expect(collectTemperaments(pets)).toEqual(['convive com gatos', 'Brincalhão', 'calma']);
});

test('care, urgency and favorites filters are cumulative', () => {
  expect(names(filterPets(pets, '', withFilters({ castrado: true, vacinado: true })))).toEqual(['Nino']);
  expect(names(filterPets(pets, '', withFilters({ urgent: true })))).toEqual(['Nino']);
  expect(names(filterPets(pets, '', withFilters({ favorites: true }), { favoriteIds: ['b', 'c'] }))).toEqual(['Mel', 'Duque']);
  expect(filterPets(pets, '', withFilters({ favorites: true }))).toEqual([]);
});

test('search ignores accents and case and also finds temperament', () => {
  expect(names(filterPets(pets, 'iris', createInitialFilters()))).toEqual(['Íris']);
  expect(names(filterPets(pets, 'MEDIO', createInitialFilters()))).toEqual(['Nino']);
  expect(names(filterPets(pets, 'calma', createInitialFilters()))).toEqual(['Mel']);
});

test('sorts urgent first (then longest waiting), by waiting time, by arrival or by name without mutating the input', () => {
  const original = [...pets];
  expect(names(sortPets(pets, 'urgent'))).toEqual(['Nino', 'Duque', 'Mel', 'Íris']);
  expect(names(sortPets(pets, 'waiting'))).toEqual(['Duque', 'Nino', 'Mel', 'Íris']);
  expect(names(sortPets(pets, 'recent'))).toEqual(['Mel', 'Nino', 'Duque', 'Íris']);
  expect(names(sortPets(pets, 'name'))).toEqual(['Duque', 'Íris', 'Mel', 'Nino']);
  expect(pets).toEqual(original);
});

test('quick filters toggle one criterion each', () => {
  const [caes, gatos, urgentes] = QUICK_FILTERS;
  let filters = toggleFilter(createInitialFilters(), caes);
  filters = toggleFilter(filters, gatos);
  filters = toggleFilter(filters, urgentes);
  expect(filters.species).toEqual(['Cachorro', 'Gato']);
  expect(filters.urgent).toBe(true);
  expect(toggleFilter(filters, caes).species).toEqual(['Gato']);
});

test('each active filter chip removes only its own criterion', () => {
  const filters = withFilters({ species: ['Cachorro', 'Gato'], ages: ['idoso'], temperament: ['calma'], urgent: true });
  const chips = getActiveFilterChips(filters);

  expect(chips.map((chip) => chip.label)).toEqual(['Cachorro', 'Gato', 'Idoso', 'calma', 'Urgentes']);
  expect(removeFilter(filters, chips[1]).species).toEqual(['Cachorro']);
  expect(removeFilter(filters, chips[2]).ages).toEqual([]);
  expect(removeFilter(filters, chips[3]).temperament).toEqual([]);
  expect(removeFilter(filters, chips[4]).urgent).toBe(false);
});

test('search, filters and sort round-trip through the address', () => {
  const state = {
    query: 'nino',
    filters: withFilters({ species: ['Gato'], size: ['Médio'], sex: ['Fêmea'], ages: ['filhote'], temperament: ['calma'], urgent: true, favorites: true }),
    sort: 'waiting',
  };
  const params = writeCatalogParams(state);

  expect(params.toString()).toBe(
    'q=nino&especie=gato&porte=medio&sexo=femea&idade=filhote&temperamento=calma&urgente=1&favoritos=1&ordem=espera',
  );
  expect(readCatalogParams(params)).toEqual(state);
  expect(writeCatalogParams({ query: '', filters: createInitialFilters(), sort: 'urgent' }).toString()).toBe('');
});

test('unknown values in the address are ignored', () => {
  const { filters, sort } = readCatalogParams(new URLSearchParams('especie=dragao,gato&idade=velho&ordem=aleatoria&urgente=sim'));
  expect(filters.species).toEqual(['Gato']);
  expect(filters.ages).toEqual([]);
  expect(filters.urgent).toBe(false);
  expect(sort).toBe('urgent');
});
