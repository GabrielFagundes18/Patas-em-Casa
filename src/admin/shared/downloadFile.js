// O quê: baixa um Blob (CSV, JSON) com o nome informado.
// Como: cria um link temporário com URL.createObjectURL e o remove em seguida.
// Para quê: exportações do painel sem abrir nova aba.
export function downloadFile(content, fileName, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
