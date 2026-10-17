/*
 * ============================================================================
 * ARQUIVO: sharePet.js
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Permite COMPARTILHAR o perfil de um animal: no celular abre a janela nativa de
 *   compartilhamento (WhatsApp, Instagram...); onde isso não existe, copia o link
 *   para a área de transferência.
 *
 * PRINCIPAIS FUNÇÕES:
 *   - buildPetUrl(pet) → monta o link completo do perfil do animal.
 *   - sharePet(pet)    → compartilha (ou copia) e diz o que aconteceu.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - Não importa nada; usa APIs do navegador (window.location, navigator.share,
 *     navigator.clipboard).
 *   - Usado por: features/animal-profile/AnimalProfilePage.jsx e
 *     features/catalog/AdoptionCatalog.jsx (botões "Compartilhar").
 * ============================================================================
 */

/*
 * FUNÇÃO: buildPetUrl
 * O que faz: monta a URL pública do perfil do animal.
 * Parâmetros:
 *   - pet (objeto | null): o animal (do petMapper); usa só o campo "id".
 * Retorno (string): ex.: "https://site.org/animais/42"; sem id, "https://site.org/adotar".
 * Onde é usada: em sharePet, logo abaixo.
 */
// O quê: monta o link público do perfil do animal (/animais/:id).
// Como: usa a origem atual; sem id, aponta para o catálogo.
// Para quê: quem recebe o link cai direto na página do animal divulgado.
export function buildPetUrl(pet) {
  // new URL(caminho, base) junta um caminho com a "origem" do site atual
  // (window.location.origin = protocolo + domínio + porta, ex.: "https://patasemcasa.org").
  // Ternário: se o animal tem id → caminho do perfil; senão → catálogo.
  // encodeURIComponent protege contra caracteres especiais no id.
  // .toString() devolve a URL completa como texto.
  return new URL(pet?.id ? `/animais/${encodeURIComponent(pet.id)}` : '/adotar', window.location.origin).toString();
}

/*
 * FUNÇÃO: sharePet
 * O que faz: tenta compartilhar pelo menu nativo do aparelho; se não der, copia o link.
 * Parâmetros:
 *   - pet (objeto): o animal (do petMapper); usa "id" e "name".
 * Retorno (Promise → objeto { status, url }):
 *   - status 'shared'    → compartilhado pelo menu nativo;
 *   - status 'cancelled' → a pessoa fechou o menu sem compartilhar;
 *   - status 'copied'    → o link foi copiado para a área de transferência;
 *   - status 'failed'    → nada funcionou (a tela pode mostrar o link para copiar à mão).
 * Onde é usada: nos botões de compartilhar do perfil e do catálogo.
 */
// O quê: compartilha a ficha de um animal.
// Como: tenta a Web Share API e, se ela não existir ou falhar, copia o link para a área de transferência.
// Para quê: divulgar o animal em qualquer navegador e informar o resultado a quem chamou.
// Retorna { status, url }, com status 'shared', 'copied', 'cancelled' ou 'failed'.
export async function sharePet(pet) {
  // Monta o link do animal.
  const url = buildPetUrl(pet);

  // Verifica se o navegador tem a Web Share API (comum em celulares).
  if (typeof navigator.share === 'function') {
    try {
      // Abre o menu nativo de compartilhamento com título, texto e link.
      // "await" espera a pessoa escolher um app (ou fechar o menu).
      await navigator.share({
        title: `${pet.name} espera por um lar`,
        text: `Conheça ${pet.name} na Patas em Casa.`,
        url,
      });
      // Deu certo.
      return { status: 'shared', url };
    } catch (error) {
      // AbortError = a pessoa cancelou o menu. Não é um erro de verdade: só informamos.
      if (error?.name === 'AbortError') return { status: 'cancelled', url };
      // Qualquer outro erro: segue para o plano B (copiar o link), abaixo.
    }
  }

  // Plano B: copiar o link para a área de transferência.
  try {
    // navigator.clipboard.writeText copia o texto (pode falhar sem permissão ou fora de HTTPS).
    await navigator.clipboard.writeText(url);
    return { status: 'copied', url };
  } catch {
    // Nem compartilhar nem copiar funcionou.
    return { status: 'failed', url };
  }
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. O botão "Compartilhar" chama sharePet(pet).
 *   2. A função monta o link com buildPetUrl.
 *   3. Se o navegador tiver navigator.share, abre o menu nativo:
 *        sucesso → 'shared'; cancelado → 'cancelled'; outro erro → passa ao passo 4.
 *   4. Tenta copiar o link: sucesso → 'copied'; falha → 'failed'.
 *   5. A tela usa o "status" para mostrar a mensagem certa (ex.: "Link copiado!").
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Web Share API (navigator.share) e Clipboard API (navigator.clipboard).
 *   - Detecção de recursos do navegador ("feature detection") com typeof.
 *   - Plano de contingência ("fallback") e degradação elegante.
 *   - Objeto URL e window.location.origin.
 *   - try/catch com async/await; o erro AbortError.
 *   - Devolver um "status" em vez de lançar erro, deixando a tela decidir a mensagem.
 * ============================================================================
 */
