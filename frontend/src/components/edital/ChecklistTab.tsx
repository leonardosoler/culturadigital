import { useState } from "react"
import type { ChangeEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Sparkles } from "lucide-react"
import { api, API_URL } from "../../lib/api"
import type { ChecklistItem, PaginatedResponse, StatusChecklist } from "../../types"
import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { SpinnerOverlay } from "../ui/spinner"

const STATUS_LABELS: Record<StatusChecklist, string> = {
  pendente: "Pendente",
  anexado: "Anexado",
  ok: "OK",
}

function urlAnexo(caminho: string | null): string | null {
  if (!caminho) return null
  if (caminho.startsWith("http")) return caminho
  const origem = API_URL.replace(/\/api\/?$/, "")
  return `${origem}${caminho}`
}

export function ChecklistTab({ acompanhamentoId }: { acompanhamentoId: number }) {
  const queryClient = useQueryClient()

  const { data: itens, isLoading } = useQuery({
    queryKey: ["checklist-itens", acompanhamentoId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ChecklistItem> | ChecklistItem[]>("/checklist-itens/", {
        params: { acompanhamento: acompanhamentoId },
      })
      return Array.isArray(data) ? data : data.results
    },
  })

  const gerarChecklist = useMutation({
    mutationFn: async () => {
      await api.post(`/acompanhamentos/${acompanhamentoId}/gerar-checklist/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-itens", acompanhamentoId] })
      queryClient.invalidateQueries({ queryKey: ["acompanhamentos"] })
    },
  })

  const atualizarItem = useMutation({
    mutationFn: async ({ id, dados }: { id: number; dados: Partial<ChecklistItem> | FormData }) => {
      const headers = dados instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined
      await api.patch(`/checklist-itens/${id}/`, dados, { headers })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-itens", acompanhamentoId] })
      queryClient.invalidateQueries({ queryKey: ["acompanhamentos"] })
    },
  })

  function onArquivoChange(itemId: number, e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    const formData = new FormData()
    formData.append("arquivo_anexo", arquivo)
    formData.append("status", "anexado")
    atualizarItem.mutate({ id: itemId, dados: formData })
  }

  if (isLoading) return <SpinnerOverlay texto="Carregando checklist..." />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Documentos e providências necessárias para esta inscrição.</p>
        <Button size="sm" onClick={() => gerarChecklist.mutate()} disabled={gerarChecklist.isPending}>
          <Sparkles className="h-4 w-4" />
          {gerarChecklist.isPending ? "Gerando..." : "Gerar checklist com IA"}
        </Button>
      </div>

      {gerarChecklist.isError && <p className="text-sm text-red-600">Não foi possível gerar o checklist. Verifique a configuração da IA.</p>}

      {itens && itens.length === 0 && (
        <p className="text-sm text-slate-500">Nenhum item no checklist ainda. Use o botão acima para gerar com IA a partir dos requisitos do edital.</p>
      )}

      <div className="flex flex-col gap-3">
        {itens?.map((item) => (
          <ChecklistItemCard key={item.id} item={item} onAtualizar={(dados) => atualizarItem.mutate({ id: item.id, dados })} onArquivo={(e) => onArquivoChange(item.id, e)} />
        ))}
      </div>
    </div>
  )
}

function ChecklistItemCard({
  item,
  onAtualizar,
  onArquivo,
}: {
  item: ChecklistItem
  onAtualizar: (dados: Partial<ChecklistItem>) => void
  onArquivo: (e: ChangeEvent<HTMLInputElement>) => void
}) {
  const [observacoes, setObservacoes] = useState(item.observacoes)
  const anexo = urlAnexo(item.arquivo_anexo)

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-900">{item.descricao}</p>
            {item.obrigatorio && <Badge>Obrigatório</Badge>}
          </div>
          <div className="w-36">
            <Select value={item.status} onValueChange={(v) => onAtualizar({ status: v as StatusChecklist })}>
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
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input type="file" onChange={onArquivo} className="text-sm text-slate-500" />
          {anexo && (
            <a href={anexo} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-600 hover:underline">
              Ver anexo
            </a>
          )}
        </div>

        <Textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          onBlur={() => {
            if (observacoes !== item.observacoes) onAtualizar({ observacoes })
          }}
          placeholder="Observações"
          rows={2}
        />
      </CardContent>
    </Card>
  )
}
