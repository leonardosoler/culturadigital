import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, Clock, FileText, Radio, Users } from "lucide-react"
import { api } from "../lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { SpinnerOverlay } from "../components/ui/spinner"

interface DadosSaude {
  editais: {
    total: number
    sem_prazo: number
    sem_categoria: number
    com_erro_ia: number
    pendentes_ia: number
  }
  fontes: {
    total: number
    ativas: number
    com_erro: number
    sem_execucao: number
  }
  acompanhamentos: {
    total: number
    aprovados: number
    notificacoes_30d: number
  }
  logs: {
    scraping_erros_30d: number
    ia_erros_30d: number
    editais_criados_30d: number
  }
}

function Metrica({ label, valor, alerta }: { label: string; valor: number; alerta?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-semibold ${alerta && valor > 0 ? "text-red-600" : "text-slate-900"}`}>
        {valor}
        {alerta && valor > 0 && <AlertTriangle className="ml-1 inline h-3.5 w-3.5 text-red-500" />}
      </span>
    </div>
  )
}

export function SaudePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["saude"],
    queryFn: async () => {
      const { data } = await api.get<DadosSaude>("/editais/saude/")
      return data
    },
    refetchInterval: 60_000,
  })

  const semProblemas =
    data &&
    data.editais.com_erro_ia === 0 &&
    data.fontes.com_erro === 0 &&
    data.logs.scraping_erros_30d === 0 &&
    data.logs.ia_erros_30d === 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Saúde do sistema</h1>
          <p className="text-sm text-slate-500">Visão geral do estado operacional. Atualiza a cada 60s.</p>
        </div>
        {data && (
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${semProblemas ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {semProblemas
              ? <><CheckCircle2 className="h-4 w-4" /> Tudo OK</>
              : <><AlertTriangle className="h-4 w-4" /> Atenção necessária</>}
          </span>
        )}
      </div>

      {isLoading && <SpinnerOverlay texto="Carregando..." />}
      {isError && <p className="text-sm text-red-600">Não foi possível carregar os dados de saúde.</p>}

      {data && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <FileText className="h-4 w-4" /> Editais
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              <Metrica label="Total no catálogo" valor={data.editais.total} />
              <Metrica label="Sem prazo definido" valor={data.editais.sem_prazo} alerta />
              <Metrica label="Categoria padrão (cultural)" valor={data.editais.sem_categoria} alerta />
              <Metrica label="Erro no processamento IA" valor={data.editais.com_erro_ia} alerta />
              <Metrica label="Aguardando processamento" valor={data.editais.pendentes_ia} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Radio className="h-4 w-4" /> Fontes
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              <Metrica label="Total de fontes" valor={data.fontes.total} />
              <Metrica label="Fontes ativas" valor={data.fontes.ativas} />
              <Metrica label="Com erro no último scraping" valor={data.fontes.com_erro} alerta />
              <Metrica label="Nunca executadas" valor={data.fontes.sem_execucao} alerta />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Users className="h-4 w-4" /> Acompanhamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              <Metrica label="Total de acompanhamentos" valor={data.acompanhamentos.total} />
              <Metrica label="Com interesse confirmado" valor={data.acompanhamentos.aprovados} />
              <Metrica label="Notificações enviadas (30d)" valor={data.acompanhamentos.notificacoes_30d} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Clock className="h-4 w-4" /> Últimos 30 dias
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              <Metrica label="Novos editais encontrados" valor={data.logs.editais_criados_30d} />
              <Metrica label="Erros de scraping" valor={data.logs.scraping_erros_30d} alerta />
              <Metrica label="Erros de IA" valor={data.logs.ia_erros_30d} alerta />
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  )
}
