/*
 * ============================================================================
 * ARQUIVO: petMapper.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   "Tradutor" entre o formato de animal que vem do BACKEND (campos em português,
 *   códigos como 'cachorro', 'medio', 'femea') e o formato que os COMPONENTES do
 *   site usam (campos em inglês, rótulos prontos como 'Cachorro', 'Médio', 'Fêmea',
 *   textos de idade, tags, galeria de fotos...).
 *   Isso isola as telas de mudanças na API: se o backend mudar um campo, só este
 *   arquivo precisa ser ajustado.
 *
 * PRINCIPAIS FUNÇÕES:
 *   - lerIdade(valor)           → (interna) converte a idade da API em número ou null.
 *   - formatarIdade(anos)       → texto amigável: "6 meses", "1 ano e 6 meses"...
 *   - mapPetFromApi(petApi)     → converte UM animal da API para o formato da interface.
 *   - mapPetsFromApi(petsApi)   → converte uma LISTA de animais.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - Não importa nada.
 *   - Usado por: shared/hooks/useAvailableAnimals.js (catálogo e home) e
 *     features/animal-profile/AnimalProfilePage.jsx (perfil).
 *   - Testado em: shared/utils/petMapper.test.js.
 * ============================================================================
 */

// O quê: traduz os códigos da API para os rótulos exibidos na interface.
// Como: objetos de consulta; valores desconhecidos viram null (ou "Outro", no caso da espécie).
// Para quê: os filtros comparam esses rótulos diretamente, sem depender de texto montado para exibição.
// Tabela de tradução da espécie: código da API → rótulo exibido.
const ESPECIE_LABEL = {
  cachorro: 'Cachorro',
  gato: 'Gato',
  outro: 'Outro',
};

// Tabela de tradução do porte.
const PORTE_LABEL = {
  pequeno: 'Pequeno',
  medio: 'Médio',
  grande: 'Grande',
};

// Tabela de tradução do sexo.
const SEXO_LABEL = {
  macho: 'Macho',
  femea: 'Fêmea',
};

/*
 * FUNÇÃO: lerIdade (interna)
 * O que faz: transforma a idade recebida da API em número de anos confiável.
 * Parâmetros:
 *   - valor (number | string | null | undefined): a idade como veio da API (ex.: 2, "2.0", null).
 * Retorno: número de anos (ex.: 0.5, 2) ou null se a idade for desconhecida ou inválida.
 * Onde é usada: dentro de mapPetFromApi.
 */
// O quê: converte a idade recebida da API em número de anos.
// Como: aceita número ou texto numérico (o PostgreSQL envia numeric como "2.0") e rejeita vazio ou negativo.
// Para quê: diferenciar idade desconhecida (null) de idade zero.
function lerIdade(valor) {
  // Valor vazio → idade desconhecida.
  if (valor === null || valor === undefined || valor === '') return null;
  // Converte para número ("2.0" → 2; "abc" → NaN).
  const anos = Number(valor);
  // Number.isFinite rejeita NaN e Infinity. Só aceitamos números válidos e não negativos.
  return Number.isFinite(anos) && anos >= 0 ? anos : null;
}

/*
 * FUNÇÃO: formatarIdade (exportada)
 * O que faz: escreve a idade em anos e meses, com singular e plural corretos.
 * Parâmetros:
 *   - anos (number | null | undefined): idade em anos, podendo ser decimal (1.5 = 1 ano e 6 meses).
 * Retorno (string): ex.: '' (desconhecida), 'Menos de 1 mês', '1 mês', '6 meses',
 *   '1 ano', '2 anos', '1 ano e 6 meses'.
 * Onde é usada: em mapPetFromApi (campo ageLabel) e nos testes.
 */
