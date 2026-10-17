/*
 * ============================================================================
 * ARQUIVO: adoptionGuide.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Guarda os TEXTOS da página "Como funciona a adoção": requisitos para adotar,
 *   documentos necessários e perguntas frequentes. Ficam separados do componente
 *   para facilitar a edição do conteúdo sem mexer no layout.
 *
 * PRINCIPAIS ITENS:
 *   - ADOPTION_REQUIREMENTS: lista de requisitos (strings).
 *   - ADOPTION_DOCUMENTS: lista de documentos (strings).
 *   - ADOPTION_FAQ: lista de perguntas e respostas ({ question, answer }).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - Não importa nada.
 *   - Usado por: features/adoption/HowAdoptionWorksPage.jsx.
 * ============================================================================
 */

// O quê: requisitos, documentos e dúvidas da página "Como funciona a adoção".
// Como: listas simples consumidas por HowAdoptionWorksPage.
// Para quê: concentrar o texto num lugar só.
// ATENÇÃO: requisitos 2 a 5 refletem o que o sistema já pede (formulário, visita/entrevista e Termo de
// Adoção). Idade mínima e documentos são os usuais para assinar o termo — a ONG deve confirmar antes de publicar.
// Requisitos para adotar (cada string vira um item de lista na página).
export const ADOPTION_REQUIREMENTS = [
  'Ter 18 anos ou mais e assumir a responsabilidade pelo animal.',
  'Ter um ambiente seguro: telas ou muros adequados, sem acesso livre à rua.',
  'Topar uma conversa (entrevista) e uma visita da equipe antes da decisão.',
  'Aceitar o acompanhamento pós-adoção, com contatos nas primeiras semanas.',
  'Assinar o Termo de Adoção Responsável na entrega do animal.',
];

// Documentos pedidos na assinatura do termo.
export const ADOPTION_DOCUMENTS = [
  'Documento oficial com foto (RG ou CNH).',
  'CPF.',
  'Comprovante de residência recente.',
];

// Perguntas frequentes: cada objeto tem a pergunta (question) e a resposta (answer).
export const ADOPTION_FAQ = [
  {
    question: 'Quanto custa adotar?',
    answer: 'A adoção não tem custo. Se quiser ajudar a cuidar dos próximos animais, você pode doar pela página de doação.',
  },
  {
    question: 'Quanto tempo leva?',
    answer: 'Depende da agenda de entrevista e visita. A equipe responde por e-mail e combina os horários com você.',
  },
  {
    question: 'Posso pedir mais de um animal?',
    answer: 'Pode, mas cada pedido é analisado separadamente, pensando no bem-estar de todos.',
  },
];

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO FUNCIONA:
 *   O arquivo só exporta listas de textos. A página "Como funciona" percorre cada
 *   lista com .map para desenhar os itens e as perguntas frequentes.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Separar conteúdo (dados/textos) da apresentação (componentes).
 *   - Arrays de strings x arrays de objetos.
 *   - Exportações nomeadas.
 * ============================================================================
 */
