/*
 * ============================================================================
 * ARQUIVO: animalOptions.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Listas fixas usadas nas telas de ANIMAIS do painel: espécies, sexos, portes,
 *   status (com rótulo e cor) e o tamanho de página da listagem. Cada opção tem
 *   um "value" (o código salvo no banco/API) e um "label" (o texto mostrado).
 *
 * PRINCIPAIS ITENS:
 *   - animalSpecies, animalSexes, animalSizes: listas de { value, label }.
 *   - animalStatusMap: objeto status → { label, variant } (variant = cor do selo).
 *   - animalPageSize: quantos animais por página na tabela (20).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - Não importa nada.
 *   - Usado por: admin/animals/AnimalsPage.jsx (filtros e tabela) e
 *     admin/animals/AnimalFormDialog.jsx (formulário).
 *   - "variant" escolhe a classe .admin-badge.is-<variant> em admin/styles/admin.css.
 *   - Os códigos precisam ser os mesmos do backend (Patas-em-Casa-BackEnd/src/config/domain-values.js).
 * ============================================================================
 */

// Espécies: código salvo no banco (value) e texto exibido (label).
export const animalSpecies = [
  { value: 'cachorro', label: 'Cachorro' },
  { value: 'gato', label: 'Gato' },
  { value: 'outro', label: 'Outro' },
];

// Sexos.
export const animalSexes = [
  { value: 'macho', label: 'Macho' },
  { value: 'femea', label: 'Fêmea' },
];

// Portes.
export const animalSizes = [
  { value: 'pequeno', label: 'Pequeno' },
  { value: 'medio', label: 'Médio' },
  { value: 'grande', label: 'Grande' },
];

// Status do animal. É um OBJETO (e não uma lista) para permitir procurar direto pela chave:
// animalStatusMap['adotado'] → { label: 'Adotado', variant: 'success' }.
// "variant" define a cor do selo no painel (classe .admin-badge.is-available, .is-pending...).
export const animalStatusMap = {
  disponivel: { label: 'Disponível', variant: 'available' },
  em_processo: { label: 'Em processo', variant: 'pending' },
  adotado: { label: 'Adotado', variant: 'success' },
  urgente: { label: 'Urgente', variant: 'urgent' },
  inativo: { label: 'Inativo', variant: 'muted' },
};

// Quantos animais aparecem por página na tabela do painel.
export const animalPageSize = 20;

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO FUNCIONA:
 *   As telas importam estas listas para montar <select>, filtros e selos, e para
 *   traduzir os códigos do banco em textos amigáveis.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Listas de opções { value, label } (código x texto).
 *   - Objeto como "mapa" para consulta direta por chave.
 *   - Constantes compartilhadas entre front-end e back-end (precisam bater).
 * ============================================================================
 */
