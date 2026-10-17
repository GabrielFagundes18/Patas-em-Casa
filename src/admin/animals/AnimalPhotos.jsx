/*
 * ============================================================================
 * ARQUIVO: AnimalPhotos.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   GALERIA DE FOTOS de um animal no painel (aparece dentro do formulário de
 *   edição). Permite enviar fotos (várias de uma vez), escolher a foto principal
 *   e remover fotos. Cada ação é salva na hora na API. Limite de 12 fotos.
 *
 * PRINCIPAIS ITENS:
 *   - MAX_PHOTOS: limite de fotos por animal (12).
 *   - AnimalPhotos({ animalId, animalName, onChanged }): o componente (exportado como padrão).
 *       Dentro dele: run (executa uma ação e atualiza a galeria) e handleFiles (envio).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useEffect, useRef, useState), lucide-react (ícones).
 *   - ./animalService → getAnimal, uploadAnimalPhotos, setMainAnimalPhoto, deleteAnimalPhoto.
 *   - admin/shared/FormError → exibição de erros da API.
 *   - Quem usa: admin/animals/AnimalFormDialog.jsx (só na edição).
 *   - Testado em: ./AnimalPhotos.test.js.
 * ============================================================================
 */

// O quê: galeria de fotos do animal no painel (enviar, escolher a principal, remover).
// Como: carrega as fotos do animal na API; o envio vai como multipart e a API confere o tipo pelo conteúdo.
// Para quê: o perfil público mostrar várias fotos; a principal também vira a foto dos cards do site.
// Hooks do React.
import { useEffect, useRef, useState } from 'react';
// Ícones: adicionar imagem, estrela e lixeira.
import { ImagePlus, Star, Trash2 } from 'lucide-react';
// Funções da API de fotos.
import { deleteAnimalPhoto, getAnimal, setMainAnimalPhoto, uploadAnimalPhotos } from './animalService';
// Exibição de erros.
import FormError from 'admin/shared/FormError';

// Limite de fotos por animal.
const MAX_PHOTOS = 12;

/*
 * COMPONENTE: AnimalPhotos
 * O que faz: carrega e mostra as fotos do animal e permite enviar, marcar como principal e remover.
 * Parâmetros (props):
 *   - animalId (string): id do animal.
 *   - animalName (string): nome (usado no texto alternativo das fotos).
 *   - onChanged (função | undefined): avisada com o animal atualizado depois de cada ação.
 * Retorno: JSX de um <fieldset> com a galeria.
 * Onde é usado: AnimalFormDialog.jsx.
 */
