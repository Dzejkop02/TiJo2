import { Navigate, Outlet } from 'react-router-dom';
import Topbar from './Topbar';

interface ProtectedRouteProps {
    isLoggedIn: boolean;
    onLogout: () => void;
}

export default function ProtectedRoute({ isLoggedIn, onLogout }: ProtectedRouteProps) {
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex flex-col h-screen max-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <Topbar onLogout={onLogout} />
            <main className="flex-1 p-4 md:p-6 overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
}
