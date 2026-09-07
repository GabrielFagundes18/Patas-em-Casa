export function getSpecies(pet) {
  return pet.meta?.split(" • ")[0] || "Outro";
}

export function getSize(pet) {
  return pet.meta?.split(" • ").at(-1)?.replace("Porte ", "") || "Médio";
}

export function getAge(pet) {
  const ageText = pet.meta?.split(" • ")[2] || "";
  const age = Number.parseFloat(ageText);
  return Number.isNaN(age) ? 15 : age;
}
