// O quê: define o número de cards carregados por lote no catálogo.
// Como: uma constante compartilhada evita valores mágicos em paginação e skeletons.
// Para quê: controla o volume inicial e incremental de resultados exibidos.
export const PAGE_SIZE = 8;

// O quê: lista as espécies aceitas pelo filtro do catálogo.
// Como: um array fornece uma fonte iterável para renderizar opções e comparar seleções.
// Para quê: mantém os valores da interface consistentes com o domínio de adoção.
export const speciesOptions = ["Cachorro", "Gato", "Outro"];

// O quê: lista os portes disponíveis para filtragem.
// Como: o array é consumido pelo drawer e comparado com o porte normalizado do animal.
// Para quê: representa uma dimensão padronizada de compatibilidade entre pet e adotante.
export const sizeOptions = ["Pequeno", "Médio", "Grande"];

// O quê: lista as cidades oferecidas no filtro geográfico.
// Como: o primeiro valor funciona como opção sentinela para não restringir a cidade.
// Para quê: limita a busca a localidades conhecidas sem impedir a listagem completa.
export const cityOptions = [
  "Todas as cidades",
  "São Paulo",
  "Campinas",
  "Santos",
];

// O quê: lista os valores de sexo usados nas tags e no filtro.
// Como: os textos são comparados diretamente com as tags normalizadas dos pets.
// Para quê: oferece seleção consistente dessa característica do animal.
export const sexOptions = ["Macho", "Fêmea"];
