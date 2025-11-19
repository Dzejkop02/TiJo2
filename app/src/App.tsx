import { Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ProjectDashboard from './components/dashboard/ProjectDashboard';
import ProtectedRoute from './components/layout/ProtectedRoute';
import PublicRoute from './components/layout/PublicRoute';
import ProjectDetailPage from "@/pages/ProjectDetailPage.tsx";
import ProjectSettingsPage from './pages/ProjectSettingsPage';
import ModuleKanbanPage from "@/pages/ModuleKanbanPage.tsx";
import { useAuth } from './contexts/AuthContext';
import type {User} from "@/types";

// const ModulePage = () => <div>Strona Modułu (Chroniona)</div>;
const SettingsPage = () => <div>Ustawienia (Chronione)</div>;
const NotFoundPage = () => <div>404 - Nie znaleziono strony</div>;

export default function App() {
    const { user, setUser } = useAuth();
    const isLoggedIn = !!user;

    const handleLoginSuccess = (loggedInUser: User) => {
        setUser(loggedInUser);
    };

    const handleLogout = () => {
        setUser(null);
    };

    return (
        <Routes>
            <Route element={<ProtectedRoute isLoggedIn={isLoggedIn} onLogout={handleLogout} />}>
                <Route path="/" element={<ProjectDashboard />} />
                <Route path="/projects" element={<ProjectDashboard />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/projects/:id/settings" element={<ProjectSettingsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/modules/:moduleId/board" element={<ModuleKanbanPage />} />
            </Route>

            <Route element={<PublicRoute isLoggedIn={isLoggedIn} />}>
                <Route path="/login" element={<AuthPage onLoginSuccess={handleLoginSuccess} />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
