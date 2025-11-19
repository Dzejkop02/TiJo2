import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Code, LogOut } from "lucide-react";
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';

interface TopbarProps {
    onLogout: () => void;
}

export default function Topbar({ onLogout }: TopbarProps) {

    const handleLogoutClick = async () => {
        try {
            await apiFetch('/auth/logout', { method: 'GET' });
        } catch (error) {
            console.error("Błąd wywołania API wylogowania:", error);
        } finally {
            toast.info('Wylogowano pomyślnie.');
            onLogout();
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between px-4 md:px-6">
                <a href="/" className="flex items-center gap-2 font-bold text-lg">
                    <Code className="h-6 w-6 text-blue-600" />
                    <span>AgilePlanner</span>
                </a>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback>UŻ</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            Zalogowany
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleLogoutClick} className="cursor-pointer text-red-500 focus:text-red-600">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Wyloguj się</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
