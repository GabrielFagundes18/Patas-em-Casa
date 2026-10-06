import { formatarIdade, mapPetFromApi } from './petMapper';

const apiPet = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  nome: 'Nino',
  especie: 'cachorro',
  raca: 'Vira-lata',
  sexo: 'macho',
  idade_anos: '2.0',
  porte: 'medio',
  status: 'urgente',
  descricao: '  Nino adora passeios.  ',
  foto_url: 'https://example.com/nino.jpg',
  data_entrada: '2026-08-23',
  castrado: true,
  vacinado: false,
};

test('maps API fields to structured values used by the filters', () => {
  const pet = mapPetFromApi(apiPet);

  expect(pet).toEqual(expect.objectContaining({
    id: apiPet.id,
    code: '550E8400',
    species: 'Cachorro',
    size: 'Médio',
    sex: 'Macho',
    ageYears: 2,
    ageLabel: '2 anos',
    entryDate: '2026-08-23',
    urgent: true,
    castrado: true,
    vacinado: false,
    descricao: 'Nino adora passeios.',
    meta: 'Cachorro • Vira-lata • 2 anos • Porte médio',
    tags: ['Macho', 'Castrado'],
  }));
});

test('does not invent data that the API did not send', () => {
  const pet = mapPetFromApi({ id: 'x1', nome: 'Sem dados', especie: 'outro', raca: null, sexo: null, idade_anos: null, porte: null, foto_url: null });

  expect(pet.species).toBe('Outro');
  expect(pet.sex).toBeNull();
  expect(pet.size).toBeNull();
  expect(pet.ageYears).toBeNull();
  expect(pet.ageLabel).toBe('');
  expect(pet.tags).toEqual([]);
  expect(pet.meta).toBe('Outro • SRD');
  expect(pet.image).toBe('');
  expect(pet.alt).toBe('Sem dados, animal da raça SRD');
});

test('keeps only the date part of timestamps sent by older API versions', () => {
  expect(mapPetFromApi({ ...apiPet, data_entrada: '2026-08-23T03:00:00.000Z' }).entryDate).toBe('2026-08-23');
});

test('formats ages in months and years', () => {
  expect(formatarIdade(0)).toBe('Menos de 1 mês');
  expect(formatarIdade(0.5)).toBe('6 meses');
  expect(formatarIdade(1)).toBe('1 ano');
  expect(formatarIdade(1.5)).toBe('1 ano e 6 meses');
  expect(formatarIdade(2.0)).toBe('2 anos');
  expect(formatarIdade(null)).toBe('');
});
