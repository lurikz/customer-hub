 import { Calendar, LayoutDashboard, LogOut, Shield, Users, User, Settings } from "lucide-react";
 import { Link, useLocation } from "react-router-dom";
 import { useAuth } from "@/contexts/AuthContext";
 import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   SidebarGroup,
   SidebarGroupLabel,
   SidebarGroupContent,
 } from "@/components/ui/sidebar";
 import { Button } from "@/components/ui/button";
 
 export function AppSidebar() {
   const { user, logout, hasRole } = useAuth();
   const location = useLocation();
 
   const menuItems = [
     {
       title: "Clientes",
       icon: Users,
       url: "/",
     },
     {
       title: "Agenda",
       icon: Calendar,
       url: "/?tab=agenda",
     },
   ];
 
   return (
     <Sidebar collapsible="icon" className="border-r border-white/5 bg-black/50 backdrop-blur-xl">
       <SidebarHeader className="border-b border-white/5 p-4">
         <div className="flex items-center gap-3 px-2">
           <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-[0_0_20px_rgba(124,58,237,0.3)]">
             <LayoutDashboard className="h-5 w-5 text-white" />
           </div>
           <div className="flex flex-col group-data-[collapsible=icon]:hidden">
             <span className="text-sm font-bold tracking-tight text-white">TECH CRM</span>
             <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Sistema de Gestão</span>
           </div>
         </div>
       </SidebarHeader>
       <SidebarContent>
         <SidebarGroup>
           <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-widest text-muted-foreground/50">Menu Principal</SidebarGroupLabel>
           <SidebarGroupContent>
             <SidebarMenu>
               {menuItems.map((item) => (
                 <SidebarMenuItem key={item.title}>
                   <SidebarMenuButton
                     asChild
                     isActive={location.pathname === item.url || (item.url !== "/" && location.pathname.startsWith(item.url))}
                     tooltip={item.title}
                     className="relative h-11 px-4 transition-all hover:bg-white/5 hover:text-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                   >
                     <Link to={item.url}>
                       <item.icon className="h-5 w-5" />
                       <span className="font-medium">{item.title}</span>
                       {location.pathname === item.url && (
                         <span className="absolute left-0 h-6 w-1 rounded-r-full bg-primary" />
                       )}
                     </Link>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               ))}
             </SidebarMenu>
           </SidebarGroupContent>
         </SidebarGroup>
 
         {hasRole("super_admin") && (
           <SidebarGroup>
             <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-widest text-muted-foreground/50">Administração</SidebarGroupLabel>
             <SidebarGroupContent>
               <SidebarMenu>
                 <SidebarMenuItem>
                   <SidebarMenuButton
                     asChild
                     isActive={location.pathname === "/admin"}
                     tooltip="Painel Master"
                     className="h-11 px-4 transition-all hover:bg-white/5 hover:text-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                   >
                     <Link to="/admin">
                       <Shield className="h-5 w-5" />
                       <span className="font-medium">Painel Master</span>
                     </Link>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               </SidebarMenu>
             </SidebarGroupContent>
           </SidebarGroup>
         )}
       </SidebarContent>
       <SidebarFooter className="border-t border-white/5 p-4">
         <div className="flex flex-col gap-4">
           <div className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:hidden">
             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
               <User className="h-4 w-4" />
             </div>
             <div className="flex flex-col overflow-hidden">
               <span className="truncate text-sm font-medium text-white">{user?.name}</span>
               <span className="truncate text-[10px] text-muted-foreground">{user?.email}</span>
             </div>
           </div>
           <Button
             variant="ghost"
             className="w-full justify-start gap-3 px-2 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive group-data-[collapsible=icon]:justify-center"
             onClick={logout}
           >
             <LogOut className="h-5 w-5" />
             <span className="group-data-[collapsible=icon]:hidden">Sair</span>
           </Button>
         </div>
       </SidebarFooter>
     </Sidebar>
   );
 }