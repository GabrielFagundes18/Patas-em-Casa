// O quê: define o número de cards carregados por lote no catálogo.
// Como: uma constante compartilhada evita valores mágicos em paginação e skeletons.
// Para quê: controla o volume inicial e incremental de resultados exibidos.
export const PAGE_SIZE = 8;

// O quê: define o maior valor do controle de idade.
// Como: o slider vai de 1 até este valor; no máximo, o filtro de idade fica desligado.
// Para quê: não esconder animais mais velhos quando o usuário não escolheu um limite.
export const MAX_AGE_FILTER = 15;

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
