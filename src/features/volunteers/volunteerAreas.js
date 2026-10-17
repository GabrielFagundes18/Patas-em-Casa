/*
 * ============================================================================
 * ARQUIVO: volunteerAreas.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Lista das ÁREAS em que um voluntário pode ajudar (passeios, fotografia,
 *   transporte...). Cada área tem um código (enviado à API) e um texto (exibido
 *   no site). Fica num arquivo separado para ser reaproveitada.
 *
 * PRINCIPAIS ITENS:
 *   - VOLUNTEER_AREAS: array de { value, label }.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - Não importa nada.
 *   - Usado por: features/volunteers/VolunteerSignup/VolunteerSignup.jsx (formulário).
 *   - Os códigos ("value") precisam ser os mesmos aceitos pelo backend
 *     (Patas-em-Casa-BackEnd/src/config/domain-values.js).
 * ============================================================================
 */

// O quê: áreas em que um voluntário pode ajudar, na ordem exibida no formulário da Home.
// Como: "value" é o código aceito pela API (domain-values.js do backend); "label" é o texto do site.
// Para quê: o formulário público enviar só códigos válidos.
// Cada item: value = código técnico (sem acento, com "_"); label = texto amigável com acentos.
export const VOLUNTEER_AREAS = [
  { value: 'passeios', label: 'Passeios' },
  { value: 'banho_e_tosa', label: 'Banho e tosa' },
  { value: 'divulgacao', label: 'Divulgação' },
  { value: 'eventos', label: 'Eventos' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'fotografia', label: 'Fotografia' },
  { value: 'socializacao', label: 'Socialização' },
  { value: 'captacao', label: 'Captação de recursos' },
  { value: 'manutencao', label: 'Manutenção' },
];

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO FUNCIONA:
 *   O formulário de voluntariado percorre esta lista com .map para desenhar uma
 *   caixa de seleção por área. Ao enviar, manda só os "value" escolhidos à API.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Separar "código" (valor técnico) de "rótulo" (texto exibido).
 *   - Manter front-end e back-end com os mesmos valores permitidos (contrato da API).
 *   - Constantes exportadas e reutilizáveis.
 * ============================================================================
 */
