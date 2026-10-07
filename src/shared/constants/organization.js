// O quê: dados públicos da ONG exibidos no site (doação, rodapé, páginas de ajuda).
// Como: um único objeto importado pelos componentes.
// Para quê: trocar contato, chave Pix e CNPJ em um só lugar.
// ATENÇÃO: telefone, endereço e CNPJ abaixo ainda são valores de exemplo; substitua pelos reais antes de publicar.
export const ORGANIZACAO = Object.freeze({
  nome: 'Patas em Casa',
  fundacao: 2019, // ano de início; a Home calcula os anos de atuação a partir dele
  email: 'contato@patasemcasa.org',
  telefone: '(11) 4000-0000',
  endereco: 'Rua das Acácias, 120 — SP',
  horario: 'Ter–Sáb: 9h às 17h',
  instagram: '@patasemcasa',
  pix: { chave: 'doacoes@patasemcasa.org', tipo: 'e-mail' },
  cnpj: '00.000.000/0001-00',
});
