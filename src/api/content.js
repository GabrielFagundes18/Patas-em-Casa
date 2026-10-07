// O quê: importa o cliente HTTP centralizado.
// Como: reutiliza a instância Axios configurada em services/api.js.
// Para quê: buscar o conteúdo público da home (números, histórias e etapas) no backend.
import api from './client';

// O quê: busca os números agregados exibidos na faixa de impacto.
// Como: GET /api/v1/public/stats devolve apenas contagens, sem dados pessoais.
// Para quê: mostrar resgates, adoções e animais aguardando com os dados reais do banco.
export async function buscarNumeros({ signal } = {}) {
  const resposta = await api.get('/api/v1/public/stats', { signal });
  return resposta.data.data;
}

// O quê: busca as histórias publicadas pela equipe.
// Como: GET /api/v1/public/stories traz só histórias com publicado = true.
// Para quê: alimentar o mural de impacto da home.
export async function buscarHistorias({ signal } = {}) {
  const resposta = await api.get('/api/v1/public/stories', { params: { pageSize: 6 }, signal });
  return resposta.data.data ?? [];
}

// O quê: busca as etapas ativas do processo de adoção.
// Como: GET /api/v1/public/adoption-steps devolve ordem, título e descrição.
// Para quê: manter a seção "Como funciona" igual ao que a equipe cadastrou.
export async function buscarEtapasAdocao({ signal } = {}) {
  const resposta = await api.get('/api/v1/public/adoption-steps', { signal });
  return resposta.data.data ?? [];
}
