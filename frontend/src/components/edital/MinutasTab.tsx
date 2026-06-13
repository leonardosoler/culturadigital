import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import ReactMarkdown from "react-markdown"
import { Download, Sparkles } from "lucide-react"
import { api } from "../../lib/api"
import type { DocumentoGerado, PaginatedResponse, TipoMinuta } from "../../types"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { SpinnerOverlay } from "../ui/spinner"

const TIPO_LABELS: Record<TipoMinuta, string> = {
  carta_apresentacao: "Carta de apresentação",
  projeto: "Projeto",
  orcamento: "Orçamento",
}

export function MinutasTab({ acompanhamentoId }: { acompanhamentoId: number }) {
  const queryClient = useQueryClient()

  const { data: documentos, isLoading } = useQuery({
    queryKey: ["minutas", acompanhamentoId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<DocumentoGerado> | DocumentoGerado[]>("/minutas/", {
        params: { acompanhamento: acompanhamentoId },
      })
      return Array.isArray(data) ? data : data.results
    },
  })

  const gerarMinuta = useMutation({
    mutationFn: async (tipo: TipoMinuta) => {
      await api.post("/minutas/gerar/", { acompanhamento: acompanhamentoId, tipo })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["minutas", acompanhamentoId] }),
  })

  async function exportarDocx(documento: DocumentoGerado) {
    const response = await api.get(`/minutas/${documento.id}/exportar/`, { responseType: "blob" })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement("a")
    link.href = url
    link.download = `${documento.tipo}_v${documento.versao}.docx`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) return <SpinnerOverlay texto="Carregando minutas..." />

  const ultimaPorTipo = new Map<TipoMinuta, DocumentoGerado>()
  for (const doc of documentos ?? []) {
    const atual = ultimaPorTipo.get(doc.tipo)
    if (!atual || doc.versao > atual.versao) ultimaPorTipo.set(doc.tipo, doc)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">
        Gere minutas a partir dos dados do edital e da sua organização. Cada geração cria uma nova versão.
      </p>

      {(Object.keys(TIPO_LABELS) as TipoMinuta[]).map((tipo) => {
        const documento = ultimaPorTipo.get(tipo)
        const gerando = gerarMinuta.isPending && gerarMinuta.variables === tipo
        return (
          <Card key={tipo}>
            <CardHeader className="flex-row items-center justify-between gap-2 border-b-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{TIPO_LABELS[tipo]}</CardTitle>
                {documento && <Badge>v{documento.versao}</Badge>}
              </div>
              <div className="flex gap-2">
                {documento && (
                  <Button variant="outline" size="sm" onClick={() => exportarDocx(documento)}>
                    <Download className="h-4 w-4" />
                    Exportar .docx
                  </Button>
                )}
                <Button size="sm" onClick={() => gerarMinuta.mutate(tipo)} disabled={gerarMinuta.isPending}>
                  <Sparkles className="h-4 w-4" />
                  {gerando ? "Gerando..." : documento ? "Gerar nova versão" : "Gerar"}
                </Button>
              </div>
            </CardHeader>
            {documento && (
              <CardContent>
                <div className="markdown-content max-w-none text-sm text-slate-700">
                  <ReactMarkdown>{documento.conteudo}</ReactMarkdown>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}

      {gerarMinuta.isError && <p className="text-sm text-red-600">Não foi possível gerar a minuta. Verifique a configuração da IA.</p>}
    </div>
  )
}