// O quê: escreve a idade de forma legível.
// Como: arredonda para meses e combina anos e meses com singular e plural corretos.
// Para quê: exibir "6 meses" ou "1 ano e 6 meses" em vez de números crus como 0.5 ou 1.5.
export function formatarIdade(anos) {
  // Idade desconhecida → texto vazio (a tela simplesmente não mostra).
  if (anos === null || anos === undefined) return '';

  // Converte anos em meses e arredonda (1.5 anos → 18 meses).
  const totalMeses = Math.round(anos * 12);
  // Menos de um mês.
  if (totalMeses < 1) return 'Menos de 1 mês';
  // Menos de um ano: mostra só meses (singular para 1).
  if (totalMeses < 12) return totalMeses === 1 ? '1 mês' : `${totalMeses} meses`;

  // Math.floor arredonda para baixo: 18 meses → 1 ano inteiro.
  const anosInteiros = Math.floor(totalMeses / 12);
  // "%" é o resto da divisão: 18 % 12 = 6 meses que sobram.
  const meses = totalMeses % 12;
  // Texto dos anos com singular/plural.
  const textoAnos = anosInteiros === 1 ? '1 ano' : `${anosInteiros} anos`;
  // Se não sobrar mês, mostra só os anos.
  if (meses === 0) return textoAnos;
  // Senão, junta: "1 ano e 6 meses" (há um ternário dentro da template string).
  return `${textoAnos} e ${meses === 1 ? '1 mês' : `${meses} meses`}`;
}

/*
 * FUNÇÃO: mapPetFromApi (exportada)
 * O que faz: converte um animal no formato da API para o formato usado pelos componentes.
 * Parâmetros:
 *   - petApi (objeto | null | undefined): o animal como veio do backend
 *     (id, nome, especie, raca, sexo, idade_anos, porte, status, foto_url, fotos,
 *      castrado, vacinado, data_entrada, descricao, temperamento...).
 * Retorno (objeto): o animal "traduzido" (id, code, name, image, alt, species, size,
 *   sex, ageYears, ageLabel, breed, tags, photos...). Nunca lança erro, mesmo com
 *   dados faltando: usa valores padrão.
 * Onde é usada: no hook useAvailableAnimals (via mapPetsFromApi) e na AnimalProfilePage.
 */
// O quê: adapta um animal do contrato da API ao modelo consumido pelos componentes React.
// Como: guarda campos estruturados (espécie, porte, sexo, idade, data) e deriva textos de exibição.
// Para quê: isolar diferenças entre backend e interface e dar aos filtros valores confiáveis.
export function mapPetFromApi(petApi) {
  // Rótulo da espécie. "?." evita erro se petApi for null; "??" usa 'Outro' se o código for desconhecido.
  const species = ESPECIE_LABEL[petApi?.especie] ?? 'Outro';
  // Rótulo do porte (ou null se desconhecido).
  const size = PORTE_LABEL[petApi?.porte] ?? null;
  // Rótulo do sexo (ou null se desconhecido).
  const sex = SEXO_LABEL[petApi?.sexo] ?? null;
  // Idade em anos (número) ou null.
  const ageYears = lerIdade(petApi?.idade_anos);
  // Idade em texto amigável.
  const ageLabel = formatarIdade(ageYears);
  // Raça sem espaços nas pontas; se vazia, usa "SRD" (Sem Raça Definida).
  const breed = petApi?.raca?.trim() || 'SRD';
  // Boolean(...) converte qualquer valor em true/false (null/undefined viram false).
  const castrado = Boolean(petApi?.castrado);
  const vacinado = Boolean(petApi?.vacinado);
  // Substantivo usado no texto alternativo da foto: "cachorro", "gato" ou "animal".
  const speciesNoun = species === 'Outro' ? 'animal' : species.toLowerCase();

  // O quê: calcula tags de sexo e cuidados básicos.
  // Como: inclui só o que é conhecido; sexo não informado não vira "Fêmea".
  // Para quê: formar uma lista limpa para cards e ficha.
  // .filter(Boolean) remove os valores "falsos" (null), sobrando só as tags válidas.
  const tags = [sex, castrado ? 'Castrado' : null, vacinado ? 'Vacinado' : null].filter(Boolean);

  // Monta e devolve o objeto no formato da interface.
  return {
    // Identificador do animal (ou null).
    id: petApi?.id ?? null,
    // Código curto para exibição: os 8 primeiros caracteres do id, em maiúsculas.
    // String(...) garante texto; .slice(0, 8) corta; .toUpperCase() deixa maiúsculo.
    code: petApi?.id ? String(petApi.id).slice(0, 8).toUpperCase() : 'N/A',
    // Nome (ou um texto padrão).
    name: petApi?.nome ?? 'Sem nome',
    // URL da foto principal (ou texto vazio).
    image: petApi?.foto_url || '',
    // Texto alternativo da imagem (lido por leitores de tela), ex.: "Nino, cachorro da raça SRD".
    alt: `${petApi?.nome ?? 'Pet'}, ${speciesNoun} da raça ${breed}`,
    // "Carimbo" exibido no cartão (a raça).
    stamp: breed,
    // Indica se o caso é urgente (o status da API é 'urgente').
    urgent: petApi?.status === 'urgente',
    // Campos estruturados (usados pelos filtros do catálogo).
    // "species," é atalho de "species: species".
    species,
    size,
    sex,
    ageYears,
    ageLabel,
    breed,
    castrado,
    vacinado,
    // Data de entrada no formato AAAA-MM-DD (os 10 primeiros caracteres), ou null.
    // "typeof ... === 'string'" garante que só cortamos se for texto.
    entryDate: typeof petApi?.data_entrada === 'string' ? petApi.data_entrada.slice(0, 10) : null,
    // Linha de resumo, ex.: "Cachorro • SRD • 2 anos • Porte médio".
    // Monta uma lista, remove os vazios e junta com " • ".
    meta: [species, breed, ageLabel, size ? `Porte ${size.toLowerCase()}` : '']
      .filter(Boolean)
      .join(' • '),
    // Usa as tags vindas da API, se existirem; senão, as calculadas acima.
    tags: petApi?.tags ?? tags,
    // Descrição sem espaços nas pontas (ou texto vazio).
    descricao: petApi?.descricao?.trim() ?? '',
    // Lista de traços de temperamento. Array.isArray confere se é mesmo uma lista.
    temperament: Array.isArray(petApi?.temperamento) ? petApi.temperamento : [],
    // Galeria: a foto principal vem primeiro (a API já ordena); sem galeria, usa a foto do cadastro.
    // Ternário encadeado: 1) se há lista de fotos não vazia → converte cada foto para { id, url };
    //                     2) senão, se há foto_url → galeria com uma única foto;
    //                     3) senão → galeria vazia.
    photos: Array.isArray(petApi?.fotos) && petApi.fotos.length > 0
      ? petApi.fotos.map((foto) => ({ id: foto.id, url: foto.url }))
      : petApi?.foto_url ? [{ id: 'principal', url: petApi.foto_url }] : [],
  };
}

