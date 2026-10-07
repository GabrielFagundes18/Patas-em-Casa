// O quê: pedido de adoção em 3 passos (seus dados → seu lar e rotina → visita e envio) e a confirmação.
// Como: estado único do formulário; cada passo é validado antes de seguir, com a mensagem ao lado do campo.
// As perguntas de clique do passo 2 são juntadas no texto "rotina" que a API já recebe — o contrato
// (POST /public/adoption-requests) não muda.
// Para quê: um formulário mais curto de preencher no celular e pedidos mais completos para a triagem da equipe.
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Copy, PawPrint, X } from "lucide-react";
import { useDialog } from "../../../shared/hooks/useDialog";
import { enviarPedidoAdocao } from "../../../api/adoptions";
import { artigo } from "../../../shared/utils/petText";
import "./AdoptionFormModal.css";

const STEPS = ["Seus dados", "Seu lar e rotina", "Visita e envio"];

const HOME_TYPES = ["Casa", "Apartamento", "Chácara ou sítio"];
const HOUSEHOLD = ["Só eu", "Outros adultos", "Crianças"];
const OTHER_PETS = ["Não tenho", "Cães", "Gatos", "Outros animais"];
const TIME_AT_HOME = ["Quase o dia todo", "Metade do dia", "Pouco tempo, fico fora o dia todo"];
// Opções que excluem as demais do mesmo grupo.
const EXCLUSIVE = { moradores: "Só eu", outrosAnimais: "Não tenho" };

// Em qual passo fica cada campo (para levar a pessoa ao erro devolvido pela API).
const FIELD_STEP = {
  nome: 0, email: 0, telefone: 0, cidade: 0,
  rotina: 1, moradia: 1, moradores: 1, outrosAnimais: 1, tempoEmCasa: 1, rotinaLivre: 1,
  visita_preferida_em: 2, ambiente_seguro: 2, ciente_pos_adocao: 2,
};

