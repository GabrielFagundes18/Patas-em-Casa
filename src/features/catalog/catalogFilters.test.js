/*
 * ============================================================================
 * ARQUIVO: catalogFilters.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Testes automatizados das funções de busca, filtro, ordenação e URL do
 *   catálogo (catalogFilters.js). Garantem que as regras continuam corretas
 *   quando o código muda.
 *
 * PRINCIPAIS ITENS:
 *   - pets: 4 animais de exemplo (convertidos com mapPetsFromApi).
 *   - names(list): auxiliar que pega só os nomes (deixa as comparações curtas).
 *   - withFilters(changes): auxiliar que cria filtros a partir dos padrões.
 *   - 11 testes.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./catalogFilters.js         → funções testadas.
 *   - shared/utils/petMapper.js   → mapPetsFromApi (prepara os animais de teste).
 * ============================================================================
 */

// Importa todas as funções e constantes que serão testadas.
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
// Converte animais do formato da API para o formato da interface.
import { mapPetsFromApi } from 'shared/utils/petMapper';

// Quatro animais com características variadas:
//   Nino (urgente, médio, 2 anos), Mel (gata, fêmea, filhote), Duque (16 anos, grande),
//   Íris (espécie "outro", sem idade, sem data — para testar dados ausentes e acentos).
const pets = mapPetsFromApi([
  { id: 'a', nome: 'Nino', especie: 'cachorro', raca: 'Vira-lata', sexo: 'macho', idade_anos: '2.0', porte: 'medio', status: 'urgente', data_entrada: '2026-08-02', castrado: true, vacinado: true, temperamento: ['Brincalhão', 'convive com gatos'] },
  { id: 'b', nome: 'Mel', especie: 'gato', raca: 'SRD', sexo: 'femea', idade_anos: '0.5', porte: 'pequeno', status: 'disponivel', data_entrada: '2026-08-23', castrado: false, vacinado: true, temperamento: ['calma', 'convive com gatos'] },
  { id: 'c', nome: 'Duque', especie: 'cachorro', raca: 'Vira-lata', sexo: 'macho', idade_anos: '16', porte: 'grande', status: 'disponivel', data_entrada: '2026-07-02', castrado: true, vacinado: false },
  { id: 'd', nome: 'Íris', especie: 'outro', raca: null, sexo: null, idade_anos: null, porte: null, status: 'disponivel', data_entrada: null },
]);

// Auxiliar: lista de animais → lista de nomes.
const names = (list) => list.map((pet) => pet.name);
// Auxiliar: filtros padrão com algumas mudanças (spread: as mudanças sobrescrevem os padrões).
const withFilters = (changes) => ({ ...createInitialFilters(), ...changes });

// Sem filtros, todos aparecem (inclusive o idoso e o sem idade).
test('default filters show every animal, including older ones and unknown ages', () => {
  expect(names(filterPets(pets, '', createInitialFilters()))).toEqual(['Nino', 'Mel', 'Duque', 'Íris']);
});

// Filtros de porte, espécie e sexo usam os mesmos rótulos mostrados na gaveta.
test('size, species and sex filters match the labels shown in the drawer', () => {
  expect(names(filterPets(pets, '', withFilters({ size: ['Médio'] })))).toEqual(['Nino']);
  expect(names(filterPets(pets, '', withFilters({ species: ['Outro'] })))).toEqual(['Íris']);
  expect(names(filterPets(pets, '', withFilters({ sex: ['Fêmea'] })))).toEqual(['Mel']);
});

// Faixas de idade: limites corretos e animais sem idade ficam de fora.
test('age groups use real ages and leave out animals without an age', () => {
  expect(ageGroupOf(0.5)).toBe('filhote');
  expect(ageGroupOf(1)).toBe('jovem'); // 1 já não é filhote (o máximo do filhote é exclusivo)
  expect(ageGroupOf(7.9)).toBe('adulto');
  expect(ageGroupOf(16)).toBe('idoso');
  expect(ageGroupOf(null)).toBeNull();
  expect(names(filterPets(pets, '', withFilters({ ages: ['filhote'] })))).toEqual(['Mel']);
  // Duas faixas escolhidas = "jovem OU idoso".
  expect(names(filterPets(pets, '', withFilters({ ages: ['jovem', 'idoso'] })))).toEqual(['Nino', 'Duque']);
});

// Temperamento: exige TODOS os traços, ignorando acentos e maiúsculas.
test('temperament requires every chosen trait, ignoring accents and case', () => {
  expect(names(filterPets(pets, '', withFilters({ temperament: ['convive com gatos'] })))).toEqual(['Nino', 'Mel']);
  // "brincalhao" (sem acento) encontra "Brincalhão".
  expect(names(filterPets(pets, '', withFilters({ temperament: ['brincalhao', 'convive com gatos'] })))).toEqual(['Nino']);
  // Traços por frequência: "convive com gatos" aparece 2 vezes; os outros, 1 (ordem alfabética).
  expect(collectTemperaments(pets)).toEqual(['convive com gatos', 'Brincalhão', 'calma']);
});

// Cuidados, urgência e favoritos se somam (todos precisam valer).
test('care, urgency and favorites filters are cumulative', () => {
  expect(names(filterPets(pets, '', withFilters({ castrado: true, vacinado: true })))).toEqual(['Nino']);
  expect(names(filterPets(pets, '', withFilters({ urgent: true })))).toEqual(['Nino']);
  // Favoritos usa a lista de ids passada como opção.
  expect(names(filterPets(pets, '', withFilters({ favorites: true }), { favoriteIds: ['b', 'c'] }))).toEqual(['Mel', 'Duque']);
  // Sem ids favoritos, o filtro de favoritos não deixa ninguém passar.
  expect(filterPets(pets, '', withFilters({ favorites: true }))).toEqual([]);
});

