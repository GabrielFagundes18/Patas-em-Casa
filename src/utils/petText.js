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
