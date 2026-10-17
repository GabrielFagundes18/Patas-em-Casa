/*
 * ============================================================================
 * ARQUIVO: animalService.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É a "camada de serviço" dos animais no painel administrativo. Reúne em um só
 *   lugar todas as chamadas HTTP que o front-end faz ao backend sobre animais
 *   (listar, buscar um, cadastrar, editar, mudar status, excluir e gerenciar fotos).
 *   Assim, as telas (componentes React) não precisam saber endereços de API nem
 *   o formato exato das respostas: elas só chamam estas funções.
 *
 * PRINCIPAIS FUNÇÕES (todas assíncronas, ou seja, devolvem uma Promise):
 *   - listAnimals(params)                → lista paginada e filtrada de animais.
 *   - createAnimal(payload)              → cadastra um animal.
 *   - updateAnimal(id, payload)          → atualiza os dados de um animal.
 *   - updateAnimalStatus(id, status, motivo) → muda só o status.
 *   - deleteAnimal(id)                   → exclui um animal.
 *   - getAnimal(id)                      → busca um animal (com a lista de fotos).
 *   - uploadAnimalPhotos(id, files)      → envia fotos.
 *   - setMainAnimalPhoto(id, photoId)    → define a foto principal.
 *   - deleteAnimalPhoto(id, photoId)     → remove uma foto.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - Importa: api/client.js → instância do axios já configurada (endereço do backend,
 *     token de login no cabeçalho e renovação automática da sessão).
 *   - É usado por:
 *       admin/animals/AnimalsPage.jsx      → listar, criar, atualizar, mudar status, excluir;
 *       admin/animals/AnimalPhotos.jsx     → buscar o animal e gerenciar as fotos;
 *       admin/stories/StoryFormDialog.jsx  → listar animais (para ligar uma história a um animal);
 *       e pelos testes (AnimalsPage.test.js, AnimalPhotos.test.js, StoriesPage.test.js),
 *       que substituem estas funções por versões falsas (mocks).
 *   - Do outro lado, quem responde é o backend, no módulo
 *     Patas-em-Casa-BackEnd/src/modules/animals (rotas /api/v1/animals...).
 *
 * FORMATO DAS RESPOSTAS DO BACKEND (importante para entender o código):
 *   O axios coloca o corpo da resposta em "response.data". O backend sempre manda
 *   o corpo no formato { data: ..., meta: ... }. Por isso aparece tanto
 *   "response.data.data": o primeiro "data" é do axios e o segundo é do backend.
 * ============================================================================
 */

// Importa o cliente HTTP configurado do projeto. "api" é uma instância do axios,
// com métodos como api.get, api.post, api.put, api.patch e api.delete.
// O caminho 'api/client' funciona sem "../../" porque o jsconfig.json usa "src" como base.
import api from 'api/client';

/*
 * FUNÇÃO: listAnimals
 * O que faz: busca no backend a lista de animais, já filtrada, ordenada e paginada.
 * Parâmetros:
 *   - params (objeto): filtros e paginação, ex.:
 *       { q: 'rex', status: 'disponivel', page: '1', pageSize: '20', sort: 'nome', order: 'asc' }
 * Retorno (Promise que resolve para um objeto):
 *   - { items: [...animais], meta: { page, pageSize, total, totalPages } }
 *   - Se o backend não mandar algum dos dois, devolve [] e {} para a tela não quebrar.
 * Onde é usada: no useEffect do AnimalsPage.jsx (carregar a tabela) e no StoryFormDialog.jsx.
 */
export async function listAnimals(params) {
  // api.get faz uma requisição HTTP GET para o endereço informado.
  // A opção { params } faz o axios transformar o objeto em "query string" na URL,
  // ex.: /api/v1/animals?q=rex&page=1. "{ params }" é atalho de "{ params: params }".
  // "await" pausa a função até a resposta chegar.
  const response = await api.get('/api/v1/animals', { params });
  // Monta um objeto mais simples para a tela usar.
  return {
    // "??" (coalescência nula) usa o valor da direita só quando o da esquerda é null ou undefined.
    // Lista de animais da página pedida (ou lista vazia, por segurança).
    items: response.data.data ?? [],
    // Informações de paginação (ou objeto vazio, por segurança).
    meta: response.data.meta ?? {},
  };
}

