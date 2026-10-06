// O quê: traduz os códigos da API para os rótulos exibidos na interface.
// Como: objetos de consulta; valores desconhecidos viram null (ou "Outro", no caso da espécie).
// Para quê: os filtros comparam esses rótulos diretamente, sem depender de texto montado para exibição.
const ESPECIE_LABEL = {
  cachorro: 'Cachorro',
  gato: 'Gato',
  outro: 'Outro',
};

const PORTE_LABEL = {
  pequeno: 'Pequeno',
  medio: 'Médio',
  grande: 'Grande',
};

const SEXO_LABEL = {
  macho: 'Macho',
  femea: 'Fêmea',
};

// O quê: converte a idade recebida da API em número de anos.
// Como: aceita número ou texto numérico (o PostgreSQL envia numeric como "2.0") e rejeita vazio ou negativo.
// Para quê: diferenciar idade desconhecida (null) de idade zero.
function lerIdade(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const anos = Number(valor);
  return Number.isFinite(anos) && anos >= 0 ? anos : null;
}

// O quê: escreve a idade de forma legível.
// Como: arredonda para meses e combina anos e meses com singular e plural corretos.
// Para quê: exibir "6 meses" ou "1 ano e 6 meses" em vez de números crus como 0.5 ou 1.5.
export function formatarIdade(anos) {
  if (anos === null || anos === undefined) return '';

  const totalMeses = Math.round(anos * 12);
  if (totalMeses < 1) return 'Menos de 1 mês';
  if (totalMeses < 12) return totalMeses === 1 ? '1 mês' : `${totalMeses} meses`;

  const anosInteiros = Math.floor(totalMeses / 12);
  const meses = totalMeses % 12;
  const textoAnos = anosInteiros === 1 ? '1 ano' : `${anosInteiros} anos`;
  if (meses === 0) return textoAnos;
  return `${textoAnos} e ${meses === 1 ? '1 mês' : `${meses} meses`}`;
}

// O quê: adapta um animal do contrato da API ao modelo consumido pelos componentes React.
// Como: guarda campos estruturados (espécie, porte, sexo, idade, data) e deriva textos de exibição.
// Para quê: isolar diferenças entre backend e interface e dar aos filtros valores confiáveis.
export function mapPetFromApi(petApi) {
  const species = ESPECIE_LABEL[petApi?.especie] ?? 'Outro';
  const size = PORTE_LABEL[petApi?.porte] ?? null;
  const sex = SEXO_LABEL[petApi?.sexo] ?? null;
  const ageYears = lerIdade(petApi?.idade_anos);
  const ageLabel = formatarIdade(ageYears);
  const breed = petApi?.raca?.trim() || 'SRD';
  const castrado = Boolean(petApi?.castrado);
  const vacinado = Boolean(petApi?.vacinado);
  const speciesNoun = species === 'Outro' ? 'animal' : species.toLowerCase();

  // O quê: calcula tags de sexo e cuidados básicos.
  // Como: inclui só o que é conhecido; sexo não informado não vira "Fêmea".
  // Para quê: formar uma lista limpa para cards e ficha.
  const tags = [sex, castrado ? 'Castrado' : null, vacinado ? 'Vacinado' : null].filter(Boolean);

  return {
    id: petApi?.id ?? null,
    code: petApi?.id ? String(petApi.id).slice(0, 8).toUpperCase() : 'N/A',
    name: petApi?.nome ?? 'Sem nome',
    image: petApi?.foto_url || '',
    alt: `${petApi?.nome ?? 'Pet'}, ${speciesNoun} da raça ${breed}`,
    stamp: breed,
    urgent: petApi?.status === 'urgente',
    species,
    size,
    sex,
    ageYears,
    ageLabel,
    breed,
    castrado,
    vacinado,
    entryDate: typeof petApi?.data_entrada === 'string' ? petApi.data_entrada.slice(0, 10) : null,
    meta: [species, breed, ageLabel, size ? `Porte ${size.toLowerCase()}` : '']
      .filter(Boolean)
      .join(' • '),
    tags: petApi?.tags ?? tags,
    descricao: petApi?.descricao?.trim() ?? '',
  };
}

// O quê: adapta uma coleção inteira de animais.
// Como: valida Array.isArray e aplica mapPetFromApi a cada item.
// Para quê: garantir que a camada visual sempre receba uma lista iterável.
export function mapPetsFromApi(petsApi = []) {
  if (!Array.isArray(petsApi)) return [];
  return petsApi.map(mapPetFromApi);
}
