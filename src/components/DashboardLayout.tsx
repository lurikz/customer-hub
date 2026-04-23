 import React from "react";
 import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
 import { AppSidebar } from "./AppSidebar";
 import { useAuth } from "@/contexts/AuthContext";
 import { Navigate } from "react-router-dom";
 
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
 
   return (
     <SidebarProvider>
       <div className="flex min-h-screen w-full bg-background font-sans antialiased">
         <AppSidebar />
         <SidebarInset className="flex flex-col">
            <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border/50 bg-background/80 px-4 backdrop-blur-md lg:hidden">
              <SidebarTrigger />
             <div className="ml-4 flex items-center gap-2">
               <div className="h-6 w-6 rounded bg-primary" />
                <span className="text-sm font-bold tracking-tight uppercase">TECH CRM</span>
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