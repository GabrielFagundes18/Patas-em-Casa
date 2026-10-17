/*
 * ============================================================================
 * ARQUIVO: volunteers.js (pasta api)
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Envia ao backend a inscrição de uma pessoa que quer ser voluntária da ONG.
 *
 * PRINCIPAIS FUNÇÕES:
 *   - enviarInscricaoVoluntario({ nome, email, telefone, areas, website }) → registra a inscrição.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - ./client.js → instância do axios configurada.
 *   - Usado por: features/volunteers/VolunteerSignup/VolunteerSignup.jsx (formulário).
 *   - No backend: rota POST /api/v1/public/volunteers.
 *   - Depois, a inscrição aparece no painel em admin/volunteers.
 * ============================================================================
 */

// Importa o cliente HTTP configurado (axios) do projeto.
import api from './client';

/*
 * FUNÇÃO: enviarInscricaoVoluntario
 * O que faz: envia os dados do formulário de voluntariado para o backend.
 * Parâmetros (um objeto, desestruturado):
 *   - nome (string): nome da pessoa.
 *   - email (string): e-mail para contato.
 *   - telefone (string): telefone para contato.
 *   - areas (array de strings): áreas em que quer ajudar.
 *   - website (string, padrão ''): campo "isca" (honeypot) contra robôs — explicado abaixo.
 * Retorno (Promise → objeto): a inscrição registrada.
 * Onde é usada: no envio do formulário VolunteerSignup.jsx.
 */
// O quê: envia a inscrição pública de voluntário.
// Como: POST /api/v1/public/volunteers com nome, e-mail, telefone, áreas e o campo-isca "website"
// (fica vazio para pessoas; robôs o preenchem e a API recusa).
// Para quê: a equipe recebe a inscrição no painel (Voluntários) como "em triagem" e entra em contato.
// "website = ''" é um valor padrão: se o campo não vier, usa texto vazio.
export async function enviarInscricaoVoluntario({ nome, email, telefone, areas, website = '' }) {
  // POST com os dados no corpo (JSON).
  const resposta = await api.post('/api/v1/public/volunteers', { nome, email, telefone, areas, website });
  // Devolve a inscrição registrada.
  return resposta.data.data;
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   O formulário de voluntariado chama esta função com os dados preenchidos →
 *   ela faz um POST para o backend → o backend confere o campo-isca "website",
 *   salva a inscrição e responde → a tela mostra a confirmação.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Honeypot (campo-isca): técnica simples contra spam de robôs em formulários.
 *   - Parâmetros com desestruturação e valor padrão.
 *   - Requisição POST com async/await.
 * ============================================================================
 */
