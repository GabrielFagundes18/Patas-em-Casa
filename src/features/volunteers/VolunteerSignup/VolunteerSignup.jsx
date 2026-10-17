/*
 * ============================================================================
 * ARQUIVO: VolunteerSignup.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   Seção "Voluntariado" da página inicial, com o FORMULÁRIO de inscrição de
 *   voluntários: nome, e-mail, telefone e áreas em que a pessoa quer ajudar.
 *   Envia para a API, mostra a confirmação com o protocolo ou os erros.
 *   Tem também um "campo-isca" escondido para barrar robôs de spam.
 *
 * PRINCIPAIS ITENS:
 *   - EMPTY_FORM: valores iniciais do formulário.
 *   - readError(error): transforma o erro da API numa mensagem amigável (interna).
 *   - VolunteerSignup(): o componente (exportado como padrão).
 *       Dentro dele: handleChange, toggleArea e handleSubmit.
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useState).
 *   - features/volunteers/volunteerAreas.js → lista de áreas.
 *   - api/volunteers.js                     → enviarInscricaoVoluntario (POST /api/v1/public/volunteers).
 *   - ./VolunteerSignup.css                 → estilos do formulário.
 *   - Classes home-* de features/home/LandingPage.css.
 *   - Quem usa: features/home/LandingPage.jsx.
 *   - Testado em: features/home/LandingPage.test.js.
 * ============================================================================
 */

// O quê: inscrição de voluntário na Home (nome, e-mail, telefone e áreas de interesse).
// Como: envia para POST /api/v1/public/volunteers; a inscrição chega ao painel como "em triagem".
// O campo "website" fica escondido: pessoas não o veem, robôs o preenchem e a API recusa.
// Para quê: transformar quem não pode adotar nem doar em ajuda concreta.
// Hook de estado.
import { useState } from 'react';
// Lista de áreas de voluntariado.
import { VOLUNTEER_AREAS } from 'features/volunteers/volunteerAreas';
// Função que envia a inscrição à API.
import { enviarInscricaoVoluntario } from 'api/volunteers';
// Estilos do formulário.
import './VolunteerSignup.css';

// Valores iniciais (e de "limpeza" após o envio) do formulário.
const EMPTY_FORM = { nome: '', email: '', telefone: '', areas: [] };

/*
 * FUNÇÃO: readError (interna)
 * O que faz: converte o erro de uma requisição numa mensagem para o usuário.
 * Parâmetros:
 *   - error (erro do axios).
 * Retorno (objeto): { message: string, details: string[] }.
 *   - Sem "response" (sem internet/servidor fora): mensagem de conexão.
 *   - Com resposta: a mensagem do backend e a lista de detalhes (ex.: "E-mail inválido").
 * Onde é usada: no catch de handleSubmit.
 */
function readError(error) {
  // Sem resposta do servidor = problema de conexão.
  if (!error?.response) return { message: 'Não foi possível conectar. Verifique sua conexão e tente novamente.', details: [] };
  // O backend manda erros no formato { error: { message, details: [{ message }] } }.
  const apiError = error.response.data?.error;
  return {
    // Mensagem principal (ou uma padrão).
    message: apiError?.message || 'Não foi possível enviar a inscrição agora.',
    // Lista de detalhes: pega só o texto "message" de cada item.
    details: (apiError?.details || []).map((detail) => detail.message),
  };
}

/*
 * COMPONENTE: VolunteerSignup
 * O que faz: desenha a seção de voluntariado e controla o formulário de inscrição.
 * Parâmetros: nenhum.
 * Retorno: JSX da <section id="voluntariado">.
 * Onde é usado: LandingPage.jsx.
 */
