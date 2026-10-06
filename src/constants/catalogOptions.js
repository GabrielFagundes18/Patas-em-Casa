// O quê: define o número de cards carregados por lote no catálogo.
// Como: uma constante compartilhada evita valores mágicos em paginação e skeletons.
// Para quê: controla o volume inicial e incremental de resultados exibidos.
export const PAGE_SIZE = 8;

// O quê: lista as espécies aceitas pelo filtro do catálogo.
// Como: os textos são os mesmos rótulos gerados por mapPetFromApi.
// Para quê: mantém os valores da interface consistentes com o domínio de adoção.
export const speciesOptions = ["Cachorro", "Gato", "Outro"];

// O quê: lista os portes disponíveis para filtragem.
// Como: os textos são comparados com o porte normalizado de cada animal.
// Para quê: representa uma dimensão padronizada de compatibilidade entre pet e adotante.
export const sizeOptions = ["Pequeno", "Médio", "Grande"];

// O quê: lista os valores de sexo usados no filtro.
// Como: os textos são comparados com o sexo normalizado de cada animal.
// Para quê: oferece seleção consistente dessa característica do animal.
export const sexOptions = ["Macho", "Fêmea"];

// O quê: faixas de idade do filtro, no lugar da régua de 1 a 15 anos.
// Como: [min, max) em anos; animal sem idade cadastrada não entra em nenhuma faixa.
// Para quê: quem adota pensa em "filhote" ou "idoso", não em um número exato de anos.
export const AGE_GROUPS = [
  { value: "filhote", label: "Filhote", hint: "até 1 ano", min: 0, max: 1 },
  { value: "jovem", label: "Jovem", hint: "1 a 2 anos", min: 1, max: 3 },
  { value: "adulto", label: "Adulto", hint: "3 a 7 anos", min: 3, max: 8 },
  { value: "idoso", label: "Idoso", hint: "8 anos ou mais", min: 8, max: Infinity },
];

// O quê: ordenações do catálogo; a primeira é a padrão.
// Como: "value" é a chave usada por sortPets; "param" é o que aparece no endereço (?ordem=).
// Para quê: casos urgentes primeiro, como na Home, e uma opção para quem espera há mais tempo.
export const SORT_OPTIONS = [
  { value: "urgent", param: "urgentes", label: "Urgentes primeiro" },
  { value: "waiting", param: "espera", label: "Esperando há mais tempo" },
  { value: "recent", param: "recentes", label: "Chegaram por último" },
  { value: "name", param: "nome", label: "Nome (A-Z)" },
];
