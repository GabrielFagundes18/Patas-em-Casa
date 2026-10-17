/*
 * ============================================================================
 * ARQUIVO: AdoptionFormModal.jsx
 * ============================================================================
 *
 * PARA QUE SERVE:
 *   É o FORMULÁRIO DE PEDIDO DE ADOÇÃO, que abre numa janela (modal) a partir do
 *   perfil do animal. Tem 3 passos:
 *     1) Seus dados (nome, e-mail, telefone, cidade);
 *     2) Seu lar e rotina (moradia, quem mora junto, outros animais, tempo em casa);
 *     3) Visita e envio (revisão, data sugerida para visita e duas confirmações).
 *   Cada passo é validado antes de seguir. Ao enviar, mostra a confirmação com o
 *   número de protocolo e os próximos passos.
 *
 * PRINCIPAIS ITENS:
 *   - Constantes: STEPS, HOME_TYPES, HOUSEHOLD, OTHER_PETS, TIME_AT_HOME, EXCLUSIVE,
 *     FIELD_STEP, EMPTY_FORM, EMAIL_PATTERN, FREE_TEXT_MAX.
 *   - agoraLocal()            → data/hora atual no formato do campo datetime-local.
 *   - formatPhone(value)      → formata telefone (exportada).
 *   - composeRotina(form)     → junta as respostas do passo 2 num texto (exportada).
 *   - validateStep(step, form)→ valida um passo e devolve os erros (exportada).
 *   - lerErro(error)          → traduz o erro da API (interna).
 *   - PetThumb, FieldError    → componentes pequenos (internos).
 *   - AdoptionFormModal({ pet, onClose }) → o componente principal (exportação nomeada).
 *
 * CONEXÕES COM OUTROS ARQUIVOS:
 *   - react (useEffect, useId, useRef, useState), react-router-dom (Link), framer-motion, lucide-react.
 *   - shared/hooks/useDialog   → comportamento de modal acessível.
 *   - api/adoptions.js         → enviarPedidoAdocao (POST /api/v1/public/adoption-requests).
 *   - shared/utils/petText.js  → artigo ("o"/"a").
 *   - ./AdoptionFormModal.css  → estilos.
 *   - Quem usa: features/animal-profile/AnimalProfilePage.jsx.
 *   - Testado em: ./AdoptionFormModal.test.js.
 * ============================================================================
 */

// O quê: pedido de adoção em 3 passos (seus dados → seu lar e rotina → visita e envio) e a confirmação.
// Como: estado único do formulário; cada passo é validado antes de seguir, com a mensagem ao lado do campo.
// As perguntas de clique do passo 2 são juntadas no texto "rotina" que a API já recebe — o contrato
// (POST /public/adoption-requests) não muda.
// Para quê: um formulário mais curto de preencher no celular e pedidos mais completos para a triagem da equipe.
// Hooks do React. useId gera ids únicos; useRef guarda referências sem redesenhar.
import { useEffect, useId, useRef, useState } from "react";
// Link: navegação interna.
import { Link } from "react-router-dom";
// Elementos animáveis.
import { motion } from "framer-motion";
// Ícones.
import { ArrowLeft, ArrowRight, Check, Copy, PawPrint, X } from "lucide-react";
// Hook de modal acessível.
import { useDialog } from "shared/hooks/useDialog";
// Função que envia o pedido à API.
import { enviarPedidoAdocao } from "api/adoptions";
// Artigo "o"/"a" conforme o sexo.
import { artigo } from "shared/utils/petText";
// Estilos.
import "./AdoptionFormModal.css";

// Nomes dos 3 passos (a posição no array é o número do passo: 0, 1, 2).
const STEPS = ["Seus dados", "Seu lar e rotina", "Visita e envio"];

// Opções do passo 2.
const HOME_TYPES = ["Casa", "Apartamento", "Chácara ou sítio"]; // tipo de moradia (escolha única)
const HOUSEHOLD = ["Só eu", "Outros adultos", "Crianças"]; // quem mora junto (múltipla)
const OTHER_PETS = ["Não tenho", "Cães", "Gatos", "Outros animais"]; // outros animais (múltipla)
const TIME_AT_HOME = ["Quase o dia todo", "Metade do dia", "Pouco tempo, fico fora o dia todo"]; // tempo em casa (única)
// Opções que excluem as demais do mesmo grupo.
// Ex.: marcar "Só eu" desmarca "Crianças"; marcar "Cães" desmarca "Não tenho".
const EXCLUSIVE = { moradores: "Só eu", outrosAnimais: "Não tenho" };

