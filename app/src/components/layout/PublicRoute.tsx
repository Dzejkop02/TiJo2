import { Navigate, Outlet } from 'react-router-dom';

interface PublicRouteProps {
    isLoggedIn: boolean;
}

export default function PublicRoute({ isLoggedIn }: PublicRouteProps) {
    if (isLoggedIn) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
