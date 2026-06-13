import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import { ExternalLink, Sparkles } from "lucide-react"
import { api } from "../lib/api"
import { formatarData, formatarMoeda } from "../lib/utils"
import type { Acompanhamento, EditalDetalhe, PaginatedResponse, StatusAcompanhamento, StatusProcessamentoIA } from "../types"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { SpinnerOverlay } from "../components/ui/spinner"
import { ChecklistTab } from "../components/edital/ChecklistTab"
import { MinutasTab } from "../components/edital/MinutasTab"

const STATUS_IA_LABELS: Record<StatusProcessamentoIA, string> = {
  pendente: "Pendente",
  processando: "Processando",
  processado: "Processado",
  erro: "Erro",
}

const STATUS_ACOMP_LABELS: Record<StatusAcompanhamento, string> = {
  novo: "Novo",
  em_analise: "Em análise",
  elegivel: "Elegível",
  inscrito: "Inscrito",
  concluido: "Concluído",
  descartado: "Descartado",
}

export function EditalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: edital, isLoading } = useQuery({
    queryKey: ["edital", id],
    queryFn: async () => {
      const { data } = await api.get<EditalDetalhe>(`/editais/${id}/`)
      return data
    },
    refetchInterval: (query) => (query.state.data?.status_processamento_ia === "processando" ? 4000 : false),
  })

  const { data: acompanhamentos } = useQuery({
    queryKey: ["acompanhamentos", { edital: id }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Acompanhamento> | Acompanhamento[]>("/acompanhamentos/", {
        params: { edital: id },
      })
      return Array.isArray(data) ? data : data.results
    },
    enabled: !!id,
  })

  const acompanhamento = acompanhamentos?.[0]

  const processarIA = useMutation({
    mutationFn: async () => {
      await api.post(`/editais/${id}/processar-ia/`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["edital", id] }),
  })

  const acompanhar = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<Acompanhamento>("/acompanhamentos/", { edital: Number(id), status: "novo" })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acompanhamentos", { edital: id }] })
      queryClient.invalidateQueries({ queryKey: ["acompanhamentos"] })
    },
  })

  const atualizarStatus = useMutation({
    mutationFn: async (status: StatusAcompanhamento) => {
      if (!acompanhamento) return
      await api.patch(`/acompanhamentos/${acompanhamento.id}/`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acompanhamentos", { edital: id }] })
      queryClient.invalidateQueries({ queryKey: ["acompanhamentos"] })
    },
  })

  if (isLoading || !edital) return <SpinnerOverlay texto="Carregando edital..." />

  const requisitos = edital.requisitos_ia ?? {}

  return (
    <div className="flex flex-col gap-6">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-indigo-600">
        ← Voltar
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{edital.titulo}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            {edital.orgao_responsavel && <span>{edital.orgao_responsavel}</span>}
            {edital.area_cultural && (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">{edital.area_cultural}</span>
            )}
            {edital.fonte_nome && <span>Fonte: {edital.fonte_nome}</span>}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            {edital.prazo_inscricao && <span>Prazo de inscrição: {formatarData(edital.prazo_inscricao)}</span>}
            {(edital.valor_minimo || edital.valor_maximo) && (
              <span>
                Valores: {formatarMoeda(edital.valor_minimo)} - {formatarMoeda(edital.valor_maximo)}
              </span>
            )}
            {edital.url_origem && (
              <a href={edital.url_origem} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline">
                <ExternalLink className="h-3.5 w-3.5" />
                Página de origem
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Badge status={edital.status_processamento_ia}>IA: {STATUS_IA_LABELS[edital.status_processamento_ia]}</Badge>
            <Button variant="outline" size="sm" onClick={() => processarIA.mutate()} disabled={processarIA.isPending || edital.status_processamento_ia === "processando"}>
              <Sparkles className="h-4 w-4" />
              {edital.status_processamento_ia === "processado" ? "Reprocessar" : "Processar com IA"}
            </Button>
          </div>

          {acompanhamento ? (
            <div className="w-48">
              <Select value={acompanhamento.status} onValueChange={(v) => atualizarStatus.mutate(v as StatusAcompanhamento)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_ACOMP_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <Button size="sm" onClick={() => acompanhar.mutate()} disabled={acompanhar.isPending}>
              {acompanhar.isPending ? "Adicionando..." : "Acompanhar este edital"}
            </Button>
          )}
        </div>
      </div>

      {edital.status_processamento_ia === "erro" && edital.erro_processamento && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="text-sm text-red-700">Erro no processamento por IA: {edital.erro_processamento}</CardContent>
        </Card>
      )}

      <Tabs defaultValue="resumo">
        <TabsList>
          <TabsTrigger value="resumo">Resumo IA</TabsTrigger>
          <TabsTrigger value="requisitos">Requisitos</TabsTrigger>
          <TabsTrigger value="original">Documento original</TabsTrigger>
          {acompanhamento && <TabsTrigger value="checklist">Checklist</TabsTrigger>}
          {acompanhamento && <TabsTrigger value="minutas">Minutas</TabsTrigger>}
        </TabsList>

        <TabsContent value="resumo">
          {edital.resumo_ia ? (
            <Card>
              <CardContent className="markdown-content max-w-none text-sm text-slate-700">
                <ReactMarkdown>{edital.resumo_ia}</ReactMarkdown>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-slate-500">
              {edital.status_processamento_ia === "processando"
                ? "A IA está processando este edital..."
                : "Este edital ainda não foi processado pela IA. Clique em \"Processar com IA\" para gerar o resumo e os requisitos."}
            </p>
          )}
        </TabsContent>

        <TabsContent value="requisitos">
          {Object.keys(requisitos).length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum requisito extraído ainda.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {requisitos.elegibilidade && (
                <Card>
                  <CardContent>
                    <h3 className="mb-1 font-semibold text-slate-900">Elegibilidade</h3>
                    <p className="text-sm text-slate-700">{requisitos.elegibilidade}</p>
                  </CardContent>
                </Card>
              )}

              {requisitos.documentos_exigidos && requisitos.documentos_exigidos.length > 0 && (
                <Card>
                  <CardContent>
                    <h3 className="mb-2 font-semibold text-slate-900">Documentos exigidos</h3>
                    <ul className="list-disc pl-5 text-sm text-slate-700">
                      {requisitos.documentos_exigidos.map((doc, i) => (
                        <li key={i}>{doc}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {requisitos.prazos && requisitos.prazos.length > 0 && (
                <Card>
                  <CardContent>
                    <h3 className="mb-2 font-semibold text-slate-900">Prazos</h3>
                    <ul className="flex flex-col gap-1 text-sm text-slate-700">
                      {requisitos.prazos.map((prazo, i) => (
                        <li key={i}>
                          <span className="font-medium">{prazo.data}</span> — {prazo.descricao}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {requisitos.valores && (
                <Card>
                  <CardContent>
                    <h3 className="mb-1 font-semibold text-slate-900">Valores</h3>
                    <p className="text-sm text-slate-700">
                      {formatarMoeda(requisitos.valores.valor_minimo)} - {formatarMoeda(requisitos.valores.valor_maximo)}
                    </p>
                    {requisitos.valores.descricao && <p className="mt-1 text-sm text-slate-500">{requisitos.valores.descricao}</p>}
                  </CardContent>
                </Card>
              )}

              {requisitos.criterios_selecao && requisitos.criterios_selecao.length > 0 && (
                <Card>
                  <CardContent>
                    <h3 className="mb-2 font-semibold text-slate-900">Critérios de seleção</h3>
                    <ul className="list-disc pl-5 text-sm text-slate-700">
                      {requisitos.criterios_selecao.map((criterio, i) => (
                        <li key={i}>{criterio}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="original">
          <div className="flex flex-col gap-3">
            {edital.arquivo_pdf && (
              <a href={edital.arquivo_pdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
                <ExternalLink className="h-3.5 w-3.5" />
                Ver PDF enviado
              </a>
            )}
            {edital.descricao && (
              <Card>
                <CardContent>
                  <h3 className="mb-1 font-semibold text-slate-900">Descrição</h3>
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{edital.descricao}</p>
                </CardContent>
              </Card>
            )}
            {edital.texto_extraido ? (
              <Card>
                <CardContent>
                  <h3 className="mb-1 font-semibold text-slate-900">Texto extraído</h3>
                  <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-xs text-slate-600">{edital.texto_extraido}</pre>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-slate-500">Nenhum texto extraído ainda.</p>
            )}
          </div>
        </TabsContent>

        {acompanhamento && (
          <TabsContent value="checklist">
            <ChecklistTab acompanhamentoId={acompanhamento.id} />
          </TabsContent>
        )}

        {acompanhamento && (
          <TabsContent value="minutas">
            <MinutasTab acompanhamentoId={acompanhamento.id} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
