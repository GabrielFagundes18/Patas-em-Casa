// O quê: importa estado, animação, ícones, serviço de envio e estilos do formulário.
// Como: useState controla envio, erro e confirmação; motion anima o modal.
// Para quê: coletar e registrar a solicitação de adoção de um animal específico.
import { useId, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useDialog } from "../../hooks/useDialog";
import { enviarPedidoAdocao } from "../../services/adocaoService";
import "./AdoptionFormModal.css";

// O quê: traduz a falha do envio em mensagens exibíveis.
// Como: usa os detalhes por campo da API quando existem e trata falta de conexão separadamente.
// Para quê: mostrar ao interessado exatamente o que precisa corrigir.
function lerErro(error) {
  if (!error?.response) {
    return {
      mensagem: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      detalhes: [],
    };
  }

  const apiError = error.response.data?.error;
  return {
    mensagem: apiError?.message || "Não foi possível enviar sua solicitação agora.",
    detalhes: (apiError?.details || []).map((detail) => detail.message),
  };
}

export function AdoptionFormModal({ pet, onClose, onBack }) {
  // O quê: liga o título ao diálogo e aplica teclado, foco e trava de rolagem.
  // Como: useId gera o id do título; useDialog fecha com Escape e mantém o Tab no modal.
  // Para quê: tornar o formulário utilizável por teclado e leitores de tela.
  const titleId = useId();
  const dialogRef = useDialog(onClose);

  // O quê: armazena o pedido criado, o estado de envio e o erro atual.
  // Como: pedido preenchido troca o formulário pela confirmação com protocolo.
  // Para quê: impedir envios duplicados e informar o próximo passo.
  const [pedido, setPedido] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  // O quê: envia o formulário para o backend.
  // Como: lê os campos com FormData, chama a API e guarda o protocolo ou o erro retornado.
  // Para quê: registrar a solicitação para triagem da equipe.
  async function handleSubmit(event) {
    event.preventDefault();
    const dados = new FormData(event.currentTarget);
    setEnviando(true);
    setErro(null);

    try {
      const resultado = await enviarPedidoAdocao({
        animal_id: pet?.id,
        nome: dados.get("nome"),
        email: dados.get("email"),
        telefone: dados.get("telefone"),
        cidade: dados.get("cidade"),
        rotina: dados.get("rotina"),
        ambiente_seguro: dados.get("ambiente_seguro") === "on",
        ciente_pos_adocao: dados.get("ciente_pos_adocao") === "on",
      });
      setPedido(resultado);
    } catch (error) {
      setErro(lerErro(error));
    } finally {
      setEnviando(false);
    }
  }

  // O quê: renderiza o modal de pré-adoção e seus dois estados possíveis.
  // Como: a existência de pedido alterna entre confirmação e formulário associado ao pet recebido.
  // Para quê: concluir a jornada iniciada no detalhe do animal.
  return (
    <motion.div
      className="pet-detail-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.section
        ref={dialogRef}
        className="adoption-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={{ delay: 0.12, duration: 0.35 }}
      >
        <button type="button" className="detail-back" onClick={onBack ?? onClose}>
          <ArrowLeft size={17} aria-hidden="true" /> Voltar para a ficha
        </button>

        <div className="adoption-form-body">
          <div className="adoption-form-summary">
            <span className="catalog-eyebrow">Pré-adoção</span>
            <h2 id={titleId}>Quero adotar {pet?.name}</h2>
            <p>{pet?.meta}</p>
          </div>

          {pedido ? (
            <div className="adoption-success" role="status">
              <Check size={28} aria-hidden="true" />
              <h3>Solicitação enviada</h3>
              <p>
                Seu protocolo é <strong className="adoption-protocol">{pedido.protocolo}</strong>.
                Nossa equipe vai avaliar o perfil e entrar em contato em até 48 horas
                para os próximos passos.
              </p>
              <button type="button" className="catalog-primary-button" onClick={onClose}>
                Fechar
              </button>
            </div>
          ) : (
            <form className="catalog-adoption-form" onSubmit={handleSubmit} aria-busy={enviando}>
              <div className="catalog-form-grid">
                <label>
                  Nome completo
                  <input type="text" name="nome" placeholder="Seu nome" autoComplete="name" minLength={2} maxLength={150} required />
                </label>
                <label>
                  E-mail
                  <input type="email" name="email" placeholder="voce@email.com" autoComplete="email" maxLength={150} required />
                </label>
                <label>
                  Telefone
                  <input type="tel" name="telefone" placeholder="(11) 99999-9999" autoComplete="tel" maxLength={20} required />
                </label>
                <label>
                  Cidade
                  <input type="text" name="cidade" placeholder="Sua cidade" autoComplete="address-level2" minLength={2} maxLength={100} required />
                </label>
              </div>

              <label>
                Conte um pouco sobre seu lar e rotina
                <textarea name="rotina" rows="4" minLength={10} maxLength={2000} required />
              </label>

              <div className="catalog-form-checks">
                <label>
                  <input type="checkbox" name="ambiente_seguro" required />
                  Tenho ambiente seguro para o animal.
                </label>
                <label>
                  <input type="checkbox" name="ciente_pos_adocao" required />
                  Estou atento(a) ao acompanhamento pós-adoção.
                </label>
              </div>

              {erro ? (
                <div className="adoption-form-error" role="alert">
                  <p>{erro.mensagem}</p>
                  {erro.detalhes.length > 0 ? (
                    <ul>
                      {erro.detalhes.map((detalhe) => <li key={detalhe}>{detalhe}</li>)}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              <button type="submit" className="catalog-primary-button" disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar formulário"}
              </button>
            </form>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
