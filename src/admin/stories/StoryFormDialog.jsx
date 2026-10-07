// O quê: cadastro e edição de história de adoção (depoimento).
// Como: autor, texto, foto (URL) e animal adotado opcional; "publicar no site" decide se aparece na Home.
// Para quê: mostrar finais felizes no site, só depois de revisados pela equipe.
import { useEffect, useState } from 'react';
import { listAnimals } from 'admin/animals/animalService';
import AdminDialog from 'admin/shared/AdminDialog';
import FormError from 'admin/shared/FormError';

export default function StoryFormDialog({ story, onClose, onSubmit }) {
  const editing = Boolean(story);
  const [form, setForm] = useState({
    autor_nome: story?.autor_nome || '',
    texto: story?.texto || '',
    foto_url: story?.foto_url || '',
    animal_id: story?.animal_id || '',
    publicado: story?.publicado ?? false,
  });
  const [animals, setAnimals] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Animais adotados para vincular à história (opcional; sem acesso aos animais, o campo some).
  useEffect(() => {
    let active = true;
    listAnimals({ status: 'adotado', pageSize: '100', sort: 'nome', order: 'asc' })
      .then(({ items }) => {
        if (active) setAnimals(items);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        autor_nome: form.autor_nome.trim(),
        texto: form.texto.trim(),
        foto_url: form.foto_url.trim() || null,
        animal_id: form.animal_id || null,
        publicado: form.publicado,
      });
    } catch (submitError) {
      setError(submitError);
      setSaving(false);
    }
  }

  const selectedMissing = form.animal_id && !animals.some((animal) => animal.id === form.animal_id);

  return (
    <AdminDialog eyebrow="Histórias" id="story-form" onClose={onClose} title={editing ? 'Editar história' : 'Nova história'}>
      <form onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <label>
            Quem conta <span aria-hidden="true" className="admin-required">*</span>
            <input maxLength="150" minLength="2" name="autor_nome" onChange={handleChange} required value={form.autor_nome} />
          </label>
          {animals.length > 0 || selectedMissing ? (
            <label>
              Animal adotado
              <select name="animal_id" onChange={handleChange} value={form.animal_id}>
                <option value="">Nenhum</option>
                {selectedMissing ? <option value={form.animal_id}>{story?.animal_nome || 'Animal atual'}</option> : null}
                {animals.map((animal) => <option key={animal.id} value={animal.id}>{animal.nome}</option>)}
              </select>
            </label>
          ) : null}
          <label className="is-wide">
            História <span aria-hidden="true" className="admin-required">*</span>
            <textarea maxLength="5000" minLength="10" name="texto" onChange={handleChange} required rows="6" value={form.texto} />
          </label>
          <label className="is-wide">
            URL da foto
            <input maxLength="2048" name="foto_url" onChange={handleChange} type="url" value={form.foto_url} />
          </label>
        </div>
        <div className="admin-checks">
          <label><input checked={form.publicado} name="publicado" onChange={handleChange} type="checkbox" /> Publicar no site</label>
        </div>
        <small className="admin-field-hint">O site mostra só o nome de quem conta, o texto e a foto; nenhum contato do adotante.</small>
        <FormError error={error} fallback="Não foi possível salvar a história." />
        <div className="admin-dialog-actions">
          <button className="admin-button" onClick={onClose} type="button">Cancelar</button>
          <button className="admin-button is-primary" disabled={saving} type="submit">{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar história'}</button>
        </div>
      </form>
    </AdminDialog>
  );
}
