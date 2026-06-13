import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { isAxiosError } from "axios"
import { api } from "../lib/api"
import type { EditalDetalhe } from "../types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { Button } from "../components/ui/button"

export function CadastroManualPage() {
  const navigate = useNavigate()
  const [titulo, setTitulo] = useState("")
  const [urlOrigem, setUrlOrigem] = useState("")
  const [descricao, setDescricao] = useState("")
  const [areaCultural, setAreaCultural] = useState("")
  const [orgaoResponsavel, setOrgaoResponsavel] = useState("")
  const [prazoInscricao, setPrazoInscricao] = useState("")
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const cadastrar = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      if (titulo) formData.append("titulo", titulo)
      if (urlOrigem) formData.append("url_origem", urlOrigem)
      if (descricao) formData.append("descricao", descricao)
      if (areaCultural) formData.append("area_cultural", areaCultural)
      if (orgaoResponsavel) formData.append("orgao_responsavel", orgaoResponsavel)
      if (prazoInscricao) formData.append("prazo_inscricao", prazoInscricao)
      if (arquivo) formData.append("arquivo_pdf", arquivo)
      const { data } = await api.post<EditalDetalhe>("/editais/manual/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return data
    },
    onSuccess: (edital) => navigate(`/editais/${edital.id}`),
    onError: (err) => {
      if (isAxiosError(err) && err.response?.data) {
        const data = err.response.data as Record<string, string[] | string>
        const primeiraMensagem = Object.values(data).flat()[0]
        setErro(typeof primeiraMensagem === "string" ? primeiraMensagem : "Não foi possível cadastrar o edital.")
      } else {
        setErro("Não foi possível cadastrar o edital. Tente novamente.")
      }
    },
  })

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    setArquivo(e.target.files?.[0] ?? null)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!urlOrigem && !arquivo && !descricao) {
      setErro("Informe ao menos a URL de origem, um arquivo PDF ou uma descrição do edital.")
      return
    }
    cadastrar.mutate()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cadastro manual de edital</h1>
        <p className="text-sm text-slate-500">
          Cole a URL de uma página de edital e/ou envie o PDF. Após o cadastro, a IA será acionada para extrair resumo e requisitos.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Dados do edital</CardTitle>
          <CardDescription>Os campos preenchidos manualmente têm prioridade; os demais podem ser completados pela IA.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Opcional — será inferido pela IA se vazio" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="url_origem">URL de origem</Label>
              <Input id="url_origem" type="url" value={urlOrigem} onChange={(e) => setUrlOrigem(e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="arquivo_pdf">Arquivo PDF</Label>
              <Input id="arquivo_pdf" type="file" accept="application/pdf" onChange={onFileChange} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} placeholder="Cole aqui o texto do edital, se não houver URL ou PDF." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="area_cultural">Área cultural</Label>
                <Input id="area_cultural" value={areaCultural} onChange={(e) => setAreaCultural(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="orgao_responsavel">Órgão responsável</Label>
                <Input id="orgao_responsavel" value={orgaoResponsavel} onChange={(e) => setOrgaoResponsavel(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prazo_inscricao">Prazo de inscrição</Label>
              <Input id="prazo_inscricao" type="date" value={prazoInscricao} onChange={(e) => setPrazoInscricao(e.target.value)} className="w-48" />
            </div>
            {erro && <p className="text-sm text-red-600">{erro}</p>}
            <div>
              <Button type="submit" disabled={cadastrar.isPending}>
                {cadastrar.isPending ? "Cadastrando..." : "Cadastrar edital"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
