import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { animalSizes, animalSpecies, animalStatusMap, animalSexes } from '../constants/animalOptions';

function createForm(animal) {
  return {
    nome: animal?.nome || '',
    especie: animal?.especie || 'cachorro',
    raca: animal?.raca || '',
    sexo: animal?.sexo || 'macho',
    idade_anos: animal?.idade_anos ?? '',
    porte: animal?.porte || 'medio',
    status: animal?.status || 'disponivel',
    descricao: animal?.descricao || '',
    foto_url: animal?.foto_url || '',
    data_entrada: animal?.data_entrada?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    castrado: Boolean(animal?.castrado),
    vacinado: Boolean(animal?.vacinado),
  };
}

export default function AnimalFormDialog({ animal, saving, onClose, onSubmit }) {
  const [form, setForm] = useState(() => createForm(animal));
  const [error, setError] = useState('');
  const dialogRef = useRef(null);
  const editing = Boolean(animal);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      await onSubmit({
        ...form,
        idade_anos: form.idade_anos === '' ? null : Number(form.idade_anos),
        raca: form.raca || null,
        sexo: form.sexo || null,
        porte: form.porte || null,
        descricao: form.descricao || null,
        foto_url: form.foto_url || null,
      });
    } catch (submitError) {
      setError(submitError?.response?.data?.error?.message || 'Não foi possível salvar o animal.');
    }
  }

  return (
    <dialog
      aria-labelledby="animal-form-title"
      className="admin-dialog"
      onCancel={onClose}
      ref={dialogRef}
    >
      <div className="admin-dialog-header">
        <div>
          <p className="admin-eyebrow">Cadastro de animais</p>
          <h2 id="animal-form-title">{editing ? 'Editar animal' : 'Cadastrar animal'}</h2>
        </div>
        <button aria-label="Fechar formulário" className="admin-icon-button" onClick={onClose} type="button">
          <X size={19} />
        </button>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <label>
            Nome <span aria-hidden="true" className="admin-required">*</span>
            <input maxLength="100" name="nome" onChange={handleChange} required value={form.nome} />
          </label>
          <label>
            Espécie <span aria-hidden="true" className="admin-required">*</span>
            <select name="especie" onChange={handleChange} required value={form.especie}>
              {animalSpecies.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            Raça
            <input maxLength="100" name="raca" onChange={handleChange} value={form.raca} />
          </label>
          <label>
            Sexo
            <select name="sexo" onChange={handleChange} value={form.sexo}>
              {animalSexes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            Idade estimada (anos)
            <input min="0" max="999.9" name="idade_anos" onChange={handleChange} step="0.1" type="number" value={form.idade_anos} />
          </label>
          <label>
            Porte
            <select name="porte" onChange={handleChange} value={form.porte}>
              {animalSizes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            Status
            <select name="status" onChange={handleChange} value={form.status}>
              {Object.entries(animalStatusMap).map(([value, status]) => (
                <option key={value} value={value}>{status.label}</option>
              ))}
            </select>
          </label>
          <label>
            Data de entrada
            <input name="data_entrada" onChange={handleChange} type="date" value={form.data_entrada} />
          </label>
          <label className="is-wide">
            URL da foto principal
            <input maxLength="2048" name="foto_url" onChange={handleChange} type="url" value={form.foto_url} />
          </label>
          <label className="is-wide">
            Descrição
            <textarea maxLength="10000" name="descricao" onChange={handleChange} rows="3" value={form.descricao} />
          </label>
        </div>

        <div className="admin-checks">
          <label><input checked={form.castrado} name="castrado" onChange={handleChange} type="checkbox" /> Castrado</label>
          <label><input checked={form.vacinado} name="vacinado" onChange={handleChange} type="checkbox" /> Vacinado</label>
        </div>

        {error ? <p className="admin-alert is-error" role="alert">{error}</p> : null}

        <div className="admin-dialog-actions">
          <button className="admin-button" onClick={onClose} type="button">Cancelar</button>
          <button className="admin-button is-primary" disabled={saving} type="submit">
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar animal'}
          </button>
        </div>
      </form>
    </dialog>
  );
}