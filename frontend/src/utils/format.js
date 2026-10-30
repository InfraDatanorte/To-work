export const moeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
export const nomesStatus = { PENDENTE: 'Aguardando orçamento', ORCADO: 'Orçamento recebido', ACEITO: 'Serviço aceito', CONCLUIDO: 'Concluído', RECUSADO: 'Recusado', CANCELADO: 'Cancelado' };
