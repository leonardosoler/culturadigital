import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Search } from "lucide-react"
import { api } from "../lib/api"
import { formatarData, formatarMoeda } from "../lib/utils"
import type { Edital, PaginatedResponse, StatusProcessamentoIA } from "../types"
import { Card, CardContent } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { SpinnerOverlay } from "../components/ui/spinner"

const STATUS_LABELS: Record<StatusProcessamentoIA, string> = {
  pendente: "Pendente",
  processando: "Processando",
  processado: "Processado",
  erro: "Erro",
}

export function DashboardPage() {
  const [search, setSearch] = useState("")
  const [areaCultural, setAreaCultural] = useState("")
  const [status, setStatus] = useState<string>("")
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["editais", { search, areaCultural, status, page }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page }
      if (search) params.search = search
      if (areaCultural) params.area_cultural = areaCultural
      if (status) params.status_processamento_ia = status
      const { data } = await api.get<PaginatedResponse<Edital>>("/editais/", { params })
      return data
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Catálogo de editais</h1>
        <p className="text-sm text-slate-500">Editais culturais encontrados a partir das fontes cadastradas.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[240px] flex-1 flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Buscar</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              placeholder="Título, órgão, descrição..."
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex w-48 flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Área cultural</label>
          <Input
            value={areaCultural}
            onChange={(e) => {
              setPage(1)
              setAreaCultural(e.target.value)
            }}
            placeholder="Ex: Música, Artes visuais"
          />
        </div>
        <div className="flex w-48 flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Status de IA</label>
          <Select
            value={status || "todos"}
            onValueChange={(v) => {
              setPage(1)
              setStatus(v === "todos" ? "" : v)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <SpinnerOverlay texto="Carregando editais..." />}
      {isError && <p className="text-sm text-red-600">Não foi possível carregar os editais.</p>}

      {data && data.results.length === 0 && (
        <p className="text-sm text-slate-500">Nenhum edital encontrado com os filtros atuais.</p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.results.map((edital) => (
          <Link key={edital.id} to={`/editais/${edital.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex h-full flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 font-semibold text-slate-900">{edital.titulo}</h3>
                  <Badge status={edital.status_processamento_ia}>{STATUS_LABELS[edital.status_processamento_ia]}</Badge>
                </div>
                {edital.orgao_responsavel && <p className="text-sm text-slate-600">{edital.orgao_responsavel}</p>}
                {edital.area_cultural && (
                  <span className="inline-flex w-fit rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    {edital.area_cultural}
                  </span>
                )}
                <div className="mt-auto flex flex-col gap-1 pt-2 text-xs text-slate-500">
                  {edital.prazo_inscricao && <span>Prazo: {formatarData(edital.prazo_inscricao)}</span>}
                  {(edital.valor_minimo || edital.valor_maximo) && (
                    <span>
                      {edital.valor_minimo ? formatarMoeda(edital.valor_minimo) : "?"} -{" "}
                      {edital.valor_maximo ? formatarMoeda(edital.valor_maximo) : "?"}
                    </span>
                  )}
                  {edital.fonte_nome && <span>Fonte: {edital.fonte_nome}</span>}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {data && (data.next || data.previous) && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={!data.previous} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Anterior
          </Button>
          <span className="text-sm text-slate-500">Página {page}</span>
          <Button variant="outline" size="sm" disabled={!data.next} onClick={() => setPage((p) => p + 1)}>
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}
