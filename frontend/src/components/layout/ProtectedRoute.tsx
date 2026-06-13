import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../../lib/auth"
import { SpinnerOverlay } from "../ui/spinner"

export function ProtectedRoute() {
  const { autenticado, carregando } = useAuth()

  if (carregando) {
    return <SpinnerOverlay texto="Carregando sessão..." />
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { autenticado, carregando } = useAuth()

  if (carregando) {
    return <SpinnerOverlay texto="Carregando sessão..." />
  }

  if (autenticado) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
