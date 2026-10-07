import api from './client';

// O quê: envia a inscrição pública de voluntário.
// Como: POST /api/v1/public/volunteers com nome, e-mail, telefone, áreas e o campo-isca "website"
// (fica vazio para pessoas; robôs o preenchem e a API recusa).
// Para quê: a equipe recebe a inscrição no painel (Voluntários) como "em triagem" e entra em contato.
export async function enviarInscricaoVoluntario({ nome, email, telefone, areas, website = '' }) {
  const resposta = await api.post('/api/v1/public/volunteers', { nome, email, telefone, areas, website });
  return resposta.data.data;
}