// Em qual passo fica cada campo (para levar a pessoa ao erro devolvido pela API).
const FIELD_STEP = {
  nome: 0, email: 0, telefone: 0, cidade: 0,
  rotina: 1, moradia: 1, moradores: 1, outrosAnimais: 1, tempoEmCasa: 1, rotinaLivre: 1,
  visita_preferida_em: 2, ambiente_seguro: 2, ciente_pos_adocao: 2,
};

// Valores iniciais de todos os campos (o formulário inteiro fica num único estado).
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

// Expressão regular simples de e-mail: "algo@algo.algo" sem espaços.
// [^\s@]+ = um ou mais caracteres que não são espaço nem "@"; \. = um ponto literal.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FREE_TEXT_MAX = 1600; // a API aceita até 2000 caracteres em "rotina", somando as respostas do passo 2

/*
 * FUNÇÃO: agoraLocal
 * O que faz: devolve a data/hora atual no formato "AAAA-MM-DDTHH:mm", no fuso LOCAL.
 * Parâmetros: nenhum.
 * Retorno (string): ex.: "2026-10-16T14:30".
 * Onde é usada: no "min" do campo de visita e na validação do passo 3.
 */
// O quê: data e hora atuais no formato do <input type="datetime-local"> (AAAA-MM-DDTHH:mm).
// Para quê: impedir que o calendário ofereça datas passadas.
function agoraLocal() {
  const agora = new Date();
  // toISOString() sempre usa UTC. Para obter o horário LOCAL nesse formato, subtraímos a diferença
  // de fuso (getTimezoneOffset, em minutos; × 60000 = milissegundos) antes de converter.
  // .slice(0, 16) corta os segundos e o "Z" (fica "AAAA-MM-DDTHH:mm").
  return new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/*
 * FUNÇÃO: formatPhone (exportada)
 * O que faz: formata um telefone brasileiro com DDD.
 * Parâmetros: value (string) — o que a pessoa digitou.
 * Retorno (string): "(11) 98888-7777" (celular, 11 dígitos) ou "(11) 4000-0000" (fixo, 10 dígitos);
 *   outros tamanhos ficam como digitados (só sem espaços nas pontas).
 * Onde é usada: ao sair do campo de telefone (onBlur).
 */
// "11988887777" → "(11) 98888-7777". Números com mais de 11 dígitos (com código do país) ficam como digitados.
export function formatPhone(value) {
  // \D = qualquer caractere que NÃO é dígito; remove tudo que não for número.
  const digits = value.replace(/\D/g, "");
  // Só formata se tiver 10 ou 11 dígitos.
  if (digits.length < 10 || digits.length > 11) return value.trim();
  // Onde colocar o hífen: depois do 7º dígito (celular) ou do 6º (fixo).
  const split = digits.length === 11 ? 7 : 6;
  // Monta "(DD) XXXXX-XXXX" com .slice(início, fim).
  return `(${digits.slice(0, 2)}) ${digits.slice(2, split)}-${digits.slice(split)}`;
}

/*
 * FUNÇÃO: composeRotina (exportada)
 * O que faz: transforma as respostas do passo 2 num texto único, no formato que a API espera.
 * Parâmetros: form (objeto do formulário).
 * Retorno (string): linhas "Moradia: ...", "Mora com: ...", etc., e, se houver, o texto livre no fim.
 * Onde é usada: no envio (campo "rotina").
 */
// O quê: junta as respostas do passo 2 no texto "rotina" enviado à API.
// Para quê: a equipe recebe sempre as mesmas informações, na mesma ordem, no painel e no e-mail.
export function composeRotina(form) {
  // Uma linha por resposta; as listas viram texto separado por vírgula.
  const lines = [
    `Moradia: ${form.moradia}`,
    `Mora com: ${form.moradores.join(", ")}`,
    `Outros animais: ${form.outrosAnimais.join(", ")}`,
    `Tempo em casa: ${form.tempoEmCasa}`,
  ];
  // Texto livre sem espaços nas pontas.
  const livre = form.rotinaLivre.trim();
  // "\n" = quebra de linha. Com texto livre: linhas + linha em branco + texto livre.
  return livre ? `${lines.join("\n")}\n\n${livre}` : lines.join("\n");
}

/*
 * FUNÇÃO: validateStep (exportada)
 * O que faz: confere os campos de um passo e devolve as mensagens de erro.
 * Parâmetros:
 *   - step (number): 0, 1 ou 2.
 *   - form (objeto): valores do formulário.
 * Retorno (objeto): { nomeDoCampo: "mensagem" } — vazio ({}) se estiver tudo certo.
 * Onde é usada: ao clicar em "Continuar" e ao enviar; também nos testes.
 */
export function validateStep(step, form) {
  // Começa sem erros.
  const errors = {};
  // Passo 1: dados pessoais.
  if (step === 0) {
    if (form.nome.trim().length < 2) errors.nome = "Informe seu nome completo.";
    // .test devolve true se o texto combinar com a expressão regular.
    if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Informe um e-mail válido.";
    // Conta só os dígitos do telefone (entre 10 e 13, para aceitar código do país).
    const digits = form.telefone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 13) errors.telefone = "Informe um telefone com DDD.";
    if (form.cidade.trim().length < 2) errors.cidade = "Informe sua cidade.";
  }
  // Passo 2: lar e rotina (todas as perguntas de clique são obrigatórias).
  if (step === 1) {
    if (!form.moradia) errors.moradia = "Escolha o tipo de moradia.";
    if (!form.moradores.length) errors.moradores = "Conte quem mora com você.";
    if (!form.outrosAnimais.length) errors.outrosAnimais = "Conte se há outros animais em casa.";
    if (!form.tempoEmCasa) errors.tempoEmCasa = "Conte quanto tempo você passa em casa.";
  }
  // Passo 3: visita (opcional, mas não pode estar no passado) e confirmações (obrigatórias).
  if (step === 2) {
    // Datas no formato "AAAA-MM-DDTHH:mm" podem ser comparadas como texto.
    if (form.visita_preferida_em && form.visita_preferida_em < agoraLocal()) {
      errors.visita_preferida_em = "Escolha uma data e um horário a partir de agora.";
    }
    if (!form.ambiente_seguro) errors.ambiente_seguro = "Confirme que você tem um ambiente seguro para o animal.";
    if (!form.ciente_pos_adocao) errors.ciente_pos_adocao = "Confirme que está de acordo com o acompanhamento pós-adoção.";
  }
  return errors;
}

