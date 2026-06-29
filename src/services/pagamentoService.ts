/**
 * Serviço de pagamento via Asaas (melhor opção para clínicas BR)
 * Alternativa: MercadoPago
 * Asaas: https://www.asaas.com/
 */

const ASAAS_URL   = process.env.ASAAS_SANDBOX === "true"
  ? "https://sandbox.asaas.com/api/v3"
  : "https://www.asaas.com/api/v3";
const ASAAS_KEY   = process.env.ASAAS_API_KEY!;

export interface ClienteAsaas {
  id: string;
  name: string;
  cpfCnpj: string;
  phone?: string;
}

export interface CobrancaAsaas {
  id:          string;
  invoiceUrl:  string;
  bankSlipUrl: string;
  pixQrCode?:  string;
  status:      string;
  value:       number;
}

/** Cria ou busca cliente no Asaas */
export async function criarOuBuscarCliente(nome: string, cpf: string, telefone?: string): Promise<string | null> {
  if (!ASAAS_KEY) return null;

  // Tenta buscar por CPF
  const busca = await fetch(`${ASAAS_URL}/customers?cpfCnpj=${cpf.replace(/\D/g, "")}`, {
    headers: { access_token: ASAAS_KEY },
  }).then(r => r.json() as any).catch(() => null);

  if (busca?.data?.[0]?.id) return busca.data[0].id;

  // Cria novo cliente
  const novo = await fetch(`${ASAAS_URL}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", access_token: ASAAS_KEY },
    body: JSON.stringify({ name: nome, cpfCnpj: cpf.replace(/\D/g, ""), phone: telefone }),
  }).then(r => r.json() as any).catch(() => null);

  return novo?.id || null;
}

/** Gera link de pagamento Pix para o sinal */
export async function gerarLinkPagamento(params: {
  clienteId: string;
  descricao: string;
  valor: number;
  dueDate: string; // YYYY-MM-DD
  externalRef?: string;
}): Promise<CobrancaAsaas | null> {
  if (!ASAAS_KEY) {
    // Modo demo: retorna link fictício para testar
    return {
      id: `demo_${Date.now()}`,
      invoiceUrl: `https://sandbox.asaas.com/i/demo_${Date.now()}`,
      bankSlipUrl: "",
      status: "PENDING",
      value: params.valor,
    };
  }

  const cobranca = await fetch(`${ASAAS_URL}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", access_token: ASAAS_KEY },
    body: JSON.stringify({
      customer:        params.clienteId,
      billingType:     "PIX",
      value:           params.valor,
      dueDate:         params.dueDate,
      description:     params.descricao,
      externalReference: params.externalRef,
    }),
  }).then(r => r.json() as any).catch(() => null);

  return cobranca?.id ? cobranca : null;
}

/** Webhook Asaas — retorna true se pagamento confirmado */
export function pagamentoConfirmado(webhook: any): boolean {
  return ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"].includes(webhook?.event);
}
