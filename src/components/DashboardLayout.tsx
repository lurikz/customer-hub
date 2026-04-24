 import React from "react";
 import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
 import { AppSidebar } from "./AppSidebar";
 import { useAuth } from "@/contexts/AuthContext";
 import { Navigate } from "react-router-dom";
 import { apiConfig } from "@/lib/api";
 import { AlertCircle } from "lucide-react";
 import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
 import { Button } from "@/components/ui/button";
 
 interface DashboardLayoutProps {
   children: React.ReactNode;
 }
 
 export function DashboardLayout({ children }: DashboardLayoutProps) {
   const { user, loading } = useAuth();
 
   if (loading) {
     return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
         <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
       </div>
     );
   }
 
   if (!user) {
     return <Navigate to="/login" replace />;
   }
 
   const isDemo = apiConfig.isDemo();
   const { logout } = useAuth();

   return (
     <SidebarProvider>
       <div className="flex min-h-screen w-full bg-background font-sans antialiased">
         <AppSidebar />
         <SidebarInset className="flex flex-col">
            {isDemo && (
              <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-medium">
                  <AlertCircle className="h-4 w-4" />
                  <span>Modo Demo Ativo: Os dados são locais e salvos apenas no seu navegador.</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs hover:bg-amber-500/20 text-amber-700 dark:text-amber-300"
                  onClick={logout}
                >
                  Sair do Modo Demo
                </Button>
              </div>
            )}
            <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border/50 bg-background/80 px-4 backdrop-blur-md lg:hidden">
              <SidebarTrigger />
             <div className="ml-4 flex items-center gap-2">
               <div className="h-6 w-6 rounded bg-primary" />
                 <span className="text-sm font-bold tracking-tight uppercase">Mudali Tech</span>
             </div>
           </header>
             <main className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-background lg:h-screen">
               <div className="flex flex-1 flex-col overflow-hidden p-4 sm:p-6 lg:p-8">
                 <div className="mx-auto flex h-full w-full max-w-7xl flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
                   {children}
                 </div>
               </div>
             </main>
         </SidebarInset>
       </div>
     </SidebarProvider>
   );
 }