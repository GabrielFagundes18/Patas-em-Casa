/*
 * ============================================================================
 * ARQUIVO: AnimalFormDialog.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Janela (modal) com o FORMULÁRIO de cadastro e edição de animais no painel:
 *   nome, espécie, raça, sexo, idade, porte, status, data de entrada, foto,
 *   temperamento, descrição, castração e vacinação. Na edição, mostra também a
 *   galeria de fotos (AnimalPhotos), que salva as fotos na hora.
 *
 * PRINCIPAIS ITENS:
 *   - createForm(animal): valores iniciais do formulário (interna).
 *   - parseTraits(text): transforma o texto de temperamento em lista (interna).
 *   - AnimalFormDialog({ animal, notice, saving, onClose, onSubmit, onPhotosChanged }):
 *     o componente (exportado como padrão). Dentro dele: handleChange e handleSubmit.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useState).
 *   - admin/constants/animalOptions → listas de espécies, sexos, portes e status.
 *   - admin/shared/AdminDialog      → moldura da janela.
 *   - ./AnimalPhotos                → galeria de fotos (só na edição).
 *   - Quem usa: admin/animals/AnimalsPage.jsx (que envia os dados à API em saveAnimal).
 * ============================================================================
 */

// O quê: cadastro e edição de animal no painel.
// Como: formulário único; na edição aparece a galeria de fotos (AnimalPhotos), que salva na hora.
// Para quê: manter a ficha completa (dados, saúde, temperamento e fotos) usada pelo site.
// Hook de estado.
import { useState } from 'react';
// Opções dos campos de seleção.
import { animalSizes, animalSpecies, animalStatusMap, animalSexes } from 'admin/constants/animalOptions';
// Moldura da janela.
import AdminDialog from 'admin/shared/AdminDialog';
// Galeria de fotos.
import AnimalPhotos from './AnimalPhotos';

/*
 * FUNÇÃO: createForm (interna)
 * O que faz: monta os valores iniciais do formulário a partir do animal (edição) ou padrões (cadastro).
 * Parâmetros: animal (objeto | null) — o animal em edição, ou null para cadastro.
 * Retorno (objeto): valores dos campos (sempre strings/booleans, nunca null — campos controlados).
 * Onde é usada: na inicialização do estado "form".
 */
function createForm(animal) {
  return {
    // "?." evita erro quando animal é null; "||" usa o padrão se o valor for vazio.
    nome: animal?.nome || '',
    especie: animal?.especie || 'cachorro',
    raca: animal?.raca || '',
    sexo: animal?.sexo || 'macho',
    // "??" aqui é importante: idade 0 é válida (com "||", 0 viraria '').
    idade_anos: animal?.idade_anos ?? '',
    porte: animal?.porte || 'medio',
    status: animal?.status || 'disponivel',
    descricao: animal?.descricao || '',
    foto_url: animal?.foto_url || '',
    // Data de entrada no formato AAAA-MM-DD (o <input type="date"> usa esse formato).
    // Sem data, usa a data de hoje: toISOString() → "2026-10-16T..." e slice(0, 10) → "2026-10-16".
    data_entrada: animal?.data_entrada?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    // Boolean(...) garante true/false para as caixas de seleção.
    castrado: Boolean(animal?.castrado),
    vacinado: Boolean(animal?.vacinado),
    // Lista de traços vira texto separado por vírgula para o campo de texto.
    temperamento: (animal?.temperamento || []).join(', '),
  };
}

/*
 * FUNÇÃO: parseTraits (interna)
 * O que faz: converte o texto do campo de temperamento numa lista limpa e sem repetições.
 * Parâmetros: text (string) — ex.: "brincalhão, calmo,  , calmo".
 * Retorno (array): ex.: ['brincalhão', 'calmo'].
 * Onde é usada: no envio do formulário.
 */
// "brincalhão, calmo,  , calmo" → ['brincalhão', 'calmo'] (a API também normaliza).
function parseTraits(text) {
  // split(',') separa pela vírgula; trim tira espaços; filter(Boolean) remove vazios;
  // new Set remove repetidos; [...set] volta a ser array.
  return [...new Set(text.split(',').map((trait) => trait.trim()).filter(Boolean))];
}

