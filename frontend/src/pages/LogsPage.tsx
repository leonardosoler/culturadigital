import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"
import type { LogEvento, PaginatedResponse } from "../types"
import { SpinnerOverlay } from "../components/ui/spinner"

const TIPO_CONFIG: Record<string, { label: string; cor: string }> = {
  scraping_ok:          { label: "Scraping OK",         cor: "bg-green-100 text-green-800" },
  scraping_erro:        { label: "Erro scraping",        cor: "bg-red-100 text-red-800" },
  ia_processado:        { label: "IA processada",        cor: "bg-blue-100 text-blue-800" },
  ia_erro:              { label: "Erro IA",              cor: "bg-red-100 text-red-800" },
  edital_criado:        { label: "Edital criado",        cor: "bg-indigo-100 text-indigo-800" },
  prazo_ignorado:       { label: "Prazo vencido",        cor: "bg-amber-100 text-amber-800" },
  acompanhamento_criado:{ label: "Acompanhamento",       cor: "bg-purple-100 text-purple-800" },
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
}

export function LogsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["logs"],
    queryFn: async () => {
      const { data } = await api.get<LogEvento[] | PaginatedResponse<LogEvento>>("/editais/logs/")
      return Array.isArray(data) ? data : data.results
    },
    refetchInterval: 30_000,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Logs do sistema</h1>
        <p className="text-sm text-slate-500">Últimos eventos de scraping, processamento por IA e ações de usuários. Atualiza a cada 30s.</p>
      </div>

      {isLoading && <SpinnerOverlay texto="Carregando logs..." />}
      {isError && <p className="text-sm text-red-600">Não foi possível carregar os logs.</p>}

      <div className="flex flex-col gap-2">
        {data?.map((log) => {
          const config = TIPO_CONFIG[log.tipo] ?? { label: log.tipo, cor: "bg-slate-100 text-slate-700" }
          return (
            <div key={log.id} className="flex items-start gap-3 rounded-md border border-slate-100 bg-white px-4 py-3 text-sm">
              <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${config.cor}`}>
                {config.label}
              </span>
              <div className="flex flex-1 flex-col gap-0.5">
                <p className="text-slate-800">{log.mensagem}</p>
                {log.edital_titulo && (
                  <p className="text-xs text-slate-400">Edital: {log.edital_titulo}</p>
                )}
              </div>
              <span className="shrink-0 text-xs text-slate-400">{formatarDataHora(log.criado_em)}</span>
            </div>
          )
        })}
        {data?.length === 0 && (
          <p className="text-sm text-slate-500">Nenhum evento registrado ainda.</p>
        )}
      </div>
    </div>
  )
}