/*
 * FUNÇÃO: lerErro (interna)
 * O que faz: transforma o erro do envio em mensagem geral, lista de detalhes e erros por campo.
 * Parâmetros: error (erro do axios).
 * Retorno (objeto): { mensagem, detalhes: string[], campos: { campo: mensagem } }.
 * Onde é usada: no catch do envio.
 */
// O quê: traduz a falha do envio em mensagem geral + erros por campo.
// Como: usa os detalhes por campo da API quando existem e trata falta de conexão separadamente.
function lerErro(error) {
  // Sem resposta do servidor = problema de conexão.
  if (!error?.response) {
    return {
      mensagem: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      detalhes: [],
      campos: {},
    };
  }
  // Erro no formato da API: { error: { message, details: [{ field, message }] } }.
  const apiError = error.response.data?.error;
  const details = apiError?.details || [];
  const campos = {};
  details.forEach((detail) => {
    // O campo "rotina" da API corresponde ao texto livre ("rotinaLivre") no formulário.
    const field = detail.field === "rotina" ? "rotinaLivre" : detail.field;
    // "in" verifica se a chave existe no objeto FIELD_STEP (só campos conhecidos).
    if (field in FIELD_STEP) campos[field] = detail.message;
  });
  return {
    mensagem: apiError?.message || "Não foi possível enviar sua solicitação agora.",
    detalhes: details.map((detail) => detail.message),
    campos,
  };
}

/*
 * COMPONENTE: PetThumb (interno)
 * O que faz: miniatura do animal no topo do formulário (foto ou pata).
 * Parâmetros (props): pet (animal do petMapper).
 * Retorno: <img> ou <span> com o ícone.
 */
// Miniatura do animal no topo: a foto ou, sem foto (ou com link quebrado), a pata da marca.
function PetThumb({ pet }) {
  // true se a foto não carregar.
  const [failed, setFailed] = useState(false);
  if (!pet?.image || failed) {
    return (
      <span className="adopt-thumb" aria-hidden="true">
        <PawPrint size={24} />
      </span>
    );
  }
  // alt="" (decorativa): o nome do animal já está no título.
  return <img className="adopt-thumb" src={pet.image} alt="" onError={() => setFailed(true)} />;
}