/*
 * FUNÇÃO: mapPetsFromApi (exportada)
 * O que faz: converte uma lista inteira de animais da API.
 * Parâmetros:
 *   - petsApi (array, padrão []): lista de animais no formato da API.
 * Retorno (array): lista de animais no formato da interface. Se não receber uma lista,
 *   devolve [] (evita erros na tela).
 * Onde é usada: no hook useAvailableAnimals.
 */
// O quê: adapta uma coleção inteira de animais.
// Como: valida Array.isArray e aplica mapPetFromApi a cada item.
// Para quê: garantir que a camada visual sempre receba uma lista iterável.
export function mapPetsFromApi(petsApi = []) {
  // Se não for uma lista (ex.: null ou objeto), devolve lista vazia.
  if (!Array.isArray(petsApi)) return [];
  // .map aplica mapPetFromApi em cada animal e devolve a nova lista.
  // Passar "mapPetFromApi" diretamente equivale a (pet) => mapPetFromApi(pet).
  // (Detalhe: o .map também passa o índice como 2º argumento, mas mapPetFromApi o ignora.)
  return petsApi.map(mapPetFromApi);
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. Um hook ou página recebe animais da API (ex.: { especie: 'gato', idade_anos: '1.5' }).
 *   2. Chama mapPetsFromApi (lista) ou mapPetFromApi (um animal).
 *   3. Cada campo é traduzido com as tabelas *_LABEL, a idade é validada (lerIdade)
 *      e formatada (formatarIdade), e textos derivados são montados (alt, meta, tags).
 *   4. O componente recebe um objeto padronizado, pronto para exibir e filtrar.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Padrão "Mapper"/"Adapter": separar o formato da API do formato da interface.
 *   - Objetos como tabelas de consulta (lookup tables).
 *   - "?.", "??" e "||" — e a diferença entre "??" (só null/undefined) e "||" (qualquer valor falso).
 *   - Number, Number.isFinite, Math.round, Math.floor e o operador de resto "%".
 *   - Template strings, inclusive aninhadas.
 *   - Array.isArray, .map, .filter(Boolean), .join.
 *   - Ternários encadeados.
 *   - Acessibilidade: texto alternativo (alt) de imagens.
 * ============================================================================
 */
