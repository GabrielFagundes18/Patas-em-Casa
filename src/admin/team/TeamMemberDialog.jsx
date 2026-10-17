/*
 * ============================================================================
 * ARQUIVO: TeamMemberDialog.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Janela com o FORMULÁRIO de membro da equipe do painel (cadastro e edição).
 *   No cadastro, o administrador escolhe entre enviar um convite por e-mail (a
 *   pessoa cria a própria senha) ou definir uma senha inicial. Na edição, altera
 *   nome, e-mail, cargo e se o acesso está ativo.
 *   Também exporta o gerador de senhas e o campo de senha, reaproveitados por
 *   ResetPasswordDialog.jsx.
 *
 * PRINCIPAIS ITENS:
 *   - PASSWORD_CHARS: caracteres usados nas senhas geradas.
 *   - generatePassword(): gera uma senha forte (exportada).
 *   - PasswordField(...): campo de senha com botão "Gerar senha" (exportado).
 *   - TeamMemberDialog({ member, onClose, onSubmit }): o componente (exportado como padrão).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useState), lucide-react (KeyRound).
 *   - admin/constants/adminNavigation → roleLabels (cargos).
 *   - admin/shared/AdminDialog e FormError.
 *   - Quem usa: admin/team/TeamPage.jsx; PasswordField também em ./ResetPasswordDialog.jsx.
 *   - Nos testes, setupTests.js garante window.crypto.getRandomValues.
 * ============================================================================
 */

// O quê: formulário de membro da equipe (cadastro e edição).
// Como: no cadastro, escolhe entre definir a senha inicial ou enviar convite por e-mail (a pessoa cria a senha);
//       na edição, altera nome, e-mail, cargo e acesso ativo.
// Para quê: o administrador gerenciar quem acessa o painel e com qual perfil.
// Hook de estado.
import { useState } from 'react';
// Ícone de chave.
import { KeyRound } from 'lucide-react';
// Nomes dos cargos.
import { roleLabels } from 'admin/constants/adminNavigation';
// Moldura e erros.
import AdminDialog from 'admin/shared/AdminDialog';
import FormError from 'admin/shared/FormError';

// Caracteres permitidos nas senhas geradas (sem os ambíguos: 0/O, 1/l/I).
const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/*
 * FUNÇÃO: generatePassword (exportada)
 * O que faz: gera uma senha aleatória e segura de 14 caracteres, com letras e números.
 * Parâmetros: nenhum.
 * Retorno (string): a senha.
 * Detalhe: usa crypto.getRandomValues (aleatoriedade criptográfica), e não Math.random.
 *   Se por acaso a senha sair sem número ou sem letra, gera outra (recursão).
 */
// Senha forte (14 caracteres, com letras e números), sem caracteres ambíguos como 0/O e 1/l.
export function generatePassword() {
  // Preenche 14 números aleatórios de 32 bits.
  const values = window.crypto.getRandomValues(new Uint32Array(14));
  // Converte cada número num caractere: "%" (resto) escolhe uma posição válida da lista.
  // Array.from(lista, função) cria um array aplicando a função a cada item.
  const password = Array.from(values, (value) => PASSWORD_CHARS[value % PASSWORD_CHARS.length]).join('');
  // Tem pelo menos um dígito (\d) e uma letra? Senão, tenta de novo.
  return /\d/.test(password) && /[A-Za-z]/.test(password) ? password : generatePassword();
}

/*
 * COMPONENTE: PasswordField (exportado)
 * O que faz: campo de senha (visível, para a equipe copiar) com o botão "Gerar senha".
 * Parâmetros (props):
 *   - id (string): id do campo (e base do id da dica).
 *   - label (string): rótulo.
 *   - value (string) e onChange (função que recebe o novo valor).
 *   - hint (string): texto de ajuda.
 */
export function PasswordField({ id, label, value, onChange, hint }) {
  return (
    <div className="admin-field is-wide">
      {/* Rótulo ligado ao campo pelo id. */}
      <label htmlFor={id}>
        {label} <span aria-hidden="true" className="admin-required">*</span>
      </label>
      {/* Campo + botão na mesma linha. */}
      <div className="admin-input-row">
        {/* Campo de texto comum (não "password"): o administrador precisa ver para repassar a senha.
            spellCheck="false" evita sublinhado de "erro de ortografia". */}
        <input
          aria-describedby={`${id}-hint`}
          autoComplete="new-password"
          id={id}
          maxLength="72"
          minLength="10"
          onChange={(event) => onChange(event.target.value)}
          required
          spellCheck="false"
          value={value}
        />
        {/* Gera uma senha e a coloca no campo. */}
        <button className="admin-button" onClick={() => onChange(generatePassword())} type="button">
          <KeyRound aria-hidden="true" size={16} /> Gerar senha
        </button>
      </div>
      <small className="admin-field-hint" id={`${id}-hint`}>{hint}</small>
    </div>
  );
}

/*
 * COMPONENTE: TeamMemberDialog (exportado como padrão)
 * O que faz: formulário de cadastro/edição de membro.
 * Parâmetros (props):
 *   - member (objeto | null): membro em edição (null = novo).
 *   - onClose (função) e onSubmit (função async que recebe os dados).
 * Retorno: JSX da janela.
 * Onde é usado: TeamPage.jsx.
 */
