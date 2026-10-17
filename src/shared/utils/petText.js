/*
 * ============================================================================
 * ARQUIVO: petText.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Pequenas funções de TEXTO que fazem a concordância de gênero com o sexo do
 *   animal (português tem masculino/feminino!) e que calculam há quanto tempo o
 *   animal espera por um lar. Evita frases erradas como "o Mel" ou "Vacinado"
 *   para uma fêmea.
 *
 * PRINCIPAIS FUNÇÕES:
 *   - isFemale(pet)                   → (interna) true se o animal é fêmea.
 *   - artigo(pet)                     → 'a' ou 'o'.
 *   - especieDoAnimal(pet)            → 'Cachorra'/'Gata' para fêmeas.
 *   - concordar(pet, palavra)         → 'Castrado' → 'Castrada' para fêmeas.
 *   - plural(count, singular, plural) → (interna) "1 mês" / "3 meses".
 *   - tempoDeEspera(entryDate, hoje)  → "Chegou hoje", "Esperando há 3 meses"...
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - Não importa nada. Espera receber o animal JÁ convertido por shared/utils/petMapper.js
 *     (campos "sex" e "species" com rótulos como 'Fêmea' e 'Gato').
 *   - Usado por: shared/components/AnimalCard/AnimalCard.jsx,
 *     features/home/sections/Hero/Hero.jsx e
 *     features/adoption/AdoptionFormModal/AdoptionFormModal.jsx.
 *   - Testado em: shared/utils/petText.test.js.
 * ============================================================================
 */

// O quê: pequenos textos que concordam com o sexo do animal ("o Nino", "a Mel", "Gata", "Castrada").
// Como: usa o sexo já traduzido por petMapper; sexo desconhecido fica no masculino genérico.
// Para quê: frases da Home sem "o Mel" ou "Vacinado" para uma fêmea.
// Tabela com a forma feminina de cada espécie (só as que mudam).
const FEMININO = { Cachorro: 'Cachorra', Gato: 'Gata' };

/*
 * FUNÇÃO: isFemale (interna)
 * O que faz: diz se o animal é fêmea.
 * Parâmetros: pet (objeto do petMapper, com o campo "sex").
 * Retorno: true se pet.sex for 'Fêmea'; false em qualquer outro caso (inclusive desconhecido).
 * Onde é usada: pelas outras funções deste arquivo.
 */
function isFemale(pet) {
  // "?." evita erro se pet for null/undefined.
  return pet?.sex === 'Fêmea';
}

/*
 * FUNÇÃO: artigo (exportada)
 * O que faz: devolve o artigo definido certo para o animal.
 * Parâmetros: pet (objeto do petMapper).
 * Retorno: 'a' para fêmeas, 'o' para machos ou sexo desconhecido.
 * Onde é usada: em frases como "Ver perfil d[o/a] Duque" (Hero, AnimalCard, formulário de adoção).
 */
export function artigo(pet) {
  return isFemale(pet) ? 'a' : 'o';
}

/*
 * FUNÇÃO: especieDoAnimal (exportada)
 * O que faz: devolve o nome da espécie concordando com o sexo.
 * Parâmetros: pet (objeto do petMapper, com "sex" e "species").
 * Retorno: 'Cachorra' ou 'Gata' para fêmeas; para outras espécies (ou machos), a própria espécie.
 * Onde é usada: no AnimalCard.jsx.
 */
export function especieDoAnimal(pet) {
  // Se for fêmea, procura a forma feminina na tabela; se não houver ("??"), usa a espécie original.
  // Precedência: o "??" é avaliado dentro do primeiro ramo do ternário.
  return isFemale(pet) ? FEMININO[pet.species] ?? pet.species : pet.species;
}

/*
 * FUNÇÃO: concordar (exportada)
 * O que faz: troca o "o" final de uma palavra por "a" quando o animal é fêmea.
 * Parâmetros:
 *   - pet (objeto do petMapper).
 *   - palavra (string): palavra no masculino, ex.: 'Castrado', 'Vacinado'.
 * Retorno: a palavra ajustada ('Castrada') ou a original.
 * Onde é usada: no AnimalCard.jsx, para as tags de cuidados.
 */
// "Castrado" → "Castrada" para fêmeas.
export function concordar(pet, palavra) {
  // /o$/ é uma expressão regular: "o" no FIM da palavra ($ = fim do texto).
  // .replace troca essa letra por "a".
  return isFemale(pet) ? palavra.replace(/o$/, 'a') : palavra;
}

/*
 * FUNÇÃO: plural (interna)
 * O que faz: monta "número + palavra" escolhendo singular ou plural.
 * Parâmetros:
 *   - count (number): a quantidade.
 *   - singular (string): forma no singular (ex.: 'mês').
 *   - pluralWord (string): forma no plural (ex.: 'meses').
 * Retorno: ex.: '1 mês', '3 meses'.
 * Onde é usada: em tempoDeEspera.
 */
