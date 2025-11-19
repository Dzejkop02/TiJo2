import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api.ts';
import { toast } from 'sonner';

interface RegisterFormProps {
    onSwitchToLogin: () => void;
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await apiFetch('/users', {
                method: 'POST',
                body: JSON.stringify({ fullName, email, password }),
            });

            toast.success('Rejestracja pomyślna!', {
                description: 'Możesz się teraz zalogować.',
            });
            onSwitchToLogin();

        } catch (error) {
            toast.error('Błąd rejestracji', {
                description: (error as Error).message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="text-2xl">Rejestracja</CardTitle>
                <CardDescription>Wypełnij formularz, aby utworzyć konto.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="fullName">Imię i nazwisko</Label>
                        <Input id="fullName" type="text" placeholder="Jan Kowalski" required value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Hasło (min. 6 znaków)</Label>
                        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Utwórz konto
                    </Button>
                    <Button type="button" variant="link" onClick={onSwitchToLogin} disabled={isLoading}>
                        Masz już konto? Zaloguj się
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
