import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { api, clearTokens, getAccessToken, setTokens } from "./api"
import type { Organizacao, Papel, Usuario } from "../types"

interface RegistroDados {
  nome_organizacao: string
  username: string
  email: string
  password: string
}

interface AuthContextValue {
  usuario: Usuario | null
  organizacao: Organizacao | null
  papel: Papel | null
  carregando: boolean
  autenticado: boolean
  login: (username: string, password: string) => Promise<void>
  registrar: (dados: RegistroDados) => Promise<void>
  logout: () => void
  recarregar: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [organizacao, setOrganizacao] = useState<Organizacao | null>(null)
  const [papel, setPapel] = useState<Papel | null>(null)
  const [carregando, setCarregando] = useState(true)

  async function carregarMe() {
    const { data } = await api.get("/auth/me/")
    setUsuario(data.usuario)
    setOrganizacao(data.organizacao)
    setPapel(data.papel)
  }

  useEffect(() => {
    async function init() {
      if (getAccessToken()) {
        try {
          await carregarMe()
        } catch {
          clearTokens()
        }
      }
      setCarregando(false)
    }
    init()
  }, [])

  async function login(username: string, password: string) {
    const { data } = await api.post("/auth/login/", { username, password })
    setTokens(data.access, data.refresh)
    await carregarMe()
  }

  async function registrar(dados: RegistroDados) {
    const { data } = await api.post("/auth/registro/", dados)
    setTokens(data.access, data.refresh)
    await carregarMe()
  }

  function logout() {
    clearTokens()
    setUsuario(null)
    setOrganizacao(null)
    setPapel(null)
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        organizacao,
        papel,
        carregando,
        autenticado: !!usuario,
        login,
        registrar,
        logout,
        recarregar: carregarMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider")
  return ctx
}
