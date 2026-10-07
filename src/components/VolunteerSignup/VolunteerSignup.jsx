// O quê: inscrição de voluntário na Home (nome, e-mail, telefone e áreas de interesse).
// Como: envia para POST /api/v1/public/volunteers; a inscrição chega ao painel como "em triagem".
// O campo "website" fica escondido: pessoas não o veem, robôs o preenchem e a API recusa.
// Para quê: transformar quem não pode adotar nem doar em ajuda concreta.
import { useState } from 'react';
import { VOLUNTEER_AREAS } from '../../constants/voluntariado';
import { enviarInscricaoVoluntario } from '../../api/volunteers';
import './VolunteerSignup.css';

const EMPTY_FORM = { nome: '', email: '', telefone: '', areas: [] };

function readError(error) {
  if (!error?.response) return { message: 'Não foi possível conectar. Verifique sua conexão e tente novamente.', details: [] };
  const apiError = error.response.data?.error;
  return {
    message: apiError?.message || 'Não foi possível enviar a inscrição agora.',
    details: (apiError?.details || []).map((detail) => detail.message),
  };
}

export default function VolunteerSignup() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggleArea(area) {
    setForm((current) => ({
      ...current,
      areas: current.areas.includes(area) ? current.areas.filter((item) => item !== area) : [...current.areas, area],
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSent(null);
    if (form.areas.length === 0) {
      setError({ message: 'Escolha ao menos uma área em que você quer ajudar.', details: [] });
      return;
    }

    const website = new FormData(event.currentTarget).get('website') || '';
    setSending(true);
    setError(null);
    try {
      const result = await enviarInscricaoVoluntario({
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
        areas: form.areas,
        website,
      });
      setSent(result);
      setForm(EMPTY_FORM);
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="voluntariado" className="home-section home-volunteer" aria-labelledby="volunteer-title">
      <div className="wrap home-volunteer-layout">
        <div className="home-head">
          <p className="home-eyebrow">Voluntariado</p>
          <h2 id="volunteer-title" className="home-title home-title--side">Tem um tempinho? Ajude com o que você sabe fazer.</h2>
          <p className="home-lead">
            Passeios, fotos, transporte, eventos de adoção… Escolha as áreas e a equipe entra em contato para combinar.
          </p>
        </div>

        <form className="home-volunteer-card" onSubmit={handleSubmit} aria-labelledby="volunteer-title">
          {sent ? (
            <p className="home-alert is-success" role="status">
              Inscrição recebida{sent.protocolo ? ` (protocolo ${sent.protocolo})` : ''}. Obrigado! A equipe vai falar com você
              por e-mail ou telefone.
            </p>
          ) : null}

          <div className="home-volunteer-fields">
            <label className="home-field is-wide">
              Nome completo
              <input autoComplete="name" maxLength="150" minLength="2" name="nome" onChange={handleChange} required value={form.nome} />
            </label>
            <label className="home-field">
              E-mail
              <input autoComplete="email" name="email" onChange={handleChange} required type="email" value={form.email} />
            </label>
            <label className="home-field">
              Telefone com DDD
              <input autoComplete="tel" inputMode="tel" maxLength="20" name="telefone" onChange={handleChange} placeholder="(00) 00000-0000" required type="tel" value={form.telefone} />
            </label>
          </div>

          {/* Campo-isca anti-robô: fora da tela e fora da ordem de tabulação. */}
          <label aria-hidden="true" className="home-volunteer-trap">
            Site
            <input autoComplete="off" name="website" tabIndex={-1} type="text" />
          </label>

          <fieldset className="home-fieldset">
            <legend>Como você quer ajudar?</legend>
            <div className="home-volunteer-areas">
              {VOLUNTEER_AREAS.map((area) => {
                const checked = form.areas.includes(area.value);
                return (
                  <label key={area.value} className={checked ? 'is-selected' : ''}>
                    <input checked={checked} name="areas" onChange={() => toggleArea(area.value)} type="checkbox" value={area.value} />
                    {area.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {error ? (
            <div className="home-alert is-error" role="alert">
              {error.message}
              {error.details.length > 0 ? <ul>{error.details.map((detail) => <li key={detail}>{detail}</li>)}</ul> : null}
            </div>
          ) : null}

          <div className="home-volunteer-actions">
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