/*
 * COMPONENTE: FieldError (interno)
 * O que faz: mostra a mensagem de erro de um campo (ou nada).
 * Parâmetros (props): id (string — ligado ao campo via aria-describedby) e message (string | undefined).
 * Retorno: <span> com a mensagem, ou null.
 */
function FieldError({ id, message }) {
  return message ? <span className="adopt-error" id={id}>{message}</span> : null;
}

/*
 * COMPONENTE: AdoptionFormModal
 * O que faz: desenha o modal com o formulário em 3 passos e a tela de sucesso.
 * Parâmetros (props):
 *   - pet (objeto): o animal a ser adotado (formato do petMapper).
 *   - onClose (função): fecha o modal.
 * Retorno: JSX do modal.
 * Onde é usado: AnimalProfilePage.jsx.
 */
export function AdoptionFormModal({ pet, onClose }) {
  // Id do título (para aria-labelledby).
  const titleId = useId();
  // Prefixo único para os ids dos campos (evita conflito se houver mais de um formulário).
  const uid = useId();
  // Valores de todos os campos.
  const [form, setForm] = useState(EMPTY_FORM);
  // Passo atual (0, 1 ou 2).
  const [step, setStep] = useState(0);
  // Erros por campo.
  const [errors, setErrors] = useState({});
  // Resposta da API após o envio (com o protocolo) — quando existe, mostra a tela de sucesso.
  const [pedido, setPedido] = useState(null);
  // true enquanto envia.
  const [enviando, setEnviando] = useState(false);
  // Erro geral do envio ({ mensagem, detalhes, campos }) ou null.
  const [erro, setErro] = useState(null);
  // true logo após copiar o protocolo.
  const [copied, setCopied] = useState(false);
  // Referência ao <form> (para procurar o primeiro campo com erro).
  const formRef = useRef(null);
  // Referência ao título do passo (para mover o foco ao trocar de passo).
  const stepTitleRef = useRef(null);
  // Marca a primeira renderização (para não mover o foco ao abrir).
  const firstRender = useRef(true);
  // "Sujo" = algo foi preenchido e ainda não enviado. Compara o formulário com o vazio
  // transformando ambos em texto JSON (forma simples de comparar objetos).
  const dirty = !pedido && JSON.stringify(form) !== JSON.stringify(EMPTY_FORM);

  /*
   * FUNÇÃO INTERNA: requestClose
   * O que faz: fecha o modal, pedindo confirmação se houver dados não enviados.
   */
  // Fechar com dados preenchidos e ainda não enviados pede confirmação, para ninguém perder o que digitou.
  function requestClose() {
    // window.confirm devolve false se a pessoa cancelar; aí não fecha.
    if (dirty && !window.confirm("Sair sem enviar? O que você preencheu será perdido.")) return;
    onClose();
  }

  // Comportamento de modal (foco, Esc chama requestClose, Tab preso, rolagem travada).
  const dialogRef = useDialog(requestClose);

  // Ao trocar de passo, o foco vai para o título do passo (leitores de tela anunciam onde a pessoa está).
  useEffect(() => {
    // Na primeira vez (ao abrir), não mexe no foco (o useDialog já cuida disso).
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    // "?." evita erro se a ref ainda não estiver ligada.
    stepTitleRef.current?.focus();
  }, [step]);

  // Gera o id de um campo (ex.: ":r1:-nome").
  const fieldId = (name) => `${uid}-${name}`;
  // Gera o id da mensagem de erro de um campo.
  const errorId = (name) => `${uid}-${name}-erro`;
  // Atributos de acessibilidade de um campo: id, aria-invalid (se tiver erro) e
  // aria-describedby (aponta para a mensagem de erro, para o leitor de tela lê-la).
  const a11y = (name) => ({
    id: fieldId(name),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? errorId(name) : undefined,
  });

  /*
   * FUNÇÃO INTERNA: update
   * O que faz: muda o valor de um campo e apaga o erro dele (se houver).
   * Parâmetros: name (nome do campo) e value (novo valor).
   */
  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    // Só cria um objeto novo se havia erro nesse campo (evita redesenhos desnecessários).
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  }

  /*
   * FUNÇÃO INTERNA: toggleInGroup
   * O que faz: marca/desmarca uma opção de um grupo de caixas de seleção, respeitando as exclusivas.
   * Parâmetros: name (grupo: 'moradores' ou 'outrosAnimais') e option (texto da opção).
   */
  function toggleInGroup(name, option) {
    // Opção exclusiva do grupo (ex.: "Só eu").
    const exclusive = EXCLUSIVE[name];
    // Lista atual de opções marcadas.
    const current = form[name];
    // Próxima lista.
    let next;
    // Já marcada → desmarca.
    if (current.includes(option)) next = current.filter((item) => item !== option);
    // Marcou a exclusiva → fica só ela.
    else if (option === exclusive) next = [option];
    // Marcou outra → remove a exclusiva (se estava) e adiciona a nova.
    else next = [...current.filter((item) => item !== exclusive), option];
    update(name, next);
  }

  /*
   * FUNÇÃO INTERNA: focusFirstError
   * O que faz: leva o foco ao primeiro campo inválido do formulário.
   */
  // Leva o foco ao primeiro campo com erro; num grupo de opções, à primeira opção do grupo.
  function focusFirstError() {
    // Espera o próximo quadro de desenho (os atributos aria-invalid já estarão na tela).
    window.requestAnimationFrame(() => {
      // Primeiro elemento com aria-invalid="true".
      const invalid = formRef.current?.querySelector('[aria-invalid="true"]');
      // Se for um <fieldset> (grupo), foca o primeiro <input> dele; senão, o próprio campo.
      (invalid?.tagName === "FIELDSET" ? invalid.querySelector("input") : invalid)?.focus();
    });
  }

  /*
   * FUNÇÃO INTERNA: goTo
   * O que faz: vai para outro passo, limpando o erro geral.
   */
  function goTo(nextStep) {
    setErro(null);
    setStep(nextStep);
  }

  /*
   * FUNÇÃO INTERNA: handleNext
   * O que faz: valida o passo atual; se estiver tudo certo, avança.
   */
  function handleNext() {
    const stepErrors = validateStep(step, form);
    // Object.keys(obj).length = quantidade de chaves (0 = sem erros).
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      focusFirstError();
      return;
    }
    goTo(step + 1);
  }

  /*
   * FUNÇÃO INTERNA: handleSubmit
   * O que faz: no passo 1 ou 2, funciona como "Continuar"; no passo 3, valida e envia o pedido.
   * Parâmetros: event (envio do formulário).
   */
  async function handleSubmit(event) {
    // Impede o recarregamento da página.
    event.preventDefault();
    // Ainda não é o último passo: só avança (Enter num campo também cai aqui).
    if (step < STEPS.length - 1) {
      handleNext();
      return;
    }
    // Último passo: valida.
    const stepErrors = validateStep(step, form);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      focusFirstError();
      return;
    }

    // Envia.
    setEnviando(true);
    setErro(null);
    try {
      // Monta o corpo no formato que a API espera (nomes em português, com "_").
      const resultado = await enviarPedidoAdocao({
        animal_id: pet?.id,
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
        cidade: form.cidade.trim(),
        // Respostas do passo 2 juntadas num texto.
        rotina: composeRotina(form),
        ambiente_seguro: form.ambiente_seguro,
        ciente_pos_adocao: form.ciente_pos_adocao,
        // Vazio vira undefined (o campo não é enviado).
        visita_preferida_em: form.visita_preferida_em || undefined,
        // Campo-isca anti-robô, lido diretamente do formulário.
        website: new FormData(event.currentTarget).get("website") || "",
      });
      // Sucesso: guarda a resposta → aparece a tela de confirmação.
      setPedido(resultado);
    } catch (error) {
      // Traduz o erro.
      const lido = lerErro(error);
      setErro(lido);
      // Se a API apontou campos com erro, marca-os e volta para o PRIMEIRO passo que tem erro.
      if (Object.keys(lido.campos).length) {
        setErrors(lido.campos);
        // Math.min(...lista) pega o menor número da lista (o spread "abre" a lista em argumentos).
        setStep(Math.min(...Object.keys(lido.campos).map((field) => FIELD_STEP[field])));
      }
    } finally {
      setEnviando(false);
    }
  }

  /*
   * FUNÇÃO INTERNA: copyProtocol
   * O que faz: copia o número do protocolo e mostra "Copiado" por 2 segundos.
   */
  async function copyProtocol() {
    try {
      await navigator.clipboard.writeText(pedido.protocolo);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  /*
   * FUNÇÃO INTERNA: renderChoices
   * O que faz: desenha um grupo de opções (rádio ou caixa de seleção) com aparência de botões.
   * Parâmetros: name (campo), options (lista de textos), type ('radio' | 'checkbox').
   * Retorno: JSX com os rótulos e inputs.
   */
  const renderChoices = (name, options, type) => (
    <div className="adopt-choices">
      {options.map((option) => {
        // Rádio: marcado se o valor for igual; checkbox: marcado se estiver na lista.
        const checked = type === "radio" ? form[name] === option : form[name].includes(option);
        return (
          <label key={option} className={checked ? "is-selected" : ""}>
            {/* Rádio usa update (troca o valor); checkbox usa toggleInGroup (lista com exclusivas). */}
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

  // Atributos de um <fieldset> (grupo de opções), com marcação de erro acessível.
  const groupProps = (name) => ({
    className: "adopt-fieldset",
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? errorId(name) : undefined,
  });

  // "o Nino" / "a Mel" / "este animal".
  const petLabel = pet ? `${artigo(pet)} ${pet.name}` : "este animal";

  return (
    // Fundo escurecido com animação de opacidade.
    <motion.div className="adopt-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* A janela em si: diálogo modal acessível, com animação de subida. */}
      <motion.section
        ref={dialogRef}
        className="adopt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        // tabIndex={-1} permite focar a janela por código (sem entrar na ordem do Tab).
        tabIndex={-1}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={{ delay: 0.08, duration: 0.3 }}
      >
        {/* ===== Cabeçalho: miniatura, título e botão de fechar ===== */}
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

        {/* Se já enviou (pedido existe), mostra a confirmação; senão, o formulário. */}
        {pedido ? (
          // ===== Tela de sucesso =====
          <div className="adopt-body adopt-success" role="status">
            <span className="adopt-success-icon" aria-hidden="true"><Check size={28} /></span>
            <h3>Pedido enviado!</h3>
            <p>Obrigado por querer adotar {petLabel}. Guarde o número do seu pedido:</p>
            {/* Protocolo com botão de copiar. */}
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
          // ===== Formulário =====
          // noValidate desliga a validação automática do navegador (usamos a nossa, com mensagens próprias).
          // aria-busy indica que algo está sendo processado (envio).
          <form ref={formRef} className="adopt-body" onSubmit={handleSubmit} noValidate aria-busy={enviando}>
            {/* Barra de progresso: "Passo X de 3" e a lista de etapas. */}
            <div className="adopt-progress">
              <p>Passo {step + 1} de {STEPS.length}</p>
              <ol aria-label="Etapas do pedido">
                {STEPS.map((title, index) => (
                  <li
                    key={title}
                    // Concluídos: is-done; atual: is-current.
                    className={index < step ? "is-done" : index === step ? "is-current" : ""}
                    // aria-current="step" marca a etapa atual para leitores de tela.
                    aria-current={index === step ? "step" : undefined}
                  >
                    <span>{title}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Título do passo atual (recebe o foco ao trocar de passo). */}
            <h3 className="adopt-step-title" ref={stepTitleRef} tabIndex={-1}>{STEPS[step]}</h3>

            {/* Campo-isca anti-robô: fora da tela e fora da ordem de tabulação. */}
            <label aria-hidden="true" className="adopt-trap">
              Site
              <input autoComplete="off" name="website" tabIndex={-1} type="text" />
            </label>

            {/* ===== Passo 1: Seus dados ===== */}
            {step === 0 ? (
              <div className="adopt-grid">
                <div className="adopt-field is-wide">
                  {/* htmlFor liga o rótulo ao campo pelo id (em JSX é htmlFor, não "for"). */}
                  <label htmlFor={fieldId("nome")}>Nome completo</label>
                  {/* {...a11y("nome")} espalha id/aria-invalid/aria-describedby no input.
                      "e" é o evento; e.target.value é o texto digitado. */}
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
                  {/* onBlur (ao sair do campo) formata o número digitado. */}
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
                  {/* autoComplete="address-level2" = cidade (padrão de preenchimento automático). */}
                  <input {...a11y("cidade")} autoComplete="address-level2" maxLength={100} onChange={(e) => update("cidade", e.target.value)} placeholder="Sua cidade" type="text" value={form.cidade} />
                  <FieldError id={errorId("cidade")} message={errors.cidade} />
                </div>
                <p className="adopt-note is-wide">A adoção é gratuita. A equipe usa estes dados para falar com você sobre o pedido.</p>
              </div>
            ) : null}

            {/* ===== Passo 2: Seu lar e rotina ===== */}
            {step === 1 ? (
              <div className="adopt-stack">
                {/* Cada pergunta é um <fieldset> com <legend> e um grupo de opções. */}
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
                {/* Texto livre opcional (<textarea> = campo de várias linhas). */}
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

            {/* ===== Passo 3: Visita e envio ===== */}
            {step === 2 ? (
              <div className="adopt-stack">
                {/* Revisão do que foi preenchido, com botões para voltar e editar. */}
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

                {/* Data sugerida para a visita (opcional). */}
                <div className="adopt-field">
                  <label htmlFor={fieldId("visita_preferida_em")}>Melhor dia e horário para a visita (opcional)</label>
                  {/* type="datetime-local" mostra um seletor de data e hora; min impede datas passadas.
                      O aria-describedby escrito DEPOIS do spread substitui o que veio do a11y:
                      com erro, aponta para a mensagem; sem erro, para a dica. */}
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

                {/* Confirmações obrigatórias (caixas de seleção). */}
                <div className="adopt-checks">
                  <label className={errors.ambiente_seguro ? "has-error" : ""}>
                    {/* e.target.checked = true/false (marcado ou não). */}
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

            {/* Erro geral do envio (com detalhes, se houver). */}
            {erro ? (
              <div className="adopt-alert" role="alert">
                <p>{erro.mensagem}</p>
                {erro.detalhes.length > 0 ? (
                  <ul>{erro.detalhes.map((detalhe) => <li key={detalhe}>{detalhe}</li>)}</ul>
                ) : null}
              </div>
            ) : null}

            {/* ===== Navegação entre passos ===== */}
            <div className="adopt-nav">
              {/* "Voltar" a partir do passo 2; no passo 1, um <span> vazio mantém o layout. */}
              {step > 0 ? (
                <button type="button" className="catalog-secondary-button" onClick={() => goTo(step - 1)}>
                  <ArrowLeft size={16} aria-hidden="true" /> Voltar
                </button>
              ) : (
                <span />
              )}
              {/* Antes do último passo: "Continuar" (submit → handleSubmit → handleNext).
                  No último: "Enviar pedido" (desabilitado durante o envio). */}
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

/*
 * ============================================================================
 * RESUMO DO ARQUIVO
 * ============================================================================
 *
 * COMO O FLUXO FUNCIONA:
 *   1. O perfil do animal abre o modal; o useDialog prende o foco nele.
 *   2. Passo 1: dados pessoais. "Continuar" chama validateStep; com erros, as mensagens
 *      aparecem ao lado dos campos e o foco vai para o primeiro campo inválido.
 *   3. Passo 2: perguntas de clique (rádios e caixas, com opções exclusivas) e texto livre.
 *   4. Passo 3: revisão, data sugerida e confirmações. "Enviar pedido" valida e envia:
 *        - composeRotina junta as respostas do passo 2 no campo "rotina";
 *        - o campo-isca "website" vai junto (contra robôs).
 *   5. Sucesso: tela com o protocolo (copiável) e os próximos passos.
 *      Erro: mensagem geral; se a API apontar campos, volta ao passo do primeiro erro.
 *   6. Fechar com dados não enviados pede confirmação.
 *
 * CONCEITOS IMPORTANTES PARA ESTUDAR:
 *   - Formulários em várias etapas ("wizard") com um único estado.
 *   - Validação por etapa e exibição de erros acessíveis (aria-invalid, aria-describedby).
 *   - Gerenciamento de foco (useRef + focus, requestAnimationFrame).
 *   - useId para ids únicos; htmlFor ligando label e campo.
 *   - Rádios x caixas de seleção; opções mutuamente exclusivas.
 *   - Spread de props ({...a11y("nome")}) e sobrescrita de props.
 *   - Expressões regulares (e-mail, \D) e formatação de telefone.
 *   - Datas: datetime-local, getTimezoneOffset, toISOString.
 *   - Tratamento de erros da API por campo; Math.min com spread.
 *   - Honeypot, noValidate, window.confirm, Clipboard API.
 * ============================================================================
 */
