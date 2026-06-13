import type { ReactNode } from "react"
import { cn } from "../../lib/utils"

const CORES: Record<string, string> = {
  novo: "bg-slate-100 text-slate-700",
  em_analise: "bg-amber-100 text-amber-800",
  elegivel: "bg-blue-100 text-blue-800",
  inscrito: "bg-indigo-100 text-indigo-800",
  concluido: "bg-green-100 text-green-800",
  descartado: "bg-red-100 text-red-700",
  pendente: "bg-slate-100 text-slate-700",
  processando: "bg-amber-100 text-amber-800",
  processado: "bg-green-100 text-green-800",
  erro: "bg-red-100 text-red-700",
  anexado: "bg-blue-100 text-blue-800",
  ok: "bg-green-100 text-green-800",
}

interface BadgeProps {
  status?: string
  children: ReactNode
  className?: string
}

export function Badge({ status, children, className }: BadgeProps) {
  const cor = status ? CORES[status] ?? "bg-slate-100 text-slate-700" : "bg-slate-100 text-slate-700"
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", cor, className)}>
      {children}
    </span>
  )
}
