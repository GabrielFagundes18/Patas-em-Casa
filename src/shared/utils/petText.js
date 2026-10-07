// O quê: pequenos textos que concordam com o sexo do animal ("o Nino", "a Mel", "Gata", "Castrada").
// Como: usa o sexo já traduzido por petMapper; sexo desconhecido fica no masculino genérico.
// Para quê: frases da Home sem "o Mel" ou "Vacinado" para uma fêmea.
const FEMININO = { Cachorro: 'Cachorra', Gato: 'Gata' };

function isFemale(pet) {
  return pet?.sex === 'Fêmea';
}

export function artigo(pet) {
  return isFemale(pet) ? 'a' : 'o';
}

export function especieDoAnimal(pet) {
  return isFemale(pet) ? FEMININO[pet.species] ?? pet.species : pet.species;
}

// "Castrado" → "Castrada" para fêmeas.
export function concordar(pet, palavra) {
  return isFemale(pet) ? palavra.replace(/o$/, 'a') : palavra;
}

function plural(count, singular, pluralWord) {
  return `${count} ${count === 1 ? singular : pluralWord}`;
}

// O quê: há quanto tempo o animal está na ONG, a partir da data de entrada (AAAA-MM-DD).
// Como: conta meses de calendário; menos de um mês vira dias. Sem data (ou data futura), devolve null.
// Para quê: o cartão mostrar "Esperando há 3 meses" e dar visibilidade a quem espera há mais tempo.
export function tempoDeEspera(entryDate, hoje = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(entryDate ?? '');
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const entrada = Date.UTC(year, month - 1, day);
  const atual = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const dias = Math.round((atual - entrada) / 86400000);
  if (!Number.isFinite(dias) || dias < 0) return null;

  const meses = (hoje.getFullYear() - year) * 12 + (hoje.getMonth() + 1 - month) - (hoje.getDate() < day ? 1 : 0);
  if (meses < 1) {
    if (dias === 0) return 'Chegou hoje';
    if (dias === 1) return 'Chegou ontem';
    return `Chegou há ${dias} dias`;
  }
  if (meses < 12) return `Esperando há ${plural(meses, 'mês', 'meses')}`;
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  return `Esperando há ${plural(anos, 'ano', 'anos')}${resto ? ` e ${plural(resto, 'mês', 'meses')}` : ''}`;
}
