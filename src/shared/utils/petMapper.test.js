/*
 * ============================================================================
 * ARQUIVO: petMapper.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Testes automatizados do petMapper.js. Conferem se a "tradução" dos animais da
 *   API para o formato da interface está correta: rótulos, idade, tags, textos
 *   derivados e tratamento de dados ausentes.
 *
 * PRINCIPAIS ITENS:
 *   - apiPet: um animal de exemplo no formato do backend.
 *   - 4 testes (blocos test(...)).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./petMapper.js → funções testadas (formatarIdade e mapPetFromApi).
 *   - Roda com "npm test" (Jest), com o setupTests.js carregado antes.
 * ============================================================================
 */

// Importa as duas funções que serão testadas.
import { formatarIdade, mapPetFromApi } from './petMapper';

// Animal de exemplo, imitando o que o backend envia.
// Repare em detalhes de propósito: idade como texto ('2.0'), descrição com espaços
// sobrando e status 'urgente' — tudo isso deve ser tratado pelo mapper.
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

// Teste 1: os campos da API viram os valores estruturados que os filtros usam.
test('maps API fields to structured values used by the filters', () => {
  // Converte o animal de exemplo.
  const pet = mapPetFromApi(apiPet);

  // expect.objectContaining confere SÓ os campos listados (o objeto pode ter outros).
  // toEqual compara o conteúdo (e não se é o mesmo objeto na memória).
  expect(pet).toEqual(expect.objectContaining({
    id: apiPet.id,
    code: '550E8400', // 8 primeiros caracteres do id, em maiúsculas
    species: 'Cachorro',
    size: 'Médio',
    sex: 'Macho',
    ageYears: 2, // '2.0' virou o número 2
    ageLabel: '2 anos',
    entryDate: '2026-08-23',
    urgent: true, // porque o status é 'urgente'
    castrado: true,
    vacinado: false,
    descricao: 'Nino adora passeios.', // espaços das pontas removidos
    meta: 'Cachorro • Vira-lata • 2 anos • Porte médio',
    tags: ['Macho', 'Castrado'], // "Vacinado" não entra porque vacinado é false
  }));
});

// Teste 2: com dados faltando, o mapper NÃO inventa informação.
test('does not invent data that the API did not send', () => {
  // Animal com quase tudo nulo.
  const pet = mapPetFromApi({ id: 'x1', nome: 'Sem dados', especie: 'outro', raca: null, sexo: null, idade_anos: null, porte: null, foto_url: null });

  // toBe compara valores simples (string, número, null...) com "===".
  expect(pet.species).toBe('Outro');
  // toBeNull confere se o valor é exatamente null.
  expect(pet.sex).toBeNull();
  expect(pet.size).toBeNull();
  expect(pet.ageYears).toBeNull();
  expect(pet.ageLabel).toBe('');
  // Sem sexo, castração ou vacina → nenhuma tag.
  expect(pet.tags).toEqual([]);
  // Raça ausente vira "SRD".
  expect(pet.meta).toBe('Outro • SRD');
  expect(pet.image).toBe('');
  // Espécie "Outro" vira "animal" no texto alternativo.
  expect(pet.alt).toBe('Sem dados, animal da raça SRD');
});

// Teste 3: se a data de entrada vier com horário (formato antigo da API), fica só a data.
test('keeps only the date part of timestamps sent by older API versions', () => {
  // "...apiPet" copia o animal de exemplo e sobrescreve só data_entrada.
  expect(mapPetFromApi({ ...apiPet, data_entrada: '2026-08-23T03:00:00.000Z' }).entryDate).toBe('2026-08-23');
});

// Teste 4: formatação da idade em meses e anos.
test('formats ages in months and years', () => {
  expect(formatarIdade(0)).toBe('Menos de 1 mês');
  expect(formatarIdade(0.5)).toBe('6 meses');
  expect(formatarIdade(1)).toBe('1 ano');
  expect(formatarIdade(1.5)).toBe('1 ano e 6 meses');
  expect(formatarIdade(2.0)).toBe('2 anos');
  // Idade desconhecida → texto vazio.
  expect(formatarIdade(null)).toBe('');
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   O Jest executa cada test(...). Cada um chama uma função do petMapper com uma
 *   entrada conhecida e compara a saída com o resultado esperado usando expect.
 *   Se algum valor for diferente, o teste falha e mostra a diferença.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Testes unitários de funções puras.
 *   - Matchers do Jest: toBe, toEqual, toBeNull, expect.objectContaining.
 *   - Diferença entre toBe (igualdade estrita) e toEqual (igualdade de conteúdo).
 *   - Testar "casos de borda" (dados ausentes, formatos antigos).
 *   - Spread de objetos para criar variações de um dado de teste.
 * ============================================================================
 */
