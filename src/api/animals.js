// O quê: importa o cliente HTTP centralizado.
// Como: o módulo reutiliza a instância Axios com baseURL e cabeçalhos definidos na camada de infraestrutura.
// Para quê: mantém o serviço focado no contrato de animais, sem conhecer detalhes do transporte.
import api from './client';

const PAGE_SIZE = 100;

// O quê: busca todos os animais disponíveis para adoção na API pública.
// Como: percorre as páginas de /api/v1/public/animals (100 por página) e deixa erros de rede subirem.
// Para quê: permitir que cada tela diferencie "lista vazia" de "servidor indisponível".
export async function buscarTodoAnimais({ signal } = {}) {
  const animais = [];
  let page = 1;
  let totalPages = 1;

  do {
    const resposta = await api.get('/api/v1/public/animals', {
      params: { page, pageSize: PAGE_SIZE },
      signal,
    });
    animais.push(...(resposta.data?.data ?? []));
    totalPages = resposta.data?.meta?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);

  return animais;
}

// O quê: busca o perfil público de um animal (com galeria de fotos e temperamento).
// Como: GET /api/v1/public/animals/:id; 404 (não existe) e 410 (já adotado) sobem como erro do axios.
// Para quê: alimentar a página /animais/:id, que mostra cada caso com uma mensagem própria.
export async function buscarAnimal(id, { signal } = {}) {
  const resposta = await api.get(`/api/v1/public/animals/${encodeURIComponent(id)}`, { signal });
  return resposta.data.data;
}
