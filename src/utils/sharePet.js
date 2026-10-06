// O quê: monta o link público que abre a ficha de um animal no catálogo.
// Como: usa a origem atual e o parâmetro ?pet=<id>, lido pelo catálogo ao carregar.
// Para quê: permitir que quem recebe o link caia direto no perfil divulgado.
export function buildPetUrl(pet) {
  const url = new URL('/adotar', window.location.origin);
  if (pet?.id) url.searchParams.set('pet', pet.id);
  return url.toString();
}

// O quê: compartilha a ficha de um animal.
// Como: tenta a Web Share API e, se ela não existir ou falhar, copia o link para a área de transferência.
// Para quê: divulgar o animal em qualquer navegador e informar o resultado a quem chamou.
// Retorna { status, url }, com status 'shared', 'copied', 'cancelled' ou 'failed'.
export async function sharePet(pet) {
  const url = buildPetUrl(pet);

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: `${pet.name} espera por um lar`,
        text: `Conheça ${pet.name} na Patas em Casa.`,
        url,
      });
      return { status: 'shared', url };
    } catch (error) {
      if (error?.name === 'AbortError') return { status: 'cancelled', url };
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return { status: 'copied', url };
  } catch {
    return { status: 'failed', url };
  }
}
