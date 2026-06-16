import { Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "./components/layout/AppLayout"
import { ProtectedRoute, PublicOnlyRoute } from "./components/layout/ProtectedRoute"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"
import { InicioPage } from "./pages/InicioPage"
import { DashboardPage } from "./pages/DashboardPage"
import { FontesPage } from "./pages/FontesPage"
import { MeusEditaisPage } from "./pages/MeusEditaisPage"
import { EditalDetailPage } from "./pages/EditalDetailPage"
import { CadastroManualPage } from "./pages/CadastroManualPage"
import { ConfiguracoesPage } from "./pages/ConfiguracoesPage"
import { DocumentosPage } from "./pages/DocumentosPage"
import { PrazosPage } from "./pages/PrazosPage"
import { LogsPage } from "./pages/LogsPage"

function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<InicioPage />} />
          <Route path="/catalogo" element={<DashboardPage />} />
          <Route path="/meus-editais" element={<MeusEditaisPage />} />
          <Route path="/prazos" element={<PrazosPage />} />
          <Route path="/editais/:id" element={<EditalDetailPage />} />
          <Route path="/fontes" element={<FontesPage />} />
          <Route path="/cadastro-manual" element={<CadastroManualPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          <Route path="/logs" element={<LogsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
