// O quê: importa o cliente HTTP centralizado.
// Como: reutiliza a instância Axios com baseURL definida em services/api.js.
// Para quê: manter o envio do pedido desacoplado do componente de formulário.
import api from './client';

// O quê: envia uma solicitação de pré-adoção para o backend.
// Como: faz POST em /api/v1/public/adoption-requests e devolve o conteúdo de data (protocolo, status e animal).
// Para quê: registrar o pedido no banco para que a equipe possa fazer a triagem.
export async function enviarPedidoAdocao(pedido) {
  const resposta = await api.post('/api/v1/public/adoption-requests', pedido);
  return resposta.data.data;
}
