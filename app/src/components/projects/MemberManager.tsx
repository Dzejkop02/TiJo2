import { useState, useEffect } from 'react';
import type {Project, ProjectMember, ProjectRole, UserSearchResult} from '@/types';
import { getProjectMembers, searchUsers, addProjectMember, removeProjectMember } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

interface MemberManagerProps {
    project: Project;
}

export default function MemberManager({ project }: MemberManagerProps) {
    const { user: currentUser } = useAuth();
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const isOwner = currentUser?.id === project.owner_id;

    const fetchMembers = async () => {
        try {
            const data = await getProjectMembers(project.id);
            setMembers(data);
        } catch (error) {
            toast.error('Nie można załadować członków', { description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [project.id]);

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Czy na pewno chcesz usunąć tego członka z projektu?')) return;
        try {
            await removeProjectMember(project.id, userId);
            toast.success('Usunięto członka');
            fetchMembers();
        } catch (error) {
            toast.error('Błąd usuwania członka', { description: (error as Error).message });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Członkowie Projektu</CardTitle>
                <CardDescription>Zarządzaj dostępem do swojego projektu.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <div className="space-y-4">
                        {/* Formularz dodawania nowego członka */}
                        {isOwner && <AddMemberForm project={project} onMemberAdded={fetchMembers} />}

                        {/* Lista członków */}
                        <div className="space-y-2">
                            {members.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarFallback>{member.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{member.full_name}</p>
                                            <p className="text-sm text-muted-foreground">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-muted-foreground">{member.project_role}</span>
                                        {/* Właściciel może usuwać innych */}
                                        {isOwner && (
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.user_id)}>
                                                <X className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function AddMemberForm({ project, onMemberAdded }: { project: Project, onMemberAdded: () => void }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
    const [selectedRole, setSelectedRole] = useState<ProjectRole>('DEVELOPER');
    const [isOpen, setIsOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }
        const search = async () => {
            try {
                const users = await searchUsers(searchQuery);
                setSearchResults(users);
            } catch (error) {
                console.error('Błąd wyszukiwania:', error);
            }
        };
        const timer = setTimeout(search, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleAddMember = async () => {
        if (!selectedUser) {
            toast.error('Nie wybrano użytkownika.');
            return;
        }
        setIsAdding(true);
        try {
            await addProjectMember(project.id, selectedUser.id, selectedRole);
            toast.success(`Dodano ${selectedUser.full_name} do projektu.`);
            onMemberAdded();
            setSelectedUser(null);
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            toast.error('Błąd dodawania członka', { description: (error as Error).message });
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="flex items-center gap-2 p-4 border rounded-lg">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[250px] justify-start">
                        {selectedUser ? <>{selectedUser.full_name} ({selectedUser.email})</> : <><UserPlus className="mr-2 h-4 w-4" />Wyszukaj po emailu...</>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[250px]" align="start">
                    <Command>
                        <CommandInput
                            placeholder="Wpisz min 2 znaki emaila..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                        <CommandList>
                            <CommandEmpty>Nie znaleziono użytkowników.</CommandEmpty>
                            {searchResults.map(user => (
                                <CommandItem
                                    key={user.id}
                                    value={user.email}
                                    onSelect={() => {
                                        setSelectedUser(user);
                                        setIsOpen(false);
                                    }}
                                >
                                    {user.full_name} ({user.email})
                                </CommandItem>
                            ))}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Select value={selectedRole} onValueChange={(val: string) => setSelectedRole(val as ProjectRole)} disabled={!selectedUser}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Wybierz rolę" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="DEVELOPER">Developer</SelectItem>
                    <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                    <SelectItem value="STAKEHOLDER">Stakeholder</SelectItem>
                </SelectContent>
            </Select>

            <Button onClick={handleAddMember} disabled={!selectedUser || isAdding}>
                {isAdding ? <Loader2 className="animate-spin" /> : 'Dodaj'}
            </Button>
        </div>
    );
}