export default function AnimalPhotos({ animalId, animalName, onChanged }) {
  // Lista de fotos (null = ainda carregando).
  const [photos, setPhotos] = useState(null);
  // true enquanto uma ação está em andamento (desabilita os botões).
  const [busy, setBusy] = useState(false);
  // Erro da última ação (objeto de erro do axios) ou null.
  const [error, setError] = useState(null);
  // Referência ao <input type="file"> (para limpá-lo depois do envio).
  const inputRef = useRef(null);

  // Carrega as fotos ao abrir (e se o animal mudar).
  useEffect(() => {
    // Trava contra respostas depois de sair da tela.
    let active = true;
    getAnimal(animalId)
      .then((animal) => {
        // Guarda as fotos (ou lista vazia).
        if (active) setPhotos(animal.fotos || []);
      })
      .catch((requestError) => {
        if (active) {
          // Em erro, mostra a galeria vazia e o erro.
          setPhotos([]);
          setError(requestError);
        }
      });
    return () => {
      active = false;
    };
  }, [animalId]);

  /*
   * FUNÇÃO INTERNA: run
   * O que faz: executa uma ação da API (enviar, marcar principal, remover) e atualiza a galeria.
   * Parâmetros: action (função async) — deve devolver o animal atualizado (com "fotos").
   * Retorno: Promise sem valor útil.
   * Por quê: as três ações têm o mesmo "ritual" (busy, erro, atualizar, avisar o pai).
   */
  async function run(action) {
    setBusy(true);
    setError(null);
    try {
      // Executa a ação recebida.
      const animal = await action();
      // Atualiza a lista de fotos com a resposta.
      setPhotos(animal.fotos || []);
      // Avisa o formulário (para atualizar o foto_url e recarregar a lista de animais).
      onChanged?.(animal);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setBusy(false);
      // Limpa o campo de arquivos (permite escolher os mesmos arquivos de novo, se quiser).
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  /*
   * FUNÇÃO INTERNA: handleFiles
   * O que faz: envia os arquivos escolhidos no campo de upload.
   * Parâmetros: event (mudança no <input type="file">).
   */
  function handleFiles(event) {
    // event.target.files é uma FileList; Array.from converte em array.
    const files = Array.from(event.target.files || []);
    // Só envia se algum arquivo foi escolhido. A ação é passada como função para o "run".
    if (files.length > 0) run(() => uploadAnimalPhotos(animalId, files));
  }

  // Quantas fotos ainda cabem (photos pode ser null enquanto carrega → "|| 0").
  const remaining = MAX_PHOTOS - (photos?.length || 0);

  return (
    // <fieldset> agrupa a galeria; aria-busy indica processamento.
    <fieldset aria-busy={busy} className="admin-fieldset admin-photos">
      <legend>Fotos</legend>
      {/* Carregando. */}
      {photos === null ? <p className="admin-field-hint">Carregando fotos...</p> : null}
      {/* Sem fotos. */}
      {photos?.length === 0 ? <p className="admin-field-hint">Nenhuma foto ainda. A primeira enviada vira a foto principal.</p> : null}
      {/* Com fotos: grade de miniaturas. */}
      {photos?.length ? (
        <ul className="admin-photo-grid">
          {photos.map((photo, index) => (
            // A foto principal recebe a classe "is-main" (destaque no CSS).
            <li className={photo.principal ? 'is-main' : ''} key={photo.id}>
              {/* Texto alternativo com nome, número e indicação de principal. */}
              <img alt={`${animalName}, foto ${index + 1}${photo.principal ? ' (principal)' : ''}`} src={photo.url} />
              <div className="admin-photo-actions">
                {/* Principal: selo; demais: botão de estrela para tornar principal. */}
                {photo.principal ? (
                  <span className="admin-badge is-success">Principal</span>
                ) : (
                  <button aria-label={`Usar a foto ${index + 1} como principal`} className="admin-icon-button is-small" disabled={busy} onClick={() => run(() => setMainAnimalPhoto(animalId, photo.id))} title="Usar como principal" type="button">
                    <Star size={14} />
                  </button>
                )}
                {/* Remover a foto. */}
                <button aria-label={`Remover a foto ${index + 1}`} className="admin-icon-button is-small is-danger" disabled={busy} onClick={() => run(() => deleteAnimalPhoto(animalId, photo.id))} title="Remover" type="button">
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {/* Botão de envio (só se ainda couberem fotos). É um <label> que abre o <input type="file"> escondido.
          accept limita os tipos; multiple permite escolher várias. */}
      {remaining > 0 ? (
        <label className="admin-button admin-photo-upload">
          <ImagePlus aria-hidden="true" size={16} />
          {busy ? 'Enviando...' : 'Enviar fotos'}
          <input accept="image/jpeg,image/png,image/webp" className="admin-visually-hidden" disabled={busy} multiple onChange={handleFiles} ref={inputRef} type="file" />
        </label>
      ) : null}
      {/* Regras e quantas fotos restam (Math.max evita número negativo). */}
      <small className="admin-field-hint">JPG, PNG ou WebP, até 5 MB cada. Restam {Math.max(0, remaining)} de {MAX_PHOTOS} fotos.</small>
      {/* Erro da última ação (se houver). */}
      <FormError error={error} fallback="Não foi possível atualizar as fotos." />
    </fieldset>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. Ao abrir, busca o animal (getAnimal) e mostra as fotos.
 *   2. Enviar: o <input type="file"> dispara handleFiles → run(uploadAnimalPhotos).
 *   3. Estrela: run(setMainAnimalPhoto); lixeira: run(deleteAnimalPhoto).
 *   4. Cada ação devolve o animal atualizado; a galeria se atualiza e o formulário é avisado.
 *   5. Erros aparecem pelo FormError; os botões ficam desabilitados enquanto "busy".
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Upload de arquivos: <input type="file">, accept, multiple, FileList e FormData (no service).
 *   - Funções de ordem superior (run recebe uma função "action").
 *   - Estado null para "carregando" x [] para "vazio".
 *   - useRef para limpar um input de arquivo.
 *   - Acessibilidade: fieldset/legend, alt descritivo, aria-label em botões de ícone, aria-busy.
 * ============================================================================
 */
