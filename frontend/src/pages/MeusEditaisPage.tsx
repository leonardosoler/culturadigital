import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { api } from "../lib/api"
import { formatarData, formatarMoeda } from "../lib/utils"
import type { Acompanhamento, PaginatedResponse, StatusAcompanhamento } from "../types"
import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { SpinnerOverlay } from "../components/ui/spinner"

const STATUS_LABELS: Record<StatusAcompanhamento, string> = {
  novo: "Novo",
  em_analise: "Em análise",
  elegivel: "Elegível",
  inscrito: "Inscrito",
  concluido: "Concluído",
  descartado: "Descartado",
}

export function MeusEditaisPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<string>("")

  const { data, isLoading } = useQuery({
    queryKey: ["acompanhamentos", { status }],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (status) params.status = status
      const { data } = await api.get<PaginatedResponse<Acompanhamento> | Acompanhamento[]>("/acompanhamentos/", { params })
      return Array.isArray(data) ? data : data.results
    },
  })

  const atualizarStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: StatusAcompanhamento }) => {
      await api.patch(`/acompanhamentos/${id}/`, { status })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["acompanhamentos"] }),
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meus editais</h1>
          <p className="text-sm text-slate-500">Editais que sua organização está acompanhando.</p>
        </div>
        <div className="w-52">
          <Select value={status || "todos"} onValueChange={(v) => setStatus(v === "todos" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <SpinnerOverlay texto="Carregando..." />}

      {data && data.length === 0 && (
        <p className="text-sm text-slate-500">
          Nenhum edital acompanhado ainda. Vá ao{" "}
          <Link to="/" className="font-medium text-indigo-600 hover:underline">
            catálogo
          </Link>{" "}
          e clique em "Acompanhar" em algum edital.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {data?.map((acompanhamento) => {
          const edital = acompanhamento.edital_detalhe
          const concluidos = acompanhamento.checklist.filter((c) => c.status === "ok").length
          return (
            <Card key={acompanhamento.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Link to={`/editais/${edital.id}`} className="font-semibold text-slate-900 hover:text-indigo-700 hover:underline">
                    {edital.titulo}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {edital.orgao_responsavel && <span>{edital.orgao_responsavel}</span>}
                    {edital.prazo_inscricao && <span>Prazo: {formatarData(edital.prazo_inscricao)}</span>}
                    {(edital.valor_minimo || edital.valor_maximo) && (
                      <span>
                        {formatarMoeda(edital.valor_minimo)} - {formatarMoeda(edital.valor_maximo)}
                      </span>
                    )}
                    {acompanhamento.checklist.length > 0 && (
                      <span>
                        Checklist: {concluidos}/{acompanhamento.checklist.length}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-44">
                  <Select
                    value={acompanhamento.status}
                    onValueChange={(v) => atualizarStatus.mutate({ id: acompanhamento.id, status: v as StatusAcompanhamento })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Badge status={acompanhamento.status}>{STATUS_LABELS[acompanhamento.status]}</Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