// Busca: ignora acentos e maiúsculas e procura também no temperamento.
test('search ignores accents and case and also finds temperament', () => {
  expect(names(filterPets(pets, 'iris', createInitialFilters()))).toEqual(['Íris']);
  // "MEDIO" encontra "Porte médio" na linha de informações (meta).
  expect(names(filterPets(pets, 'MEDIO', createInitialFilters()))).toEqual(['Nino']);
  expect(names(filterPets(pets, 'calma', createInitialFilters()))).toEqual(['Mel']);
});

// Ordenações e garantia de que a lista original não é alterada.
test('sorts urgent first (then longest waiting), by waiting time, by arrival or by name without mutating the input', () => {
  // Cópia da lista para comparar no final.
  const original = [...pets];
  expect(names(sortPets(pets, 'urgent'))).toEqual(['Nino', 'Duque', 'Mel', 'Íris']);
  expect(names(sortPets(pets, 'waiting'))).toEqual(['Duque', 'Nino', 'Mel', 'Íris']);
  expect(names(sortPets(pets, 'recent'))).toEqual(['Mel', 'Nino', 'Duque', 'Íris']);
  // Ordem alfabética em português: "Íris" vem entre "Duque" e "Mel".
  expect(names(sortPets(pets, 'name'))).toEqual(['Duque', 'Íris', 'Mel', 'Nino']);
  // A lista original continua igual (imutabilidade).
  expect(pets).toEqual(original);
});

// Atalhos rápidos ligam/desligam um critério cada.
test('quick filters toggle one criterion each', () => {
  // Desestruturação: pega os 3 primeiros atalhos (Cães, Gatos, Urgentes).
  const [caes, gatos, urgentes] = QUICK_FILTERS;
  // "let" porque a variável será reatribuída.
  let filters = toggleFilter(createInitialFilters(), caes);
  filters = toggleFilter(filters, gatos);
  filters = toggleFilter(filters, urgentes);
  expect(filters.species).toEqual(['Cachorro', 'Gato']);
  expect(filters.urgent).toBe(true);
  // Clicar de novo em "Cães" remove só "Cachorro".
  expect(toggleFilter(filters, caes).species).toEqual(['Gato']);
});

// Cada chip remove só o seu próprio critério.
test('each active filter chip removes only its own criterion', () => {
  const filters = withFilters({ species: ['Cachorro', 'Gato'], ages: ['idoso'], temperament: ['calma'], urgent: true });
  const chips = getActiveFilterChips(filters);

  // Rótulos dos chips na ordem esperada.
  expect(chips.map((chip) => chip.label)).toEqual(['Cachorro', 'Gato', 'Idoso', 'calma', 'Urgentes']);
  expect(removeFilter(filters, chips[1]).species).toEqual(['Cachorro']);
  expect(removeFilter(filters, chips[2]).ages).toEqual([]);
  expect(removeFilter(filters, chips[3]).temperament).toEqual([]);
  expect(removeFilter(filters, chips[4]).urgent).toBe(false);
});

// "Ida e volta" pela URL: escrever e ler de novo deve devolver o mesmo estado.
test('search, filters and sort round-trip through the address', () => {
  const state = {
    query: 'nino',
    filters: withFilters({ species: ['Gato'], size: ['Médio'], sex: ['Fêmea'], ages: ['filhote'], temperament: ['calma'], urgent: true, favorites: true }),
    sort: 'waiting',
  };
  const params = writeCatalogParams(state);

  // A URL gerada (sem acentos, com códigos legíveis).
  expect(params.toString()).toBe(
    'q=nino&especie=gato&porte=medio&sexo=femea&idade=filhote&temperamento=calma&urgente=1&favoritos=1&ordem=espera',
  );
  // Lendo a URL, voltamos ao mesmo estado.
  expect(readCatalogParams(params)).toEqual(state);
  // Estado padrão gera uma URL vazia.
  expect(writeCatalogParams({ query: '', filters: createInitialFilters(), sort: 'urgent' }).toString()).toBe('');
});

// Valores desconhecidos na URL são ignorados (proteção contra links editados à mão).
test('unknown values in the address are ignored', () => {
  const { filters, sort } = readCatalogParams(new URLSearchParams('especie=dragao,gato&idade=velho&ordem=aleatoria&urgente=sim'));
  // "dragao" é ignorado; "gato" vale.
  expect(filters.species).toEqual(['Gato']);
  // "velho" não é uma faixa válida.
  expect(filters.ages).toEqual([]);
  // "sim" não é "1".
  expect(filters.urgent).toBe(false);
  // Ordem inválida → padrão.
  expect(sort).toBe('urgent');
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   Os animais de exemplo são criados uma vez. Cada teste chama uma função do
 *   catalogFilters com uma entrada conhecida e compara o resultado (geralmente os
 *   nomes, na ordem) com o esperado.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Testes unitários de funções puras e casos de borda (limites de faixa, dados ausentes).
 *   - Funções auxiliares de teste (names, withFilters) para deixar os testes legíveis.
 *   - Teste de "ida e volta" (round-trip) para serialização (URL ↔ estado).
 *   - Verificar imutabilidade (a entrada não pode mudar).
 *   - Matchers toEqual, toBe e toBeNull.
 * ============================================================================
 */
