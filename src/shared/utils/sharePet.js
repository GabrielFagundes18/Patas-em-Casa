// O quê: monta o link público do perfil do animal (/animais/:id).
// Como: usa a origem atual; sem id, aponta para o catálogo.
// Para quê: quem recebe o link cai direto na página do animal divulgado.
export function buildPetUrl(pet) {
  return new URL(pet?.id ? `/animais/${encodeURIComponent(pet.id)}` : '/adotar', window.location.origin).toString();
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
