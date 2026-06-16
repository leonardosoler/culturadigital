import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, X } from "lucide-react"
import { isAxiosError } from "axios"
import { api } from "../lib/api"
import type { CategoriaEdital, Grupo, Membership, Organizacao, Papel } from "../types"
import { CATEGORIAS_EDITAL } from "../types"
import { ESTADOS_BRASIL } from "../lib/estados"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { SpinnerOverlay } from "../components/ui/spinner"

function GruposSection({ membros }: { membros: Membership[] }) {
  const queryClient = useQueryClient()
  const [novoNome, setNovoNome] = useState("")
  const [novaDescricao, setNovaDescricao] = useState("")
  const [novosEstados, setNovosEstados] = useState<string[]>([])
  const [novasAreas, setNovasAreas] = useState<string[]>([])
  const [novasCategorias, setNovasCategorias] = useState<CategoriaEdital[]>([])
  const [areaInput, setAreaInput] = useState("")
  const [erroGrupo, setErroGrupo] = useState<string | null>(null)

  const { data: grupos, isLoading } = useQuery({
    queryKey: ["grupos"],
    queryFn: async () => {
      const { data } = await api.get<Grupo[]>("/auth/grupos/")
      return data
    },
  })

  const criarGrupo = useMutation({
    mutationFn: async () => {
      await api.post("/auth/grupos/", { nome: novoNome, descricao: novaDescricao, estados: novosEstados, areas_culturais: novasAreas, categorias: novasCategorias })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupos"] })
      setNovoNome("")
      setNovaDescricao("")
      setNovosEstados([])
      setNovasAreas([])
      setNovasCategorias([])
      setAreaInput("")
      setErroGrupo(null)
    },
    onError: () => setErroGrupo("Não foi possível criar o grupo."),
  })

  const excluirGrupo = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/auth/grupos/${id}/`) },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grupos"] }),
  })

  const adicionarMembro = useMutation({
    mutationFn: async ({ grupoId, usuarioId }: { grupoId: number; usuarioId: number }) => {
      await api.post(`/auth/grupos/${grupoId}/membros/`, { usuario_id: usuarioId })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grupos"] }),
  })

  const removerMembro = useMutation({
    mutationFn: async ({ grupoId, usuarioId }: { grupoId: number; usuarioId: number }) => {
      await api.delete(`/auth/grupos/${grupoId}/membros/${usuarioId}/`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grupos"] }),
  })

  function toggleEstado(sigla: string) {
    setNovosEstados((prev) => prev.includes(sigla) ? prev.filter((e) => e !== sigla) : [...prev, sigla])
  }

  function toggleCategoria(cat: CategoriaEdital) {
    setNovasCategorias((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat])
  }

  function adicionarArea() {
    const area = areaInput.trim()
    if (area && !novasAreas.includes(area)) {
      setNovasAreas((prev) => [...prev, area])
    }
    setAreaInput("")
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Grupos de interesse</h2>
        <p className="text-sm text-slate-500">Crie grupos com filtros de estado e área para segmentar o catálogo por perfil de interesse.</p>
      </div>

      {isLoading && <SpinnerOverlay />}

      {grupos?.map((grupo) => {
        const membroIds = new Set(grupo.membros.map((m) => m.id))
        const membrosFora = membros.filter((m) => !membroIds.has(m.usuario.id))
        return (
          <Card key={grupo.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{grupo.nome}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => excluirGrupo.mutate(grupo.id)}>
                  <Trash2 className="h-4 w-4 text-slate-400" />
                </Button>
              </div>
              {grupo.descricao && <CardDescription>{grupo.descricao}</CardDescription>}
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex flex-wrap gap-1.5">
                {grupo.estados.length > 0
                  ? grupo.estados.map((uf) => <Badge key={uf} variant="outline">{uf}</Badge>)
                  : <span className="text-slate-400">Todos os estados</span>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {grupo.areas_culturais.length > 0
                  ? grupo.areas_culturais.map((a) => (
                      <span key={a} className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">{a}</span>
                    ))
                  : <span className="text-slate-400">Todas as áreas</span>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {grupo.categorias.length > 0
                  ? grupo.categorias.map((c) => (
                      <span key={c} className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {CATEGORIAS_EDITAL[c] ?? c}
                      </span>
                    ))
                  : <span className="text-slate-400">Todas as categorias</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-medium text-slate-700">Membros ({grupo.total_membros})</p>
                <div className="flex flex-wrap gap-1.5">
                  {grupo.membros.map((u) => (
                    <span key={u.id} className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      {u.username}
                      <button onClick={() => removerMembro.mutate({ grupoId: grupo.id, usuarioId: u.id })}>
                        <X className="h-3 w-3 text-slate-400 hover:text-red-500" />
                      </button>
                    </span>
                  ))}
                </div>
                {membrosFora.length > 0 && (
                  <Select onValueChange={(v) => adicionarMembro.mutate({ grupoId: grupo.id, usuarioId: Number(v) })}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Adicionar membro..." />
                    </SelectTrigger>
                    <SelectContent>
                      {membrosFora.map((m) => (
                        <SelectItem key={m.usuario.id} value={String(m.usuario.id)}>{m.usuario.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Novo grupo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); criarGrupo.mutate() }} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Nome</Label>
                <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} required placeholder="Ex: Equipe Música SP" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Descrição</Label>
                <Input value={novaDescricao} onChange={(e) => setNovaDescricao(e.target.value)} placeholder="Opcional" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Estados de interesse <span className="text-slate-400 font-normal">(vazio = todos)</span></Label>
              <div className="flex flex-wrap gap-1.5">
                {ESTADOS_BRASIL.map((uf) => (
                  <button
                    key={uf.sigla}
                    type="button"
                    onClick={() => toggleEstado(uf.sigla)}
                    className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                      novosEstados.includes(uf.sigla)
                        ? "border-indigo-500 bg-indigo-500 text-white"
                        : "border-slate-200 text-slate-600 hover:border-indigo-300"
                    }`}
                  >
                    {uf.sigla}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Áreas culturais <span className="text-slate-400 font-normal">(vazio = todas)</span></Label>
              <div className="flex flex-wrap gap-1.5">
                {novasAreas.map((area) => (
                  <span key={area} className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                    {area}
                    <button type="button" onClick={() => setNovasAreas((a) => a.filter((x) => x !== area))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adicionarArea() } }}
                  placeholder="Ex: Música, Teatro, Dança..."
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={adicionarArea}>Adicionar</Button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Categorias de interesse <span className="text-slate-400 font-normal">(vazio = todas)</span></Label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(CATEGORIAS_EDITAL) as [CategoriaEdital, string][]).map(([valor, label]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => toggleCategoria(valor)}
                    className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                      novasCategorias.includes(valor)
                        ? "border-amber-500 bg-amber-500 text-white"
                        : "border-slate-200 text-slate-600 hover:border-amber-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {erroGrupo && <p className="text-sm text-red-600">{erroGrupo}</p>}
            <div>
              <Button type="submit" disabled={criarGrupo.isPending || !novoNome.trim()}>
                {criarGrupo.isPending ? "Criando..." : "Criar grupo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

interface CampoCadastral {
  chave: string
  valor: string
}

const CAMPOS_SUGERIDOS = [
  "responsavel_legal",
  "cpf_cnpj_responsavel",
  "endereco",
  "email_contato",
  "telefone",
  "missao_institucional",
]

export function ConfiguracoesPage() {
  const queryClient = useQueryClient()
  const [nome, setNome] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [campos, setCampos] = useState<CampoCadastral[]>([])
  const [erroOrg, setErroOrg] = useState<string | null>(null)
  const [sucessoOrg, setSucessoOrg] = useState(false)

  const { data: organizacao, isLoading: carregandoOrg } = useQuery({
    queryKey: ["organizacao"],
    queryFn: async () => {
      const { data } = await api.get<Organizacao>("/auth/organizacao/")
      return data
    },
  })

  useEffect(() => {
    if (organizacao) {
      setNome(organizacao.nome)
      setCnpj(organizacao.cnpj)
      setCampos(Object.entries(organizacao.dados_cadastrais ?? {}).map(([chave, valor]) => ({ chave, valor: String(valor) })))
    }
  }, [organizacao])

  const salvarOrganizacao = useMutation({
    mutationFn: async () => {
      const dados_cadastrais = Object.fromEntries(campos.filter((c) => c.chave.trim()).map((c) => [c.chave.trim(), c.valor]))
      await api.patch("/auth/organizacao/", { nome, cnpj, dados_cadastrais })
    },
    onSuccess: () => {
      setSucessoOrg(true)
      setErroOrg(null)
      queryClient.invalidateQueries({ queryKey: ["organizacao"] })
      queryClient.invalidateQueries({ queryKey: ["me"] })
      setTimeout(() => setSucessoOrg(false), 3000)
    },
    onError: () => setErroOrg("Não foi possível salvar os dados da organização."),
  })

  function onSubmitOrg(e: FormEvent) {
    e.preventDefault()
    salvarOrganizacao.mutate()
  }

  function adicionarCampo(chave = "") {
    setCampos((c) => [...c, { chave, valor: "" }])
  }

  function atualizarCampo(index: number, parte: Partial<CampoCadastral>) {
    setCampos((c) => c.map((item, i) => (i === index ? { ...item, ...parte } : item)))
  }

  function removerCampo(index: number) {
    setCampos((c) => c.filter((_, i) => i !== index))
  }

  // Membros
  const { data: membros, isLoading: carregandoMembros } = useQuery({
    queryKey: ["membros"],
    queryFn: async () => {
      const { data } = await api.get<Membership[] | { results: Membership[] }>("/auth/membros/")
      return Array.isArray(data) ? data : data.results
    },
  })

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [papel, setPapel] = useState<Papel>("membro")
  const [erroMembro, setErroMembro] = useState<string | null>(null)

  const convidarMembro = useMutation({
    mutationFn: async () => {
      await api.post("/auth/membros/", { username, email, password, papel })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membros"] })
      setUsername("")
      setEmail("")
      setPassword("")
      setPapel("membro")
      setErroMembro(null)
    },
    onError: (err) => {
      if (isAxiosError(err) && err.response?.data) {
        const data = err.response.data as Record<string, string[] | string>
        const primeiraMensagem = Object.values(data).flat()[0]
        setErroMembro(typeof primeiraMensagem === "string" ? primeiraMensagem : "Não foi possível adicionar o membro.")
      } else {
        setErroMembro("Não foi possível adicionar o membro.")
      }
    },
  })

  function onSubmitMembro(e: FormEvent) {
    e.preventDefault()
    convidarMembro.mutate()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500">Dados da organização (usados na geração das minutas) e gerenciamento de membros.</p>
      </div>

      {carregandoOrg ? (
        <SpinnerOverlay />
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Dados da organização</CardTitle>
            <CardDescription>Essas informações são usadas pela IA ao gerar cartas, projetos e orçamentos.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmitOrg} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Dados cadastrais adicionais</Label>
                {campos.map((campo, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={campo.chave}
                      onChange={(e) => atualizarCampo(index, { chave: e.target.value })}
                      placeholder="Campo (ex: responsavel_legal)"
                      className="w-1/3"
                    />
                    <Input
                      value={campo.valor}
                      onChange={(e) => atualizarCampo(index, { valor: e.target.value })}
                      placeholder="Valor"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removerCampo(index)}>
                      <Trash2 className="h-4 w-4 text-slate-400" />
                    </Button>
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => adicionarCampo()}>
                    <Plus className="h-4 w-4" />
                    Adicionar campo
                  </Button>
                  {CAMPOS_SUGERIDOS.filter((sugestao) => !campos.some((c) => c.chave === sugestao)).map((sugestao) => (
                    <Button key={sugestao} type="button" variant="ghost" size="sm" onClick={() => adicionarCampo(sugestao)}>
                      + {sugestao}
                    </Button>
                  ))}
                </div>
              </div>

              {erroOrg && <p className="text-sm text-red-600">{erroOrg}</p>}
              {sucessoOrg && <p className="text-sm text-green-600">Dados salvos com sucesso.</p>}
              <div>
                <Button type="submit" disabled={salvarOrganizacao.isPending}>
                  {salvarOrganizacao.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <GruposSection membros={membros ?? []} />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Membros da equipe</CardTitle>
          <CardDescription>Usuários com acesso à organização.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {carregandoMembros && <SpinnerOverlay />}
          {membros?.map((membro) => (
            <div key={membro.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-slate-900">{membro.usuario.username}</p>
                <p className="text-xs text-slate-500">{membro.usuario.email}</p>
              </div>
              <Badge>{membro.papel === "admin" ? "Administrador" : "Membro"}</Badge>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <form onSubmit={onSubmitMembro} className="flex w-full flex-wrap items-end gap-2">
            <div className="flex flex-1 min-w-[140px] flex-col gap-1.5">
              <Label htmlFor="m_username">Usuário</Label>
              <Input id="m_username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="flex flex-1 min-w-[160px] flex-col gap-1.5">
              <Label htmlFor="m_email">E-mail</Label>
              <Input id="m_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="flex flex-1 min-w-[140px] flex-col gap-1.5">
              <Label htmlFor="m_password">Senha</Label>
              <Input id="m_password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="flex w-36 flex-col gap-1.5">
              <Label>Papel</Label>
              <Select value={papel} onValueChange={(v) => setPapel(v as Papel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="membro">Membro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={convidarMembro.isPending}>
              {convidarMembro.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </form>
          {erroMembro && <p className="mt-2 text-sm text-red-600">{erroMembro}</p>}
        </CardFooter>
      </Card>
    </div>
  )
}