function plural(count, singular, pluralWord) {
  return `${count} ${count === 1 ? singular : pluralWord}`;
}

/*
 * FUNÇÃO: tempoDeEspera (exportada)
 * O que faz: calcula há quanto tempo o animal está na ONG e escreve isso em texto.
 * Parâmetros:
 *   - entryDate (string | null): data de entrada no formato 'AAAA-MM-DD' (ex.: '2024-03-15').
 *   - hoje (Date, padrão new Date()): a data de "hoje". Ter esse parâmetro permite que os
 *     testes usem uma data fixa, deixando o resultado previsível.
 * Retorno (string | null):
 *   - null se a data for inválida, ausente ou estiver no futuro;
 *   - 'Chegou hoje', 'Chegou ontem', 'Chegou há N dias' (menos de 1 mês);
 *   - 'Esperando há N meses' (menos de 1 ano);
 *   - 'Esperando há N anos' ou 'Esperando há N anos e M meses'.
 * Onde é usada: no AnimalCard.jsx.
 */
// O quê: há quanto tempo o animal está na ONG, a partir da data de entrada (AAAA-MM-DD).
// Como: conta meses de calendário; menos de um mês vira dias. Sem data (ou data futura), devolve null.
// Para quê: o cartão mostrar "Esperando há 3 meses" e dar visibilidade a quem espera há mais tempo.
export function tempoDeEspera(entryDate, hoje = new Date()) {
  // Expressão regular que exige exatamente o formato AAAA-MM-DD.
  //   ^ e $ = início e fim; \d{4} = 4 dígitos; ( ) = grupos que queremos capturar.
  // .exec devolve um array com o texto inteiro e os grupos, ou null se não combinar.
  // "entryDate ?? ''" evita passar null para o exec.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(entryDate ?? '');
  // Formato inválido ou data ausente → null.
  if (!match) return null;
  // match.slice(1) pega só os 3 grupos (ano, mês, dia) e .map(Number) converte em números.
  // A desestruturação [year, month, day] coloca cada valor em uma variável.
  const [year, month, day] = match.slice(1).map(Number);
  // Date.UTC devolve a data em milissegundos (no fuso UTC, para não sofrer com fuso horário).
  // Os meses em JavaScript começam em 0 (janeiro = 0), por isso "month - 1".
  const entrada = Date.UTC(year, month - 1, day);
  // "Hoje" no mesmo formato, considerando só ano/mês/dia (ignora horas).
  const atual = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  // Diferença em dias: 86400000 é o número de milissegundos em um dia (24*60*60*1000).
  const dias = Math.round((atual - entrada) / 86400000);
  // Se o cálculo não deu um número válido, ou a data é futura, devolve null.
  if (!Number.isFinite(dias) || dias < 0) return null;

  // Diferença em meses "de calendário":
  //   (diferença de anos * 12) + (diferença de meses) − 1 se o dia de hoje ainda não chegou
  //   ao dia da entrada (o mês ainda não "fechou").
  // getMonth() começa em 0, por isso o "+ 1" para comparar com "month" (que começa em 1).
  const meses = (hoje.getFullYear() - year) * 12 + (hoje.getMonth() + 1 - month) - (hoje.getDate() < day ? 1 : 0);
  // Menos de um mês: usa dias.
  if (meses < 1) {
    if (dias === 0) return 'Chegou hoje';
    if (dias === 1) return 'Chegou ontem';
    return `Chegou há ${dias} dias`;
  }
  // Menos de um ano: usa meses.
  if (meses < 12) return `Esperando há ${plural(meses, 'mês', 'meses')}`;
  // Um ano ou mais: separa anos inteiros e meses restantes.
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  // Se houver resto de meses, acrescenta " e N meses"; senão, acrescenta texto vazio.
  return `Esperando há ${plural(anos, 'ano', 'anos')}${resto ? ` e ${plural(resto, 'mês', 'meses')}` : ''}`;
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   - Os componentes recebem um animal já convertido pelo petMapper.
 *   - Para montar frases, chamam artigo/especieDoAnimal/concordar, que olham o
 *     campo "sex" e escolhem a forma masculina ou feminina.
 *   - Para o "tempo de espera", tempoDeEspera valida a data, calcula dias e meses
 *     de diferença e escolhe a frase adequada.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Funções puras (mesma entrada → mesma saída, sem efeitos colaterais) e por que são fáceis de testar.
 *   - Expressões regulares: /o$/, ^, $, \d{4}, grupos ( ) e o método .exec.
 *   - Datas em JavaScript: Date, Date.UTC, getFullYear/getMonth/getDate (mês começando em 0).
 *   - Parâmetro com valor padrão (hoje = new Date()) e injeção de dependência para testes.
 *   - Desestruturação de arrays, .slice e .map(Number).
 *   - Precedência entre ternário e "??".
 *   - Internacionalização/gramática: concordância de gênero e plural.
 * ============================================================================
 */