export default function VolunteerSignup() {
  // Valores dos campos.
  const [form, setForm] = useState(EMPTY_FORM);
  // true enquanto envia (desabilita o botão).
  const [sending, setSending] = useState(false);
  // Erro a exibir ({ message, details }) ou null.
  const [error, setError] = useState(null);
  // Resposta da API após o envio com sucesso (com o protocolo), ou null.
  const [sent, setSent] = useState(null);

  /*
   * FUNÇÃO INTERNA: handleChange
   * O que faz: atualiza o campo de texto que mudou (nome, email ou telefone).
   * Parâmetros: event (evento de mudança do <input>).
   * Retorno: nada.
   * Como funciona: o atributo "name" do input diz qual campo atualizar.
   */
  function handleChange(event) {
    // Desestrutura o nome e o valor do campo que disparou o evento.
    const { name, value } = event.target;
    // Copia o formulário e troca só o campo [name].
    setForm((current) => ({ ...current, [name]: value }));
  }

  /*
   * FUNÇÃO INTERNA: toggleArea
   * O que faz: marca ou desmarca uma área de interesse.
   * Parâmetros: area (string) — o código da área (ex.: 'passeios').
   * Retorno: nada.
   */
  function toggleArea(area) {
    setForm((current) => ({
      ...current,
      // Se a área já está na lista, remove (filter); senão, adiciona no fim ([...lista, area]).
      areas: current.areas.includes(area) ? current.areas.filter((item) => item !== area) : [...current.areas, area],
    }));
  }

  /*
   * FUNÇÃO INTERNA: handleSubmit
   * O que faz: valida as áreas, lê o campo-isca, envia a inscrição e trata o resultado.
   * Parâmetros: event (evento de envio do formulário).
   * Retorno: Promise (função async), sem valor útil.
   */
  async function handleSubmit(event) {
    // Impede o recarregamento da página.
    event.preventDefault();
    // Esconde a confirmação anterior (se houver).
    setSent(null);
    // Validação no próprio navegador: pelo menos uma área precisa ser escolhida.
    if (form.areas.length === 0) {
      setError({ message: 'Escolha ao menos uma área em que você quer ajudar.', details: [] });
      return;
    }

    // Lê o campo-isca "website" diretamente do formulário (ele não está no estado).
    // new FormData(form) coleta todos os campos; .get('website') pega o valor (ou null → '').
    const website = new FormData(event.currentTarget).get('website') || '';
    // Começa o envio.
    setSending(true);
    setError(null);
    try {
      // Envia os dados, removendo espaços das pontas dos textos.
      const result = await enviarInscricaoVoluntario({
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
        areas: form.areas,
        website,
      });
      // Sucesso: guarda a resposta (para mostrar o protocolo) e limpa o formulário.
      setSent(result);
      setForm(EMPTY_FORM);
    } catch (requestError) {
      // Erro: converte para uma mensagem amigável.
      setError(readError(requestError));
    } finally {
      // Sempre: termina o estado de "enviando".
      setSending(false);
    }
  }

  return (
    // id="voluntariado": alvo dos links "/#voluntariado".
    <section id="voluntariado" className="home-section home-volunteer" aria-labelledby="volunteer-title">
      <div className="wrap home-volunteer-layout">
        {/* Coluna de texto. */}
        <div className="home-head">
          <p className="home-eyebrow">Voluntariado</p>
          <h2 id="volunteer-title" className="home-title home-title--side">Tem um tempinho? Ajude com o que você sabe fazer.</h2>
          <p className="home-lead">
            Passeios, fotos, transporte, eventos de adoção… Escolha as áreas e a equipe entra em contato para combinar.
          </p>
        </div>

        {/* Formulário. aria-labelledby usa o título da seção como nome do formulário. */}
        <form className="home-volunteer-card" onSubmit={handleSubmit} aria-labelledby="volunteer-title">
          {/* Confirmação de envio (com protocolo, se vier). role="status" anuncia a leitores de tela. */}
          {sent ? (
            <p className="home-alert is-success" role="status">
              Inscrição recebida{sent.protocolo ? ` (protocolo ${sent.protocolo})` : ''}. Obrigado! A equipe vai falar com você
              por e-mail ou telefone.
            </p>
          ) : null}

          {/* Campos de texto. Cada <label> envolve seu <input>, ligando o texto ao campo. */}
          <div className="home-volunteer-fields">
            {/* Nome: autoComplete="name" ajuda o navegador a preencher; required torna obrigatório;
                minLength/maxLength limitam o tamanho; value + onChange = campo controlado. */}
            <label className="home-field is-wide">
              Nome completo
              <input autoComplete="name" maxLength="150" minLength="2" name="nome" onChange={handleChange} required value={form.nome} />
            </label>
            {/* E-mail: type="email" faz o navegador validar o formato e mostra o teclado de e-mail no celular. */}
            <label className="home-field">
              E-mail
              <input autoComplete="email" name="email" onChange={handleChange} required type="email" value={form.email} />
            </label>
            {/* Telefone: type="tel" e inputMode="tel" mostram o teclado numérico de telefone. */}
            <label className="home-field">
              Telefone com DDD
              <input autoComplete="tel" inputMode="tel" maxLength="20" name="telefone" onChange={handleChange} placeholder="(00) 00000-0000" required type="tel" value={form.telefone} />
            </label>
          </div>

          {/* Campo-isca anti-robô: fora da tela e fora da ordem de tabulação. */}
          {/* aria-hidden esconde de leitores de tela; tabIndex={-1} tira do Tab; o CSS o posiciona fora da tela.
              Este campo NÃO é controlado pelo estado: é lido via FormData no envio. */}
          <label aria-hidden="true" className="home-volunteer-trap">
            Site
            <input autoComplete="off" name="website" tabIndex={-1} type="text" />
          </label>

          {/* Áreas de interesse (caixas de seleção). */}
          <fieldset className="home-fieldset">
            <legend>Como você quer ajudar?</legend>
            <div className="home-volunteer-areas">
              {VOLUNTEER_AREAS.map((area) => {
                // A área está marcada se seu código estiver na lista do formulário.
                const checked = form.areas.includes(area.value);
                return (
                  // "is-selected" destaca visualmente a área marcada.
                  <label key={area.value} className={checked ? 'is-selected' : ''}>
                    {/* Checkbox controlado: checked vem do estado e onChange alterna a área. */}
                    <input checked={checked} name="areas" onChange={() => toggleArea(area.value)} type="checkbox" value={area.value} />
                    {area.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Mensagem de erro (com lista de detalhes, se houver). */}
          {error ? (
            <div className="home-alert is-error" role="alert">
              {error.message}
              {/* Lista de detalhes só aparece se houver algum. */}
              {error.details.length > 0 ? <ul>{error.details.map((detail) => <li key={detail}>{detail}</li>)}</ul> : null}
            </div>
          ) : null}

          {/* Botão de envio e observação. */}
          <div className="home-volunteer-actions">
            {/* disabled enquanto envia (evita envios duplicados); o texto muda para "Enviando…". */}
            <button className="home-btn home-btn--primary" disabled={sending} type="submit">
              {sending ? 'Enviando…' : 'Quero ser voluntário'}
            </button>
            <span>A equipe responde por e-mail ou telefone.</span>
          </div>
        </form>
      </div>
    </section>
  );
}

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. A pessoa preenche nome, e-mail e telefone (handleChange atualiza o estado)
 *      e marca as áreas (toggleArea adiciona/remove da lista).
 *   2. Ao enviar, handleSubmit verifica se há ao menos uma área; se não, mostra erro.
 *   3. Lê o campo-isca "website" (vazio para pessoas) e envia tudo à API.
 *   4. Sucesso: mostra a confirmação com o protocolo e limpa o formulário.
 *      Erro: mostra a mensagem do backend (e os detalhes) ou um aviso de conexão.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Formulários controlados (value + onChange) e um handler genérico com [name].
 *   - Checkboxes com lista no estado (includes, filter, spread).
 *   - Validação no front-end (required, type="email", minLength) + validação própria.
 *   - FormData e campos não controlados.
 *   - Honeypot (campo-isca) contra spam, com aria-hidden e tabIndex={-1}.
 *   - Estados de envio: sending, error, sent; try/catch/finally.
 *   - Atributos de usabilidade: autoComplete, inputMode, placeholder.
 *   - Acessibilidade: label envolvendo input, fieldset/legend, role="alert"/"status".
 * ============================================================================
 */
