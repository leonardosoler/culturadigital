import { NavLink, Outlet } from "react-router-dom"
import { ClipboardList, FilePlus2, LayoutGrid, LogOut, Radio, Settings } from "lucide-react"
import { useAuth } from "../../lib/auth"
import { cn } from "../../lib/utils"

const NAV_ITEMS = [
  { to: "/", label: "Catálogo de editais", icon: LayoutGrid, end: true },
  { to: "/meus-editais", label: "Meus editais", icon: ClipboardList, end: false },
  { to: "/fontes", label: "Fontes", icon: Radio, end: false },
  { to: "/cadastro-manual", label: "Cadastro manual", icon: FilePlus2, end: false },
  { to: "/configuracoes", label: "Configurações", icon: Settings, end: false },
]

export function AppLayout() {
  const { usuario, organizacao, papel, logout } = useAuth()

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <h1 className="text-lg font-bold text-indigo-700">CulturaDigital</h1>
          <p className="mt-1 truncate text-xs text-slate-500">{organizacao?.nome ?? "Sem organização"}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <div className="mb-2 truncate text-xs text-slate-500">
            <p className="truncate font-medium text-slate-700">{usuario?.username}</p>
            <p className="capitalize">{papel}</p>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
        <Outlet />
      </main>
    </div>
  )
}
