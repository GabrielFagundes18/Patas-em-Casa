// O quê: extrai a espécie a partir do campo meta do animal.
// Como: divide a string pelo separador visual e usa o primeiro segmento, com fallback para Outro.
// Para quê: converte dados compactados da interface em um valor utilizável pelo filtro e pelos detalhes.
export function getSpecies(pet) {
  return pet.meta?.split(" • ")[0] || "Outro";
}

// O quê: extrai o porte normalizado do animal.
// Como: seleciona o último segmento de meta, remove o prefixo Porte e usa Médio quando faltam dados.
// Para quê: fornece o valor comparável às opções de filtragem.
export function getSize(pet) {
  return pet.meta?.split(" • ").at(-1)?.replace("Porte ", "") || "Médio";
}

// O quê: extrai a idade numérica do animal.
// Como: lê o terceiro segmento de meta, converte com parseFloat e substitui valores inválidos por 15.
// Para quê: permite aplicar o limite máximo de idade sem quebrar quando a API retorna informação incompleta.
export function getAge(pet) {
  const ageText = pet.meta?.split(" • ")[2] || "";
  const age = Number.parseFloat(ageText);
  return Number.isNaN(age) ? 15 : age;
}
