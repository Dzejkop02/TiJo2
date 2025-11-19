import { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import type {User} from '@/types';

interface AuthPageProps {
    onLoginSuccess: (user: User) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
    const [showLogin, setShowLogin] = useState(true);

    return (
        <div className="flex items-center justify-center min-h-screen">
            {showLogin ? (
                <LoginForm
                    onLoginSuccess={onLoginSuccess}
                    onSwitchToRegister={() => setShowLogin(false)}
                />
            ) : (
                <RegisterForm
                    onSwitchToLogin={() => setShowLogin(true)}
                />
            )}
        </div>
    );
}
