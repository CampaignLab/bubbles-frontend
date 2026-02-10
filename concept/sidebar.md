```tsx
"use client";

import React from "react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CivisightLogo } from "./civisight-logo";
import { BubblesUkLogo } from "./bubbles-uk-logo";
import { boundaries } from "@/lib/data";
import { Play, Loader2, LogIn, LogOut, Shield, ChevronUp, Map, User } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
    activePage: 'dashboard' | 'boundaries';
}

export function AppSidebar({ activePage }: AppSidebarProps) {
    const { toast } = useToast();
    const { user, login, logout } = useAuth();

    const handleComingSoon = () => {
        toast({
            title: "Page Not Available",
            description: "This feature is still in development. Please check back later.",
        });
    }

    return (
        <aside className="w-[350px] bg-secondary border-r border-border flex flex-col">
            <div className="p-6 border-b space-y-4">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <BubblesUkLogo className="h-8 w-8 text-primary" />
                    <h2 className="text-xl font-bold tracking-tight">Bubbles UK</h2>
                </Link>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-8">
                {/* This section can be contextual based on the page */}
            </div>

            <div className="p-4 border-t text-center text-sm text-muted-foreground">
                <div className="flex flex-col gap-2">
                    <Collapsible>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start items-center gap-3 px-3 h-auto text-muted-foreground hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
                                <CivisightLogo className="h-6 w-6" />
                                <span className="text-sm font-normal">Echo Chamber</span>
                                <ChevronUp className="h-4 w-4 ml-auto transition-transform data-[state=closed]:-rotate-180" />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <ScrollArea className="max-h-32 mt-2">
                                <div className="p-2 space-y-1">
                                    <Link href="/dashboard" passHref>
                                        <Button variant="ghost" className={cn("w-full justify-start gap-2", activePage === 'dashboard' && 'bg-accent text-accent-foreground')}>
                                            <Map className="mr-2 h-4 w-4" />
                                            Dashboard
                                        </Button>
                                    </Link>
                                    <Link href="/dashboard/boundaries" passHref>
                                        <Button variant="ghost" className={cn("w-full justify-start gap-2", activePage === 'boundaries' && 'bg-accent text-accent-foreground')}>
                                            <Shield className="mr-2 h-4 w-4" />
                                            Boundaries
                                        </Button>
                                    </Link>
                                    <Button variant="ghost" onClick={handleComingSoon} className="w-full justify-start gap-2">
                                        <User className="mr-2 h-4 w-4" />
                                        Profile / Login
                                    </Button>
                                </div>
                            </ScrollArea>
                        </CollapsibleContent>
                    </Collapsible>

                    <Separator className="my-2" />
                    {user?.isAdmin ? (
                        <>
                            <Link href="/admin" passHref>
                                <Button variant="outline" className="w-full">
                                    <Shield className="mr-2" /> Go to Admin Panel
                                </Button>
                            </Link>
                            <Button variant="ghost" onClick={logout} className="w-full">
                                <LogOut className="mr-2" /> Logout
                            </Button>
                        </>
                    ) : (
                        <Button variant="secondary" onClick={login} className="w-full">
                            <LogIn className="mr-2" /> Admin Login
                        </Button>
                    )}
                    <Separator className="my-2" />
                    <span className="text-xs">Campaign Lab</span>
                </div>
            </div>
        </aside>
    )
}