/*
 * FUNÇÃO: createAnimal
 * O que faz: cadastra um animal novo no backend.
 * Parâmetros:
 *   - payload (objeto): os dados do formulário (nome, especie, raca, sexo, idade_anos,
 *     porte, status, descricao, data_entrada, castrado, vacinado, temperamento...).
 * Retorno (Promise → objeto): o animal criado, como o backend o salvou (já com "id").
 * Onde é usada: em saveAnimal() do AnimalsPage.jsx, quando não há animal em edição.
 */
export async function createAnimal(payload) {
  // POST é o método HTTP usado para CRIAR algo. O payload vai no corpo da requisição em JSON.
  const response = await api.post('/api/v1/animals', payload);
  // Devolve só o animal criado (o "data" do backend), sem os detalhes da resposta HTTP.
  return response.data.data;
}

/*
 * FUNÇÃO: updateAnimal
 * O que faz: substitui os dados de um animal existente pelos dados do formulário.
 * Parâmetros:
 *   - id (number | string): identificador do animal a ser atualizado.
 *   - payload (objeto): os novos dados (mesmo formato do createAnimal).
 * Retorno (Promise → objeto): o animal já atualizado.
 * Onde é usada: em saveAnimal() do AnimalsPage.jsx, quando há um animal em edição.
 */
export async function updateAnimal(id, payload) {
  // PUT é o método HTTP usado para ATUALIZAR um registro inteiro.
  // A template string (crase + ${id}) coloca o id dentro do endereço: /api/v1/animals/7
  const response = await api.put(`/api/v1/animals/${id}`, payload);
  // Devolve o animal atualizado.
  return response.data.data;
}

/*
 * FUNÇÃO: updateAnimalStatus
 * O que faz: muda apenas o status do animal (ex.: 'disponivel' → 'adotado').
 * Parâmetros:
 *   - id (number | string): identificador do animal.
 *   - status (string): o novo status ('disponivel', 'em_processo', 'adotado', 'urgente' ou 'inativo').
 *   - motivo (string | undefined): justificativa. Algumas mudanças exigem motivo; se faltar,
 *     o backend responde com o erro de código 'MOTIVO_OBRIGATORIO'.
 * Retorno (Promise → objeto): o animal com o status novo.
 * Onde é usada: em changeStatus() do AnimalsPage.jsx (o <select> de status da tabela).
 */
export async function updateAnimalStatus(id, status, motivo) {
  // PATCH é o método HTTP usado para atualizar só PARTE de um registro.
  // "{ status, motivo }" é atalho de "{ status: status, motivo: motivo }".
  // Se motivo for undefined, o JSON enviado simplesmente não terá esse campo.
  const response = await api.patch(`/api/v1/animals/${id}/status`, { status, motivo });
  // Devolve o animal atualizado.
  return response.data.data;
}

/*
 * FUNÇÃO: deleteAnimal
 * O que faz: exclui um animal no backend.
 * Parâmetros:
 *   - id (number | string): identificador do animal a excluir.
 * Retorno (Promise → undefined): não devolve nada, porque o backend responde
 *   com o status 204 ("No Content", ou seja, deu certo e não há corpo na resposta).
 *   Se der erro, a Promise é rejeitada e quem chamou trata no "catch".
 * Onde é usada: em removeAnimal() do AnimalsPage.jsx (botão de lixeira).
 */
export async function deleteAnimal(id) {
  // DELETE é o método HTTP usado para REMOVER um registro.
  // Aqui só esperamos terminar; não há dado para devolver.
  await api.delete(`/api/v1/animals/${id}`);
}
/*
 * FUNÇÃO: getAnimal
 * O que faz: busca os dados completos de UM animal, incluindo a lista de fotos ("fotos").
 * Parâmetros:
 *   - id (number | string): identificador do animal.
 * Retorno (Promise → objeto): o animal com o campo "fotos" (lista de { id, url, principal, ordem }).
 * Onde é usada: no useEffect do AnimalPhotos.jsx, para mostrar as fotos já enviadas.
 */
export async function getAnimal(id) {
  // GET em um endereço com o id busca um único registro.
  const response = await api.get(`/api/v1/animals/${id}`);
  // Devolve o animal encontrado.
  return response.data.data;
}

/*
 * FUNÇÃO: uploadAnimalPhotos
 * O que faz: envia um ou mais arquivos de imagem para serem as fotos do animal.
 * Parâmetros:
 *   - id (number | string): identificador do animal que vai receber as fotos.
 *   - files (FileList | File[]): os arquivos escolhidos no <input type="file">.
 * Retorno (Promise → objeto): o animal atualizado, já com a nova lista de fotos.
 * Onde é usada: em handleFiles() do AnimalPhotos.jsx.
 * Por que é diferente das outras: arquivos não podem ir em JSON. Eles vão no formato
 *   "multipart/form-data", o mesmo que um formulário HTML usa para enviar arquivos.
 */
