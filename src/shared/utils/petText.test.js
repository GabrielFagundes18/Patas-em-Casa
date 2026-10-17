/*
 * ============================================================================
 * ARQUIVO: petText.test.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Testes automatizados do petText.js: tempo de espera do animal e
 *   concordância de gênero (artigo, espécie e adjetivos).
 *
 * PRINCIPAIS ITENS:
 *   - hoje: uma data FIXA usada como "hoje" (deixa os testes previsíveis).
 *   - 3 testes (blocos test(...)).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./petText.js → funções testadas.
 *   - Roda com "npm test" (Jest).
 * ============================================================================
 */

// Importa as funções que serão testadas.
import { artigo, concordar, especieDoAnimal, tempoDeEspera } from './petText';

// Data fixa usada como "hoje". Em JavaScript, os meses começam em 0, então 9 = outubro.
// Se usássemos a data real, o resultado dos testes mudaria a cada dia.
const hoje = new Date(2026, 9, 6); // 6 de outubro de 2026

// Teste 1: conta meses de calendário e, abaixo de 1 mês, usa dias.
test('waiting time counts calendar months and falls back to days', () => {
  // Mesmo dia → "Chegou hoje".
  expect(tempoDeEspera('2026-10-06', hoje)).toBe('Chegou hoje');
  // Um dia antes → "Chegou ontem".
  expect(tempoDeEspera('2026-10-05', hoje)).toBe('Chegou ontem');
  // 16 dias antes (menos de 1 mês).
  expect(tempoDeEspera('2026-09-20', hoje)).toBe('Chegou há 16 dias');
  // Exatamente 1 mês antes (singular "mês").
  expect(tempoDeEspera('2026-09-06', hoje)).toBe('Esperando há 1 mês');
  // De 2 de julho a 6 de outubro: 3 meses completos.
  expect(tempoDeEspera('2026-07-02', hoje)).toBe('Esperando há 3 meses');
  // Exatamente 1 ano.
  expect(tempoDeEspera('2025-10-06', hoje)).toBe('Esperando há 1 ano');
  // 2 anos e 2 meses.
  expect(tempoDeEspera('2024-08-01', hoje)).toBe('Esperando há 2 anos e 2 meses');
});

// Teste 2: sem uma data válida no passado, o tempo de espera não aparece (null).
test('waiting time is hidden without a valid past date', () => {
  // Sem data.
  expect(tempoDeEspera(null, hoje)).toBeNull();
  // Texto que não é data.
  expect(tempoDeEspera('ontem', hoje)).toBeNull();
  // Data no futuro.
  expect(tempoDeEspera('2026-12-01', hoje)).toBeNull();
});

// Teste 3: os textos concordam com o sexo do animal.
test('texts agree with the animal sex', () => {
  // Animais de exemplo já no formato do petMapper (sex e species com rótulos).
  const mel = { sex: 'Fêmea', species: 'Gato' };
  const nino = { sex: 'Macho', species: 'Cachorro' };
  // Artigo: "a" para Mel e "o" para Nino.
  expect(`${artigo(mel)} ${artigo(nino)}`).toBe('a o');
  // Espécie no feminino para fêmeas.
  expect(especieDoAnimal(mel)).toBe('Gata');
  expect(especieDoAnimal(nino)).toBe('Cachorro');
  // Adjetivo concordando: "Vacinado" → "Vacinada".
  expect(concordar(mel, 'Vacinado')).toBe('Vacinada');
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   Com uma data "hoje" fixa, cada teste chama as funções do petText e compara
 *   o texto devolvido com o esperado. Os casos cobrem dias, meses, anos, datas
 *   inválidas/futuras e a concordância de gênero.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Testes determinísticos: por que fixar a data em vez de usar new Date().
 *   - Meses começando em 0 no objeto Date do JavaScript.
 *   - Casos de borda (limites como "exatamente 1 mês" e "exatamente 1 ano").
 *   - Matchers toBe e toBeNull.
 * ============================================================================
 */
