/*
 * ============================================================================
 * ARQUIVO: downloadFile.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Função que faz o navegador BAIXAR um arquivo gerado pelo próprio código
 *   (ex.: uma planilha CSV de doações ou um JSON de dados de um adotante), sem
 *   abrir uma nova aba.
 *
 * PRINCIPAIS FUNÇÕES:
 *   - downloadFile(content, fileName, type): baixa o conteúdo com o nome informado.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - Não importa nada; usa APIs do navegador (Blob, URL.createObjectURL, document).
 *   - Usado pelas telas do painel que exportam dados (ex.: doações, voluntários,
 *     adotantes — exportação LGPD).
 * ============================================================================
 */

/*
 * FUNÇÃO: downloadFile
 * O que faz: transforma o conteúdo num arquivo e dispara o download.
 * Parâmetros:
 *   - content (Blob | string): o conteúdo. Se já for um Blob (ex.: resposta binária da API), é usado direto.
 *   - fileName (string): nome do arquivo baixado (ex.: 'doacoes.csv').
 *   - type (string): tipo do conteúdo (MIME), ex.: 'text/csv' ou 'application/json'.
 * Retorno: nada.
 * Onde é usada: botões "Exportar" do painel.
 */
// O quê: baixa um Blob (CSV, JSON) com o nome informado.
// Como: cria um link temporário com URL.createObjectURL e o remove em seguida.
// Para quê: exportações do painel sem abrir nova aba.
export function downloadFile(content, fileName, type) {
  // Blob = "bloco de dados" que representa um arquivo na memória do navegador.
  // instanceof verifica se content já é um Blob; se não for, cria um a partir do texto.
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  // Cria um endereço temporário (blob:...) que aponta para esse arquivo na memória.
  const url = URL.createObjectURL(blob);
  // Cria um link <a> invisível (não é colocado na página).
  const link = document.createElement('a');
  // O link aponta para o arquivo em memória...
  link.href = url;
  // ...e o atributo "download" faz o navegador baixar em vez de abrir, com este nome.
  link.download = fileName;
  // Simula o clique no link: começa o download.
  link.click();
  // Libera a memória do endereço temporário (não é mais necessário).
  URL.revokeObjectURL(url);
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   conteúdo → Blob → URL temporária → link <a download> → clique simulado →
 *   download → libera a URL.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Blob e tipos MIME.
 *   - URL.createObjectURL / URL.revokeObjectURL (e vazamento de memória).
 *   - Atributo download do <a>.
 *   - Criar elementos pelo JavaScript (document.createElement) e disparar eventos (click()).
 *   - Operador instanceof.
 * ============================================================================
 */
