import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { DialogProvider } from './components/ui/DialogContext';
import { CapturePage } from './pages/CapturePage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { NotePage } from './pages/NotePage';
import { NotesPage } from './pages/NotesPage';
import { ProjectPage } from './pages/ProjectPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <DialogProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/capturar" replace />} />
          <Route path="/capturar" element={<CapturePage />} />
          <Route path="/notas" element={<NotesPage />} />
          <Route path="/notas/:id" element={<NotePage />} />
          <Route path="/projeto/:id" element={<ProjectPage />} />
          <Route path="/conexoes" element={<ConnectionsPage />} />
          <Route path="/ajustes" element={<SettingsPage />} />
        </Routes>
      </AppShell>
    </DialogProvider>
  );
}