export default function TeamMemberDialog({ member, onClose, onSubmit }) {
  // Editando?
  const editing = Boolean(member);
  // Valores do formulário. "acesso" só vale no cadastro: 'convite' ou 'senha'.
  const [form, setForm] = useState({
    nome: member?.nome || '',
    email: member?.email || '',
    cargo: member?.cargo || '',
    senha: '',
    ativo: member?.ativo ?? true,
    acesso: 'convite',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Atualiza o campo (checkbox usa "checked").
  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  /*
   * FUNÇÃO INTERNA: handleSubmit
   * O que faz: monta os dados e chama onSubmit.
   *   - edição: só os dados básicos;
   *   - cadastro com convite: dados + enviar_convite: true;
   *   - cadastro com senha: dados + senha.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    // Dados comuns.
    const base = { nome: form.nome.trim(), email: form.email.trim(), cargo: form.cargo, ativo: form.ativo };
    try {
      if (editing) await onSubmit(base);
      else await onSubmit(form.acesso === 'convite' ? { ...base, enviar_convite: true } : { ...base, senha: form.senha });
    } catch (submitError) {
      setError(submitError);
      setSaving(false);
    }
  }

  return (
    <AdminDialog eyebrow="Equipe e acessos" id="team-member-form" onClose={onClose} title={editing ? `Editar ${member.nome}` : 'Adicionar membro'}>
      <form onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          {/* Nome. */}
          <label className="is-wide">
            Nome completo <span aria-hidden="true" className="admin-required">*</span>
            <input autoComplete="off" maxLength="150" minLength="2" name="nome" onChange={handleChange} required value={form.nome} />
          </label>
          {/* E-mail de acesso (login). */}
          <label>
            E-mail de acesso <span aria-hidden="true" className="admin-required">*</span>
            <input autoComplete="off" maxLength="150" name="email" onChange={handleChange} required type="email" value={form.email} />
          </label>
          {/* Cargo: a primeira opção é desabilitada (obriga a escolher um cargo). */}
          <label>
            Cargo <span aria-hidden="true" className="admin-required">*</span>
            <select name="cargo" onChange={handleChange} required value={form.cargo}>
              <option disabled value="">Escolha o cargo</option>
              {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>

        {/* Só no cadastro: como a pessoa vai entrar (convite ou senha inicial). */}
        {!editing ? (
          <fieldset className="admin-fieldset">
            <legend>Como a pessoa vai entrar</legend>
            <div className="admin-choice-group">
              <label className="admin-choice">
                <input checked={form.acesso === 'convite'} name="acesso" onChange={handleChange} type="radio" value="convite" />
                Enviar convite por e-mail
              </label>
              <label className="admin-choice">
                <input checked={form.acesso === 'senha'} name="acesso" onChange={handleChange} type="radio" value="senha" />
                Definir senha inicial
              </label>
            </div>
            {/* Convite: explicação; senha: o campo com gerador. */}
            {form.acesso === 'convite' ? (
              <small className="admin-field-hint">A pessoa recebe um link (válido por 72 horas) para criar a própria senha.</small>
            ) : (
              <div className="admin-form-grid">
                <PasswordField
                  hint="Mínimo de 10 caracteres, com letras e números. Passe a senha à pessoa por um canal seguro."
                  id="team-member-password"
                  label="Senha inicial"
                  onChange={(senha) => setForm((current) => ({ ...current, senha }))}
                  value={form.senha}
                />
              </div>
            )}
          </fieldset>
        ) : null}

        {/* Acesso ativo (texto muda entre cadastro e edição). */}
        <div className="admin-checks">
          <label>
            <input checked={form.ativo} name="ativo" onChange={handleChange} type="checkbox" /> {editing ? 'Acesso ativo' : 'Acesso ativo desde já'}
          </label>
        </div>
        {/* Aviso ao desativar um membro que estava ativo. */}
        {editing && member.ativo && !form.ativo ? (
          <p className="admin-alert is-warning">Ao desativar, a pessoa sai do painel na hora em todos os dispositivos.</p>
        ) : null}

        <FormError error={error} fallback={editing ? 'Não foi possível salvar as alterações.' : 'Não foi possível adicionar o membro.'} />

        {/* Botões (texto do principal depende do modo e da forma de acesso). */}
        <div className="admin-dialog-actions">
          <button className="admin-button" onClick={onClose} type="button">Cancelar</button>
          <button className="admin-button is-primary" disabled={saving} type="submit">
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : form.acesso === 'convite' ? 'Adicionar e enviar convite' : 'Adicionar membro'}
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
 *   1. A TeamPage abre a janela para cadastrar (member null) ou editar.
 *   2. No cadastro, a pessoa escolhe convite ou senha inicial (com gerador seguro).
 *   3. Ao salvar, os dados certos para cada caso vão para onSubmit (que chama a API).
 *   4. Desativar um membro mostra o aviso de que ele sai do painel imediatamente.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Geração de senhas com aleatoriedade criptográfica (crypto.getRandomValues, Uint32Array).
 *   - Recursão para repetir até atender a uma regra.
 *   - Expressões regulares simples (\d, [A-Za-z]).
 *   - Componentes exportados para reuso (PasswordField).
 *   - Formulário com variações (cadastro x edição; convite x senha).
 *   - Convites por e-mail com prazo de validade.
 * ============================================================================
 */
