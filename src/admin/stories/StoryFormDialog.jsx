/*
 * ============================================================================
 * ARQUIVO: StoryFormDialog.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Janela com o FORMULÁRIO para criar ou editar uma história de adoção
 *   (depoimento): quem conta, texto, foto (URL), animal adotado (opcional) e se
 *   deve ser publicada no site.
 *
 * PRINCIPAIS ITENS:
 *   - StoryFormDialog({ story, onClose, onSubmit }): o componente (exportado como padrão).
 *       Dentro dele: efeito que carrega os animais adotados, handleChange e handleSubmit.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useEffect, useState).
 *   - admin/animals/animalService → listAnimals (animais adotados para vincular).
 *   - admin/shared/AdminDialog e FormError.
 *   - Quem usa: admin/stories/StoriesPage.jsx.
 * ============================================================================
 */

// O quê: cadastro e edição de história de adoção (depoimento).
// Como: autor, texto, foto (URL) e animal adotado opcional; "publicar no site" decide se aparece na Home.
// Para quê: mostrar finais felizes no site, só depois de revisados pela equipe.
// Hooks do React.
import { useEffect, useState } from 'react';
// Lista de animais (para o campo "Animal adotado").
import { listAnimals } from 'admin/animals/animalService';
// Moldura e erros.
import AdminDialog from 'admin/shared/AdminDialog';
import FormError from 'admin/shared/FormError';

/*
 * COMPONENTE: StoryFormDialog
 * O que faz: formulário de história (criar/editar).
 * Parâmetros (props):
 *   - story (objeto | null): história em edição (null = nova).
 *   - onClose (função) e onSubmit (função async que recebe os dados).
 * Retorno: JSX da janela.
 * Onde é usado: StoriesPage.jsx.
 */
export default function StoryFormDialog({ story, onClose, onSubmit }) {
  // Editando?
  const editing = Boolean(story);
  // Valores iniciais ("??" em publicado: false só quando não houver valor).
  const [form, setForm] = useState({
    autor_nome: story?.autor_nome || '',
    texto: story?.texto || '',
    foto_url: story?.foto_url || '',
    animal_id: story?.animal_id || '',
    publicado: story?.publicado ?? false,
  });
  // Animais adotados disponíveis para vincular.
  const [animals, setAnimals] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Animais adotados para vincular à história (opcional; sem acesso aos animais, o campo some).
  useEffect(() => {
    let active = true;
    // Busca até 100 animais adotados, em ordem alfabética.
    listAnimals({ status: 'adotado', pageSize: '100', sort: 'nome', order: 'asc' })
      // Desestrutura só "items" da resposta.
      .then(({ items }) => {
        if (active) setAnimals(items);
      })
      // Sem permissão ou erro: lista vazia (o campo não aparece).
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Atualiza o campo (checkbox usa "checked").
  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  /*
   * FUNÇÃO INTERNA: handleSubmit
   * O que faz: limpa os textos, converte vazios em null e chama onSubmit.
   */
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

  // O animal já vinculado não está na lista de adotados? (ex.: mudou de status depois)
  // Nesse caso, ele é mostrado como uma opção extra para não "sumir" do select.
  const selectedMissing = form.animal_id && !animals.some((animal) => animal.id === form.animal_id);

  return (
    <AdminDialog eyebrow="Histórias" id="story-form" onClose={onClose} title={editing ? 'Editar história' : 'Nova história'}>
      <form onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          {/* Quem conta a história (obrigatório). */}
          <label>
            Quem conta <span aria-hidden="true" className="admin-required">*</span>
            <input maxLength="150" minLength="2" name="autor_nome" onChange={handleChange} required value={form.autor_nome} />
          </label>
          {/* Animal adotado: só aparece se houver opções (ou um animal já vinculado). */}
          {animals.length > 0 || selectedMissing ? (
            <label>
              Animal adotado
              <select name="animal_id" onChange={handleChange} value={form.animal_id}>
                <option value="">Nenhum</option>
                {/* Opção extra para o animal atual que não está na lista. */}
                {selectedMissing ? <option value={form.animal_id}>{story?.animal_nome || 'Animal atual'}</option> : null}
                {animals.map((animal) => <option key={animal.id} value={animal.id}>{animal.nome}</option>)}
              </select>
            </label>
          ) : null}
          {/* Texto da história (mínimo 10 caracteres). */}
          <label className="is-wide">
            História <span aria-hidden="true" className="admin-required">*</span>
            <textarea maxLength="5000" minLength="10" name="texto" onChange={handleChange} required rows="6" value={form.texto} />
          </label>
          {/* Foto opcional (endereço de imagem). */}
          <label className="is-wide">
            URL da foto
            <input maxLength="2048" name="foto_url" onChange={handleChange} type="url" value={form.foto_url} />
          </label>
        </div>
        {/* Publicar no site? */}
        <div className="admin-checks">
          <label><input checked={form.publicado} name="publicado" onChange={handleChange} type="checkbox" /> Publicar no site</label>
        </div>
        {/* Lembrete de privacidade. */}
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

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. Ao abrir, a janela busca os animais adotados para o campo de vínculo.
 *   2. A pessoa preenche autor, texto, foto, animal e "publicar".
 *   3. Ao salvar, os dados são limpos e enviados via onSubmit (a página chama a API).
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Carregar opções de um select a partir da API (useEffect).
 *   - Esconder campos quando não há dados ou permissão.
 *   - Manter uma opção "órfã" no select para não perder o valor atual.
 *   - Array.some, operador "??" e conversão de vazios em null.
 *   - Privacidade: o que vai (e o que não vai) para o site público.
 * ============================================================================
 */
