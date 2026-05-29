import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { CapturePage } from './pages/CapturePage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { NotePage } from './pages/NotePage';
import { NotesPage } from './pages/NotesPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/capturar" replace />} />
        <Route path="/capturar" element={<CapturePage />} />
        <Route path="/notas" element={<NotesPage />} />
        <Route path="/notas/:id" element={<NotePage />} />
        <Route path="/conexoes" element={<ConnectionsPage />} />
        <Route path="/ajustes" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  );
}
