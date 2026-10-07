// O quê: galeria de fotos do animal no painel (enviar, escolher a principal, remover).
// Como: carrega as fotos do animal na API; o envio vai como multipart e a API confere o tipo pelo conteúdo.
// Para quê: o perfil público mostrar várias fotos; a principal também vira a foto dos cards do site.
import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Star, Trash2 } from 'lucide-react';
import { deleteAnimalPhoto, getAnimal, setMainAnimalPhoto, uploadAnimalPhotos } from './animalService';
import FormError from 'admin/shared/FormError';

const MAX_PHOTOS = 12;

export default function AnimalPhotos({ animalId, animalName, onChanged }) {
  const [photos, setPhotos] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let active = true;
    getAnimal(animalId)
      .then((animal) => {
        if (active) setPhotos(animal.fotos || []);
      })
      .catch((requestError) => {
        if (active) {
          setPhotos([]);
          setError(requestError);
        }
      });
    return () => {
      active = false;
    };
  }, [animalId]);

  async function run(action) {
    setBusy(true);
    setError(null);
    try {
      const animal = await action();
      setPhotos(animal.fotos || []);
      onChanged?.(animal);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleFiles(event) {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) run(() => uploadAnimalPhotos(animalId, files));
  }

  const remaining = MAX_PHOTOS - (photos?.length || 0);

  return (
    <fieldset aria-busy={busy} className="admin-fieldset admin-photos">
      <legend>Fotos</legend>
      {photos === null ? <p className="admin-field-hint">Carregando fotos...</p> : null}
      {photos?.length === 0 ? <p className="admin-field-hint">Nenhuma foto ainda. A primeira enviada vira a foto principal.</p> : null}
      {photos?.length ? (
        <ul className="admin-photo-grid">
          {photos.map((photo, index) => (
            <li className={photo.principal ? 'is-main' : ''} key={photo.id}>
              <img alt={`${animalName}, foto ${index + 1}${photo.principal ? ' (principal)' : ''}`} src={photo.url} />
              <div className="admin-photo-actions">
                {photo.principal ? (
                  <span className="admin-badge is-success">Principal</span>
                ) : (
                  <button aria-label={`Usar a foto ${index + 1} como principal`} className="admin-icon-button is-small" disabled={busy} onClick={() => run(() => setMainAnimalPhoto(animalId, photo.id))} title="Usar como principal" type="button">
                    <Star size={14} />
                  </button>
                )}
                <button aria-label={`Remover a foto ${index + 1}`} className="admin-icon-button is-small is-danger" disabled={busy} onClick={() => run(() => deleteAnimalPhoto(animalId, photo.id))} title="Remover" type="button">
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {remaining > 0 ? (
        <label className="admin-button admin-photo-upload">
          <ImagePlus aria-hidden="true" size={16} />
          {busy ? 'Enviando...' : 'Enviar fotos'}
          <input accept="image/jpeg,image/png,image/webp" className="admin-visually-hidden" disabled={busy} multiple onChange={handleFiles} ref={inputRef} type="file" />
        </label>
      ) : null}
      <small className="admin-field-hint">JPG, PNG ou WebP, até 5 MB cada. Restam {Math.max(0, remaining)} de {MAX_PHOTOS} fotos.</small>
      <FormError error={error} fallback="Não foi possível atualizar as fotos." />
    </fieldset>
  );
}