// Fotos vão como multipart (campo "fotos"); o axios monta o boundary a partir do FormData.
export async function uploadAnimalPhotos(id, files) {
  // FormData é um objeto do navegador que monta o corpo de um envio "multipart/form-data".
  const form = new FormData();
  // Array.from converte a FileList (que parece uma lista, mas não tem .forEach em todo
  // navegador) em um array de verdade. Depois, cada arquivo é adicionado com o mesmo
  // nome de campo "fotos" — é assim que se envia vários arquivos num único campo.
  Array.from(files).forEach((file) => form.append('fotos', file));
  // Envia por POST. O terceiro argumento são opções extras: aqui troca o cabeçalho
  // Content-Type (que por padrão no projeto é JSON) para multipart/form-data.
  // O "boundary" (separador entre os arquivos) é completado automaticamente pelo axios.
  const response = await api.post(`/api/v1/animals/${id}/photos`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  // Devolve o animal com a lista de fotos atualizada.
  return response.data.data;
}

/*
 * FUNÇÃO: setMainAnimalPhoto
 * O que faz: marca uma das fotos como a "principal" (a que aparece primeiro no site).
 * Parâmetros:
 *   - id (number | string): identificador do animal.
 *   - photoId (number | string): identificador da foto escolhida.
 * Retorno (Promise → objeto): o animal com as fotos atualizadas (a escolhida com principal = true).
 * Onde é usada: no botão "Usar como principal" do AnimalPhotos.jsx.
 */
export async function setMainAnimalPhoto(id, photoId) {
  // PATCH sem corpo: o próprio endereço já diz o que fazer (".../principal").
  const response = await api.patch(`/api/v1/animals/${id}/photos/${photoId}/principal`);
  // Devolve o animal atualizado.
  return response.data.data;
}

/*
 * FUNÇÃO: deleteAnimalPhoto
 * O que faz: remove uma foto do animal.
 * Parâmetros:
 *   - id (number | string): identificador do animal.
 *   - photoId (number | string): identificador da foto a remover.
 * Retorno (Promise → objeto): o animal com a lista de fotos já sem a foto removida.
 *   (Diferente do deleteAnimal, aqui o backend devolve dados, por isso há "return".)
 * Onde é usada: no botão "Remover" de cada foto no AnimalPhotos.jsx.
 */
export async function deleteAnimalPhoto(id, photoId) {
  // DELETE no endereço da foto específica.
  const response = await api.delete(`/api/v1/animals/${id}/photos/${photoId}`);
  // Devolve o animal atualizado.
  return response.data.data;
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA, DO INÍCIO AO FIM:
 *   1. Uma tela (ex.: AnimalsPage.jsx) chama uma destas funções, por exemplo listAnimals(params).
 *   2. A função usa o "api" (axios) para fazer a requisição HTTP com o método certo:
 *        GET = buscar, POST = criar, PUT = atualizar tudo, PATCH = atualizar parte, DELETE = remover.
 *   3. Antes de sair, o api/client.js coloca automaticamente o token de login no cabeçalho.
 *   4. A função espera (await) a resposta e devolve só a parte útil (response.data.data),
 *      escondendo da tela os detalhes do HTTP.
 *   5. Se o backend responder com erro, o axios "rejeita" a Promise; a função não trata o erro
 *      e ele chega até a tela, que decide o que mostrar (nos blocos try/catch dela).
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Separação de responsabilidades: "camada de serviço" (fala com a API) x componentes (mostram a tela).
 *   - API REST e os métodos HTTP: GET, POST, PUT, PATCH e DELETE; códigos de status como 201 e 204.
 *   - Axios: instâncias, response.data, opção "params" (query string) e cabeçalhos por requisição.
 *   - async/await e Promises (e como os erros "sobem" para quem chamou).
 *   - Template strings para montar endereços: `/api/v1/animals/${id}`.
 *   - Atalho de propriedades em objetos ({ status, motivo }) e o operador "??".
 *   - Envio de arquivos com FormData e multipart/form-data; Array.from com FileList.
 *   - Módulos ES: "export" nomeado (cada função) x "export default" (usado no api/client.js).
 *   - Mocks em testes: como os testes trocam estas funções por versões falsas (jest.mock).
 * ============================================================================
 */
