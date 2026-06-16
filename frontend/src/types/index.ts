export interface Usuario {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
}

export interface Organizacao {
  id: number
  nome: string
  cnpj: string
  dados_cadastrais: Record<string, string>
  criada_em: string
}

export type Papel = "admin" | "membro"

export interface Membership {
  id: number
  usuario: Usuario
  papel: Papel
  criado_em: string
}

export type CategoriaEdital =
  | "cultural"
  | "licitacao"
  | "bolsa"
  | "concurso_publico"
  | "chamada_pesquisa"
  | "outros"

export const CATEGORIAS_EDITAL: Record<CategoriaEdital, string> = {
  cultural: "Cultural",
  licitacao: "Licitação",
  bolsa: "Bolsa / Financiamento",
  concurso_publico: "Concurso Público",
  chamada_pesquisa: "Chamada de Pesquisa",
  outros: "Outros",
}

export type TipoLogEvento =
  | "scraping_ok"
  | "scraping_erro"
  | "ia_processado"
  | "ia_erro"
  | "edital_criado"
  | "prazo_ignorado"
  | "acompanhamento_criado"

export interface LogEvento {
  id: number
  tipo: TipoLogEvento
  mensagem: string
  detalhes: Record<string, unknown>
  edital: number | null
  edital_titulo: string | null
  organizacao: number | null
  criado_em: string
}

export type TipoFonte = "mapas_cultural" | "manual" | "outro"

export interface Fonte {
  id: number
  nome: string
  tipo: TipoFonte
  url_base: string
  config: Record<string, unknown>
  estado: string
  ativo: boolean
  ultima_execucao: string | null
  ultimo_resultado: string
  criada_em: string
}

export type StatusProcessamentoIA = "pendente" | "processando" | "processado" | "erro"

export interface PrazoIA {
  descricao: string
  data: string
}

export interface ValoresIA {
  valor_minimo: number | null
  valor_maximo: number | null
  descricao: string
}

export interface RequisitosIA {
  resumo?: string
  orgao_responsavel?: string
  area_cultural?: string
  elegibilidade?: string
  documentos_exigidos?: string[]
  prazos?: PrazoIA[]
  valores?: ValoresIA
  criterios_selecao?: string[]
}

export interface Edital {
  id: number
  titulo: string
  categoria: CategoriaEdital
  fonte: number | null
  fonte_nome: string | null
  url_origem: string
  orgao_responsavel: string
  area_cultural: string
  estado: string
  data_publicacao: string | null
  prazo_inscricao: string | null
  valor_minimo: string | null
  valor_maximo: string | null
  status_processamento_ia: StatusProcessamentoIA
  score_relevancia: number | null
  criado_em: string
}

export interface EditalDetalhe extends Edital {
  identificador_externo: string
  descricao: string
  arquivo_pdf: string | null
  texto_extraido: string
  resumo_ia: string
  requisitos_ia: RequisitosIA
  erro_processamento: string
  atualizado_em: string
}

export interface Grupo {
  id: number
  nome: string
  descricao: string
  estados: string[]
  areas_culturais: string[]
  categorias: CategoriaEdital[]
  ativo: boolean
  membros: Usuario[]
  total_membros: number
  criado_em: string
}

export type StatusAcompanhamento =
  | "novo"
  | "em_analise"
  | "elegivel"
  | "inscrito"
  | "concluido"
  | "descartado"

export type StatusChecklist = "pendente" | "anexado" | "ok"

export interface ChecklistItem {
  id: number
  acompanhamento: number
  descricao: string
  obrigatorio: boolean
  status: StatusChecklist
  arquivo_anexo: string | null
  observacoes: string
  criado_em: string
}

export interface ItemOrcamento {
  id: number
  acompanhamento: number
  categoria: string
  descricao: string
  quantidade: string
  valor_unitario: string
  valor_total: string
  criado_em: string
}

export interface Despesa {
  id: number
  acompanhamento: number
  categoria: string
  descricao: string
  valor: string
  data: string | null
  comprovante: string | null
  criado_em: string
}

export interface Acompanhamento {
  id: number
  organizacao: number
  edital: number
  edital_detalhe: Edital
  status: StatusAcompanhamento
  aprovado: boolean
  notas: string
  checklist: ChecklistItem[]
  itens_orcamento: ItemOrcamento[]
  despesas: Despesa[]
  criado_em: string
  atualizado_em: string
}

export type CategoriaDocumentoOrganizacao = "juridico" | "pessoal" | "portfolio" | "comprovante" | "outro"

export interface DocumentoOrganizacao {
  id: number
  organizacao: number
  nome: string
  categoria: CategoriaDocumentoOrganizacao
  arquivo: string
  validade: string | null
  observacoes: string
  criado_em: string
}

export type TipoMinuta = "carta_apresentacao" | "projeto" | "orcamento"

export interface DocumentoGerado {
  id: number
  acompanhamento: number
  tipo: TipoMinuta
  conteudo: string
  versao: number
  gerado_em: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
