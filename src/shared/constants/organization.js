/*
 * ============================================================================
 * ARQUIVO: organization.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Guarda os dados PÚBLICOS da ONG (nome, contato, endereço, chave Pix, CNPJ...)
 *   em um único lugar. Assim, quando algum dado mudar, basta alterar aqui e todo
 *   o site é atualizado.
 *
 * PRINCIPAIS ITENS:
 *   - ORGANIZACAO: objeto "congelado" (não pode ser modificado) com os dados da ONG.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - Não importa nada.
 *   - Usado por: shared/components/PixKey/PixKey.jsx, shared/components/layout/Footer/Footer.jsx,
 *     features/home/sections/Hero/Hero.jsx, features/home/sections/StatsStrip/StatsStrip.jsx
 *     e features/adoption/HowAdoptionWorksPage.jsx.
 * ============================================================================
 */

// O quê: dados públicos da ONG exibidos no site (doação, rodapé, páginas de ajuda).
// Como: um único objeto importado pelos componentes.
// Para quê: trocar contato, chave Pix e CNPJ em um só lugar.
// ATENÇÃO: telefone, endereço e CNPJ abaixo ainda são valores de exemplo; substitua pelos reais antes de publicar.
// Object.freeze "congela" o objeto: ninguém consegue alterar, adicionar ou remover propriedades
// dele durante a execução. É uma proteção para dados que devem ser constantes.
// (Observação: o congelamento é "raso" — o objeto interno "pix" não fica congelado.)
export const ORGANIZACAO = Object.freeze({
  // Nome da ONG, exibido em textos do site.
  nome: 'Patas em Casa',
  fundacao: 2019, // ano de início; a Home calcula os anos de atuação a partir dele
  // E-mail de contato.
  email: 'contato@patasemcasa.org',
  // Telefone de contato (valor de exemplo).
  telefone: '(11) 4000-0000',
  // Endereço (valor de exemplo).
  endereco: 'Rua das Acácias, 120 — SP',
  // Horário de atendimento.
  horario: 'Ter–Sáb: 9h às 17h',
  // Perfil do Instagram.
  instagram: '@patasemcasa',
  // Chave Pix para doações: um objeto com a chave e o tipo de chave.
  pix: { chave: 'doacoes@patasemcasa.org', tipo: 'e-mail' },
  // CNPJ da ONG (valor de exemplo).
  cnpj: '00.000.000/0001-00',
});

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   O arquivo apenas exporta um objeto constante. Os componentes fazem
 *   import { ORGANIZACAO } from 'shared/constants/organization' e leem os campos,
 *   por exemplo ORGANIZACAO.pix.chave ou ORGANIZACAO.email.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Constantes de configuração centralizadas ("única fonte da verdade").
 *   - Object.freeze e imutabilidade (congelamento raso x profundo).
 *   - Exportação nomeada (export const).
 *   - Objetos aninhados (pix dentro de ORGANIZACAO).
 * ============================================================================
 */