const EMPTY_FORM = {
  nome: "",
  email: "",
  telefone: "",
  cidade: "",
  moradia: "",
  moradores: [],
  outrosAnimais: [],
  tempoEmCasa: "",
  rotinaLivre: "",
  visita_preferida_em: "",
  ambiente_seguro: false,
  ciente_pos_adocao: false,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FREE_TEXT_MAX = 1600; // a API aceita até 2000 caracteres em "rotina", somando as respostas do passo 2

// O quê: data e hora atuais no formato do <input type="datetime-local"> (AAAA-MM-DDTHH:mm).
// Para quê: impedir que o calendário ofereça datas passadas.
function agoraLocal() {
  const agora = new Date();
  return new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

// "11988887777" → "(11) 98888-7777". Números com mais de 11 dígitos (com código do país) ficam como digitados.
export function formatPhone(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) return value.trim();
  const split = digits.length === 11 ? 7 : 6;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, split)}-${digits.slice(split)}`;
}

// O quê: junta as respostas do passo 2 no texto "rotina" enviado à API.
// Para quê: a equipe recebe sempre as mesmas informações, na mesma ordem, no painel e no e-mail.
export function composeRotina(form) {
  const lines = [
    `Moradia: ${form.moradia}`,
    `Mora com: ${form.moradores.join(", ")}`,
    `Outros animais: ${form.outrosAnimais.join(", ")}`,
    `Tempo em casa: ${form.tempoEmCasa}`,
  ];
  const livre = form.rotinaLivre.trim();
  return livre ? `${lines.join("\n")}\n\n${livre}` : lines.join("\n");
}

export function validateStep(step, form) {
  const errors = {};
  if (step === 0) {
    if (form.nome.trim().length < 2) errors.nome = "Informe seu nome completo.";
    if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Informe um e-mail válido.";
    const digits = form.telefone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 13) errors.telefone = "Informe um telefone com DDD.";
    if (form.cidade.trim().length < 2) errors.cidade = "Informe sua cidade.";
  }
  if (step === 1) {
    if (!form.moradia) errors.moradia = "Escolha o tipo de moradia.";
    if (!form.moradores.length) errors.moradores = "Conte quem mora com você.";
    if (!form.outrosAnimais.length) errors.outrosAnimais = "Conte se há outros animais em casa.";
    if (!form.tempoEmCasa) errors.tempoEmCasa = "Conte quanto tempo você passa em casa.";
  }
  if (step === 2) {
    if (form.visita_preferida_em && form.visita_preferida_em < agoraLocal()) {
      errors.visita_preferida_em = "Escolha uma data e um horário a partir de agora.";
    }
    if (!form.ambiente_seguro) errors.ambiente_seguro = "Confirme que você tem um ambiente seguro para o animal.";
    if (!form.ciente_pos_adocao) errors.ciente_pos_adocao = "Confirme que está de acordo com o acompanhamento pós-adoção.";
  }
  return errors;
}

// O quê: traduz a falha do envio em mensagem geral + erros por campo.
// Como: usa os detalhes por campo da API quando existem e trata falta de conexão separadamente.
function lerErro(error) {
  if (!error?.response) {
    return {
      mensagem: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      detalhes: [],
      campos: {},
    };
  }
  const apiError = error.response.data?.error;
  const details = apiError?.details || [];
  const campos = {};
  details.forEach((detail) => {
    const field = detail.field === "rotina" ? "rotinaLivre" : detail.field;
    if (field in FIELD_STEP) campos[field] = detail.message;
  });
  return {
    mensagem: apiError?.message || "Não foi possível enviar sua solicitação agora.",
    detalhes: details.map((detail) => detail.message),
    campos,
  };
}

// Miniatura do animal no topo: a foto ou, sem foto (ou com link quebrado), a pata da marca.
function PetThumb({ pet }) {
  const [failed, setFailed] = useState(false);
  if (!pet?.image || failed) {
    return (
      <span className="adopt-thumb" aria-hidden="true">
        <PawPrint size={24} />
      </span>
    );
  }
  return <img className="adopt-thumb" src={pet.image} alt="" onError={() => setFailed(true)} />;
}

function FieldError({ id, message }) {
  return message ? <span className="adopt-error" id={id}>{message}</span> : null;
}

export function AdoptionFormModal({ pet, onClose }) {
  const titleId = useId();
  const uid = useId();
  const [form, setForm] = useState(EMPTY_FORM);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [pedido, setPedido] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [copied, setCopied] = useState(false);
  const formRef = useRef(null);
  const stepTitleRef = useRef(null);
  const firstRender = useRef(true);
  const dirty = !pedido && JSON.stringify(form) !== JSON.stringify(EMPTY_FORM);

  // Fechar com dados preenchidos e ainda não enviados pede confirmação, para ninguém perder o que digitou.
  function requestClose() {
    if (dirty && !window.confirm("Sair sem enviar? O que você preencheu será perdido.")) return;
    onClose();
  }

  const dialogRef = useDialog(requestClose);

  // Ao trocar de passo, o foco vai para o título do passo (leitores de tela anunciam onde a pessoa está).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    stepTitleRef.current?.focus();
  }, [step]);

  const fieldId = (name) => `${uid}-${name}`;
  const errorId = (name) => `${uid}-${name}-erro`;
  const a11y = (name) => ({
    id: fieldId(name),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? errorId(name) : undefined,
  });

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  }

  function toggleInGroup(name, option) {
    const exclusive = EXCLUSIVE[name];
    const current = form[name];
    let next;
    if (current.includes(option)) next = current.filter((item) => item !== option);
    else if (option === exclusive) next = [option];
    else next = [...current.filter((item) => item !== exclusive), option];
    update(name, next);
  }

  // Leva o foco ao primeiro campo com erro; num grupo de opções, à primeira opção do grupo.
  function focusFirstError() {
    window.requestAnimationFrame(() => {
      const invalid = formRef.current?.querySelector('[aria-invalid="true"]');
      (invalid?.tagName === "FIELDSET" ? invalid.querySelector("input") : invalid)?.focus();
    });
  }

  function goTo(nextStep) {
    setErro(null);
    setStep(nextStep);
  }

  function handleNext() {
    const stepErrors = validateStep(step, form);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      focusFirstError();
      return;
    }
    goTo(step + 1);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (step < STEPS.length - 1) {
      handleNext();
      return;
    }
    const stepErrors = validateStep(step, form);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      focusFirstError();
      return;
    }

    setEnviando(true);
    setErro(null);
    try {
      const resultado = await enviarPedidoAdocao({
        animal_id: pet?.id,
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
        cidade: form.cidade.trim(),
        rotina: composeRotina(form),
        ambiente_seguro: form.ambiente_seguro,
        ciente_pos_adocao: form.ciente_pos_adocao,
        visita_preferida_em: form.visita_preferida_em || undefined,
        website: new FormData(event.currentTarget).get("website") || "",
      });
      setPedido(resultado);
    } catch (error) {
      const lido = lerErro(error);
      setErro(lido);
      if (Object.keys(lido.campos).length) {
        setErrors(lido.campos);
        setStep(Math.min(...Object.keys(lido.campos).map((field) => FIELD_STEP[field])));
      }
    } finally {
      setEnviando(false);
    }
  }

  async function copyProtocol() {
    try {
      await navigator.clipboard.writeText(pedido.protocolo);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const renderChoices = (name, options, type) => (
    <div className="adopt-choices">
      {options.map((option) => {
        const checked = type === "radio" ? form[name] === option : form[name].includes(option);
        return (
          <label key={option} className={checked ? "is-selected" : ""}>
            <input
              checked={checked}
              name={name}
              onChange={() => (type === "radio" ? update(name, option) : toggleInGroup(name, option))}
              type={type}
              value={option}
            />
            {option}
          </label>
        );
      })}
    </div>
  );

  const groupProps = (name) => ({
    className: "adopt-fieldset",
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? errorId(name) : undefined,
  });

  const petLabel = pet ? `${artigo(pet)} ${pet.name}` : "este animal";

  return (
    <motion.div className="adopt-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.section
        ref={dialogRef}
        className="adopt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={{ delay: 0.08, duration: 0.3 }}
      >
        <div className="adopt-header">
          <PetThumb pet={pet} />
          <div className="adopt-header-text">
            <span className="catalog-eyebrow">Pedido de adoção</span>
            <h2 id={titleId}>Quero adotar {pet?.name}</h2>
            {pet?.meta ? <p>{pet.meta}</p> : null}
          </div>
          <button type="button" className="catalog-icon-button adopt-close" onClick={requestClose} aria-label="Fechar e voltar para a ficha">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {pedido ? (
          <div className="adopt-body adopt-success" role="status">
            <span className="adopt-success-icon" aria-hidden="true"><Check size={28} /></span>
            <h3>Pedido enviado!</h3>
            <p>Obrigado por querer adotar {petLabel}. Guarde o número do seu pedido:</p>
            <div className="adopt-protocol">
              <strong>{pedido.protocolo}</strong>
              <button type="button" className="catalog-secondary-button" onClick={copyProtocol}>
                {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <h4>Próximos passos</h4>
            <ol className="adopt-next">
              <li>A equipe analisa o pedido e entra em contato em até 48 horas.</li>
              <li>Vocês combinam uma conversa e uma visita.</li>
              <li>Com tudo certo, você assina o Termo de Adoção e {pet?.name ?? "o animal"} vai para casa.</li>
            </ol>
            <div className="adopt-actions">
              <Link to="/adotar" className="catalog-secondary-button">Ver outros animais</Link>
              <button type="button" className="catalog-primary-button" onClick={onClose}>Fechar</button>
            </div>
          </div>
        ) : (
          <form ref={formRef} className="adopt-body" onSubmit={handleSubmit} noValidate aria-busy={enviando}>
            <div className="adopt-progress">
              <p>Passo {step + 1} de {STEPS.length}</p>
              <ol aria-label="Etapas do pedido">
                {STEPS.map((title, index) => (
                  <li
                    key={title}
                    className={index < step ? "is-done" : index === step ? "is-current" : ""}
                    aria-current={index === step ? "step" : undefined}
                  >
                    <span>{title}</span>
                  </li>
                ))}
              </ol>
            </div>

            <h3 className="adopt-step-title" ref={stepTitleRef} tabIndex={-1}>{STEPS[step]}</h3>

            {/* Campo-isca anti-robô: fora da tela e fora da ordem de tabulação. */}
            <label aria-hidden="true" className="adopt-trap">
              Site
              <input autoComplete="off" name="website" tabIndex={-1} type="text" />
            </label>

            {step === 0 ? (
              <div className="adopt-grid">
                <div className="adopt-field is-wide">
                  <label htmlFor={fieldId("nome")}>Nome completo</label>
                  <input {...a11y("nome")} autoComplete="name" maxLength={150} onChange={(e) => update("nome", e.target.value)} placeholder="Seu nome" type="text" value={form.nome} />
                  <FieldError id={errorId("nome")} message={errors.nome} />
                </div>
                <div className="adopt-field">
                  <label htmlFor={fieldId("email")}>E-mail</label>
                  <input {...a11y("email")} autoComplete="email" inputMode="email" maxLength={150} onChange={(e) => update("email", e.target.value)} placeholder="voce@email.com" type="email" value={form.email} />
                  <FieldError id={errorId("email")} message={errors.email} />
                </div>
                <div className="adopt-field">
                  <label htmlFor={fieldId("telefone")}>Telefone com DDD</label>
                  <input
                    {...a11y("telefone")}
                    autoComplete="tel"
                    inputMode="tel"
                    maxLength={20}
                    onBlur={(e) => update("telefone", formatPhone(e.target.value))}
                    onChange={(e) => update("telefone", e.target.value)}
                    placeholder="(11) 99999-9999"
                    type="tel"
                    value={form.telefone}
                  />
                  <FieldError id={errorId("telefone")} message={errors.telefone} />
                </div>
                <div className="adopt-field is-wide">
                  <label htmlFor={fieldId("cidade")}>Cidade</label>
                  <input {...a11y("cidade")} autoComplete="address-level2" maxLength={100} onChange={(e) => update("cidade", e.target.value)} placeholder="Sua cidade" type="text" value={form.cidade} />
                  <FieldError id={errorId("cidade")} message={errors.cidade} />
                </div>
                <p className="adopt-note is-wide">A adoção é gratuita. A equipe usa estes dados para falar com você sobre o pedido.</p>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="adopt-stack">
                <fieldset {...groupProps("moradia")}>
                  <legend>Onde você mora?</legend>
                  {renderChoices("moradia", HOME_TYPES, "radio")}
                  <FieldError id={errorId("moradia")} message={errors.moradia} />
                </fieldset>
                <fieldset {...groupProps("moradores")}>
                  <legend>Quem mora com você?</legend>
                  {renderChoices("moradores", HOUSEHOLD, "checkbox")}
                  <FieldError id={errorId("moradores")} message={errors.moradores} />
                </fieldset>
                <fieldset {...groupProps("outrosAnimais")}>
                  <legend>Tem outros animais em casa?</legend>
                  {renderChoices("outrosAnimais", OTHER_PETS, "checkbox")}
                  <FieldError id={errorId("outrosAnimais")} message={errors.outrosAnimais} />
                </fieldset>
                <fieldset {...groupProps("tempoEmCasa")}>
                  <legend>Quanto tempo você passa em casa?</legend>
                  {renderChoices("tempoEmCasa", TIME_AT_HOME, "radio")}
                  <FieldError id={errorId("tempoEmCasa")} message={errors.tempoEmCasa} />
                </fieldset>
                <div className="adopt-field">
                  <label htmlFor={fieldId("rotinaLivre")}>Quer contar mais alguma coisa? (opcional)</label>
                  <textarea
                    {...a11y("rotinaLivre")}
                    maxLength={FREE_TEXT_MAX}
                    onChange={(e) => update("rotinaLivre", e.target.value)}
                    placeholder={`Ex.: rotina de passeios, por que escolheu ${pet?.name ?? "este animal"}, experiência com animais…`}
                    rows={4}
                    value={form.rotinaLivre}
                  />
                  <FieldError id={errorId("rotinaLivre")} message={errors.rotinaLivre} />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="adopt-stack">
                <dl className="adopt-review">
                  <div>
                    <dt>Seus dados</dt>
                    <dd>
                      {form.nome} · {form.email} · {form.telefone} · {form.cidade}
                      <button type="button" onClick={() => goTo(0)}>Editar</button>
                    </dd>
                  </div>
                  <div>
                    <dt>Seu lar</dt>
                    <dd>
                      {[form.moradia, form.moradores.join(", "), form.tempoEmCasa].filter(Boolean).join(" · ")}
                      <button type="button" onClick={() => goTo(1)}>Editar</button>
                    </dd>
                  </div>
                </dl>

                <div className="adopt-field">
                  <label htmlFor={fieldId("visita_preferida_em")}>Melhor dia e horário para a visita (opcional)</label>
                  <input
                    {...a11y("visita_preferida_em")}
                    aria-describedby={errors.visita_preferida_em ? errorId("visita_preferida_em") : `${uid}-visita-dica`}
                    min={agoraLocal()}
                    onChange={(e) => update("visita_preferida_em", e.target.value)}
                    type="datetime-local"
                    value={form.visita_preferida_em}
                  />
                  <small id={`${uid}-visita-dica`} className="adopt-hint">É só uma sugestão: a equipe confirma o horário com você.</small>
                  <FieldError id={errorId("visita_preferida_em")} message={errors.visita_preferida_em} />
                </div>

                <div className="adopt-checks">
                  <label className={errors.ambiente_seguro ? "has-error" : ""}>
                    <input
                      {...a11y("ambiente_seguro")}
                      checked={form.ambiente_seguro}
                      onChange={(e) => update("ambiente_seguro", e.target.checked)}
                      type="checkbox"
                    />
                    <span>Tenho um ambiente seguro para o animal (telas ou muros, sem acesso livre à rua).</span>
                  </label>
                  <FieldError id={errorId("ambiente_seguro")} message={errors.ambiente_seguro} />
                  <label className={errors.ciente_pos_adocao ? "has-error" : ""}>
                    <input
                      {...a11y("ciente_pos_adocao")}
                      checked={form.ciente_pos_adocao}
                      onChange={(e) => update("ciente_pos_adocao", e.target.checked)}
                      type="checkbox"
                    />
                    <span>Concordo com o acompanhamento pós-adoção, com contatos da equipe nas primeiras semanas.</span>
                  </label>
                  <FieldError id={errorId("ciente_pos_adocao")} message={errors.ciente_pos_adocao} />
                </div>
              </div>
            ) : null}

            {erro ? (
              <div className="adopt-alert" role="alert">
                <p>{erro.mensagem}</p>
                {erro.detalhes.length > 0 ? (
                  <ul>{erro.detalhes.map((detalhe) => <li key={detalhe}>{detalhe}</li>)}</ul>
                ) : null}
              </div>
            ) : null}

            <div className="adopt-nav">
              {step > 0 ? (
                <button type="button" className="catalog-secondary-button" onClick={() => goTo(step - 1)}>
                  <ArrowLeft size={16} aria-hidden="true" /> Voltar
                </button>
              ) : (
                <span />
              )}
              {step < STEPS.length - 1 ? (
                <button type="submit" className="catalog-primary-button">
                  Continuar <ArrowRight size={16} aria-hidden="true" />
                </button>
              ) : (
                <button type="submit" className="catalog-primary-button" disabled={enviando}>
                  {enviando ? "Enviando..." : "Enviar pedido"}
                </button>
              )}
            </div>
          </form>
        )}
      </motion.section>
    </motion.div>
  );
}
