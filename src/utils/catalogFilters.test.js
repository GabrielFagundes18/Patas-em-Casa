import { MAX_AGE_FILTER } from '../constants/catalogOptions';
import {
  createInitialFilters,
  filterPets,
  getActiveFilterChips,
  removeFilter,
  sortPets,
} from './catalogFilters';
import { mapPetsFromApi } from './petMapper';

const pets = mapPetsFromApi([
  { id: 'a', nome: 'Nino', especie: 'cachorro', raca: 'Vira-lata', sexo: 'macho', idade_anos: '2.0', porte: 'medio', status: 'urgente', data_entrada: '2026-08-02', castrado: true, vacinado: true },
  { id: 'b', nome: 'Mel', especie: 'gato', raca: 'SRD', sexo: 'femea', idade_anos: '0.5', porte: 'pequeno', status: 'disponivel', data_entrada: '2026-08-23', castrado: false, vacinado: true },
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

test('age limit compares real ages, so a 6-month-old counts as younger than 1 year', () => {
  expect(names(filterPets(pets, '', withFilters({ age: 1 })))).toEqual(['Mel']);
  expect(names(filterPets(pets, '', withFilters({ age: MAX_AGE_FILTER })))).toContain('Duque');
});

test('care and urgency filters are cumulative', () => {
  expect(names(filterPets(pets, '', withFilters({ castrado: true, vacinado: true })))).toEqual(['Nino']);
  expect(names(filterPets(pets, '', withFilters({ urgent: true })))).toEqual(['Nino']);
});

test('search ignores accents and case', () => {
  expect(names(filterPets(pets, 'iris', createInitialFilters()))).toEqual(['Íris']);
  expect(names(filterPets(pets, 'MEDIO', createInitialFilters()))).toEqual(['Nino']);
});

test('sorts by entry date, urgency or name without mutating the input', () => {
  const original = [...pets];
  expect(names(sortPets(pets, 'recent'))).toEqual(['Mel', 'Nino', 'Duque', 'Íris']);
  expect(names(sortPets(pets, 'urgent'))).toEqual(['Nino', 'Mel', 'Duque', 'Íris']);
  expect(names(sortPets(pets, 'name'))).toEqual(['Duque', 'Íris', 'Mel', 'Nino']);
  expect(pets).toEqual(original);
});

test('each active filter chip removes only its own criterion', () => {
  const filters = withFilters({ species: ['Cachorro', 'Gato'], age: 5, urgent: true });
  const chips = getActiveFilterChips(filters);

  expect(chips.map((chip) => chip.label)).toEqual(['Cachorro', 'Gato', 'Até 5 anos', 'Urgentes']);
  expect(removeFilter(filters, chips[1]).species).toEqual(['Cachorro']);
  expect(removeFilter(filters, chips[2]).age).toBe(MAX_AGE_FILTER);
  expect(removeFilter(filters, chips[3]).urgent).toBe(false);
});
