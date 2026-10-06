import { artigo, concordar, especieDoAnimal, tempoDeEspera } from './petText';

const hoje = new Date(2026, 9, 6); // 6 de outubro de 2026

test('waiting time counts calendar months and falls back to days', () => {
  expect(tempoDeEspera('2026-10-06', hoje)).toBe('Chegou hoje');
  expect(tempoDeEspera('2026-10-05', hoje)).toBe('Chegou ontem');
  expect(tempoDeEspera('2026-09-20', hoje)).toBe('Chegou há 16 dias');
  expect(tempoDeEspera('2026-09-06', hoje)).toBe('Esperando há 1 mês');
  expect(tempoDeEspera('2026-07-02', hoje)).toBe('Esperando há 3 meses');
  expect(tempoDeEspera('2025-10-06', hoje)).toBe('Esperando há 1 ano');
  expect(tempoDeEspera('2024-08-01', hoje)).toBe('Esperando há 2 anos e 2 meses');
});

test('waiting time is hidden without a valid past date', () => {
  expect(tempoDeEspera(null, hoje)).toBeNull();
  expect(tempoDeEspera('ontem', hoje)).toBeNull();
  expect(tempoDeEspera('2026-12-01', hoje)).toBeNull();
});

test('texts agree with the animal sex', () => {
  const mel = { sex: 'Fêmea', species: 'Gato' };
  const nino = { sex: 'Macho', species: 'Cachorro' };
  expect(`${artigo(mel)} ${artigo(nino)}`).toBe('a o');
  expect(especieDoAnimal(mel)).toBe('Gata');
  expect(especieDoAnimal(nino)).toBe('Cachorro');
  expect(concordar(mel, 'Vacinado')).toBe('Vacinada');
});