/*
 * COMPONENTE: AnimalFormDialog
 * O que faz: desenha a janela com o formulário e envia os dados ao componente pai.
 * Parâmetros (props):
 *   - animal (objeto | null): animal em edição (null = cadastro).
 *   - notice (string): aviso no topo (ex.: "Rex foi cadastrado. Agora envie as fotos.").
 *   - saving (boolean): se o envio está em andamento (desabilita o botão).
 *   - onClose (função): fecha a janela.
 *   - onSubmit (função async): recebe os dados prontos para a API; lança erro se falhar.
 *   - onPhotosChanged (função | undefined): avisa o pai quando as fotos mudam (para recarregar a lista).
 * Retorno: JSX da janela.
 * Onde é usado: AnimalsPage.jsx.
 */
export default function AnimalFormDialog({ animal, notice, saving, onClose, onSubmit, onPhotosChanged }) {
  // Valores do formulário (inicialização preguiçosa: createForm roda só na primeira vez).
  const [form, setForm] = useState(() => createForm(animal));
  // Mensagem de erro do envio.
  const [error, setError] = useState('');
  // Está editando? (há um animal)
  const editing = Boolean(animal);

  /*
   * FUNÇÃO INTERNA: handleChange
   * O que faz: atualiza qualquer campo pelo "name"; caixas de seleção usam "checked".
   * Parâmetros: event (mudança em input/select/textarea).
   */
  function handleChange(event) {
    // Desestrutura o que interessa do elemento que mudou.
    const { name, value, type, checked } = event.target;
    // Checkbox → guarda true/false; outros campos → o texto digitado/escolhido.
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  /*
   * FUNÇÃO INTERNA: handleSubmit
   * O que faz: prepara os dados no formato da API e chama onSubmit; mostra erro se falhar.
   * Parâmetros: event (envio do formulário).
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      await onSubmit({
        // Copia todos os campos...
        ...form,
        // ...e ajusta alguns: idade vazia vira null; senão, número.
        idade_anos: form.idade_anos === '' ? null : Number(form.idade_anos),
        // Textos vazios viram null (o banco guarda "sem valor" em vez de texto vazio).
        raca: form.raca || null,
        sexo: form.sexo || null,
        porte: form.porte || null,
        descricao: form.descricao || null,
        foto_url: form.foto_url || null,
        // Temperamento como lista.
        temperamento: parseTraits(form.temperamento),
      });
    } catch (submitError) {
      // O pai (AnimalsPage) relança o erro; aqui mostramos a mensagem dentro da janela.
      setError(submitError?.response?.data?.error?.message || 'Não foi possível salvar o animal.');
    }
  }

  return (
    // Janela com título que muda entre cadastro e edição.
    <AdminDialog eyebrow="Cadastro de animais" id="animal-form" onClose={onClose} title={editing ? 'Editar animal' : 'Cadastrar animal'}>
      {/* Aviso (ex.: depois de cadastrar, orienta enviar as fotos). */}
      {notice ? <p className="admin-alert is-success" role="status">{notice}</p> : null}
      <form className="admin-form" onSubmit={handleSubmit}>
        {/* Grade de campos. Cada <label> envolve o texto e o campo (associação automática). */}
        <div className="admin-form-grid">
          {/* Nome (obrigatório). O asterisco é decorativo (aria-hidden); "required" já informa leitores de tela. */}
          <label>
            Nome <span aria-hidden="true" className="admin-required">*</span>
            <input maxLength="100" name="nome" onChange={handleChange} required value={form.nome} />
          </label>
          {/* Espécie (obrigatória). */}
          <label>
            Espécie <span aria-hidden="true" className="admin-required">*</span>
            <select name="especie" onChange={handleChange} required value={form.especie}>
              {animalSpecies.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          {/* Raça. */}
          <label>
            Raça
            <input maxLength="100" name="raca" onChange={handleChange} value={form.raca} />
          </label>
          {/* Sexo. */}
          <label>
            Sexo
            <select name="sexo" onChange={handleChange} value={form.sexo}>
              {animalSexes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          {/* Idade (aceita decimais, ex.: 0.5 = 6 meses). */}
          <label>
            Idade estimada (anos)
            <input min="0" max="999.9" name="idade_anos" onChange={handleChange} step="0.1" type="number" value={form.idade_anos} />
          </label>
          {/* Porte. */}
          <label>
            Porte
            <select name="porte" onChange={handleChange} value={form.porte}>
              {animalSizes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          {/* Status (lista a partir do mapa de status). */}
          <label>
            Status
            <select name="status" onChange={handleChange} value={form.status}>
              {Object.entries(animalStatusMap).map(([value, status]) => (
                <option key={value} value={value}>{status.label}</option>
              ))}
            </select>
          </label>
          {/* Data de entrada (seletor de data do navegador). */}
          <label>
            Data de entrada
            <input name="data_entrada" onChange={handleChange} type="date" value={form.data_entrada} />
          </label>
          {/* URL da foto: o texto do rótulo muda entre edição e cadastro. type="url" valida o formato. */}
          <label className="is-wide">
            {editing ? 'URL da foto principal (preenchida pela galeria abaixo)' : 'URL de uma foto (opcional; depois de cadastrar, envie as fotos)'}
            <input maxLength="2048" name="foto_url" onChange={handleChange} type="url" value={form.foto_url} />
          </label>
          {/* Temperamento separado por vírgulas, com dica ligada pelo aria-describedby. */}
          <label className="is-wide">
            Temperamento
            <input aria-describedby="animal-traits-hint" maxLength="400" name="temperamento" onChange={handleChange} placeholder="Ex.: brincalhão, calmo, convive com gatos" value={form.temperamento} />
            <small className="admin-field-hint" id="animal-traits-hint">Separe por vírgula (até 10 características).</small>
          </label>
          {/* Descrição (várias linhas). */}
          <label className="is-wide">
            Descrição
            <textarea maxLength="10000" name="descricao" onChange={handleChange} rows="3" value={form.descricao} />
          </label>
        </div>

        {/* Galeria de fotos: só na edição (o animal precisa existir para receber fotos). */}
        {editing ? (
          <AnimalPhotos
            animalId={animal.id}
            animalName={form.nome || animal.nome}
            onChanged={(updated) => {
              // A foto principal define o foto_url no servidor; o formulário acompanha para não sobrescrever.
              setForm((current) => ({ ...current, foto_url: updated.foto_url || '' }));
              // "?.()" chama a função só se ela existir.
              onPhotosChanged?.();
            }}
          />
        ) : null}

        {/* Caixas de seleção de cuidados. */}
        <div className="admin-checks">
          <label><input checked={form.castrado} name="castrado" onChange={handleChange} type="checkbox" /> Castrado</label>
          <label><input checked={form.vacinado} name="vacinado" onChange={handleChange} type="checkbox" /> Vacinado</label>
        </div>

        {/* Erro do envio. */}
        {error ? <p className="admin-alert is-error" role="alert">{error}</p> : null}

        {/* Botões: cancelar e salvar (texto muda conforme o estado). */}
        <div className="admin-dialog-actions">
          <button className="admin-button" onClick={onClose} type="button">Cancelar</button>
          <button className="admin-button is-primary" disabled={saving} type="submit">
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar animal'}
          </button>
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
 *   1. A AnimalsPage abre a janela com animal (edição) ou null (cadastro).
 *   2. createForm preenche os campos; handleChange atualiza conforme a digitação.
 *   3. Ao salvar, handleSubmit converte os valores (idade em número, vazios em null,
 *      temperamento em lista) e chama onSubmit; se falhar, mostra a mensagem.
 *   4. Na edição, a galeria (AnimalPhotos) envia/troca/remove fotos na hora e atualiza
 *      o foto_url do formulário.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Formulário controlado com um único estado e handler genérico (name/type/checked).
 *   - Diferença entre "||" e "??" (idade 0).
 *   - Converter dados do formulário para o formato da API (null x string vazia, Number).
 *   - Set para remover duplicados; split/map/filter.
 *   - Tipos de input: number (step), date, url; textarea; select.
 *   - Acessibilidade: label envolvendo campo, required, aria-describedby, aria-hidden.
 *   - Comunicação filho → pai por callbacks (onSubmit, onPhotosChanged).
 * ============================================================================
 */
