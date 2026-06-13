import { useState } from "react"
import type { FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Play, Plus } from "lucide-react"
import { api } from "../lib/api"
import type { Fonte, PaginatedResponse, TipoFonte } from "../types"
import { Card, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { SpinnerOverlay } from "../components/ui/spinner"

const TIPO_LABELS: Record<TipoFonte, string> = {
  mapas_cultural: "Mapas Culturais (instância)",
  manual: "Cadastro manual",
  outro: "Outra fonte",
}

export function FontesPage() {
  const queryClient = useQueryClient()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [nome, setNome] = useState("")
  const [tipo, setTipo] = useState<TipoFonte>("mapas_cultural")
  const [urlBase, setUrlBase] = useState("")
  const [limite, setLimite] = useState("30")
  const [erro, setErro] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["fontes"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Fonte> | Fonte[]>("/fontes/")
      return Array.isArray(data) ? data : data.results
    },
  })

  const criarFonte = useMutation({
    mutationFn: async () => {
      const config = tipo === "mapas_cultural" ? { limite: Number(limite) || 30 } : {}
      await api.post("/fontes/", { nome, tipo, url_base: urlBase, config })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fontes"] })
      setDialogAberto(false)
      setNome("")
      setUrlBase("")
      setLimite("30")
      setErro(null)
    },
    onError: () => setErro("Não foi possível salvar a fonte. Verifique os dados informados."),
  })

  const executarFonte = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/fontes/${id}/executar/`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fontes"] }),
  })

  const alternarAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: number; ativo: boolean }) => {
      await api.patch(`/fontes/${id}/`, { ativo })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fontes"] }),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    criarFonte.mutate()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fontes</h1>
          <p className="text-sm text-slate-500">Instâncias e fontes usadas para buscar novos editais automaticamente.</p>
        </div>
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Nova fonte
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar fonte</DialogTitle>
              <DialogDescription>
                Para instâncias do Mapas Culturais, informe a URL base (ex: https://mapacultural.secult.ce.gov.br).
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as TipoFonte)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="url_base">URL base</Label>
                <Input
                  id="url_base"
                  type="url"
                  value={urlBase}
                  onChange={(e) => setUrlBase(e.target.value)}
                  placeholder="https://..."
                  required={tipo === "mapas_cultural"}
                />
              </div>
              {tipo === "mapas_cultural" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="limite">Limite de oportunidades por busca</Label>
                  <Input id="limite" type="number" min={1} max={200} value={limite} onChange={(e) => setLimite(e.target.value)} />
                </div>
              )}
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <DialogFooter>
                <Button type="submit" disabled={criarFonte.isPending}>
                  {criarFonte.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <SpinnerOverlay texto="Carregando fontes..." />}

      {data && data.length === 0 && (
        <p className="text-sm text-slate-500">Nenhuma fonte cadastrada ainda. Cadastre uma instância do Mapas Culturais para começar.</p>
      )}

      <div className="flex flex-col gap-3">
        {data?.map((fonte) => (
          <Card key={fonte.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{fonte.nome}</h3>
                  <Badge>{TIPO_LABELS[fonte.tipo]}</Badge>
                  {!fonte.ativo && <Badge status="descartado">Inativa</Badge>}
                </div>
                {fonte.url_base && <p className="text-sm text-slate-500">{fonte.url_base}</p>}
                {fonte.ultima_execucao && (
                  <p className="mt-1 text-xs text-slate-400">
                    Última execução: {new Date(fonte.ultima_execucao).toLocaleString("pt-BR")}
                    {fonte.ultimo_resultado ? ` — ${fonte.ultimo_resultado}` : ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alternarAtivo.mutate({ id: fonte.id, ativo: !fonte.ativo })}
                  disabled={alternarAtivo.isPending}
                >
                  {fonte.ativo ? "Desativar" : "Ativar"}
                </Button>
                {fonte.tipo === "mapas_cultural" && (
                  <Button size="sm" onClick={() => executarFonte.mutate(fonte.id)} disabled={executarFonte.isPending}>
                    <Play className="h-4 w-4" />
                    Executar agora
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
