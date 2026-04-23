import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(200),
  password: z.string().min(1, "Senha obrigatória").max(200),
});

type FormValues = z.infer<typeof schema>;

interface LocationState {
  from?: { pathname?: string };
}

 import { cn } from "@/lib/utils";
 
 export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  if (!loading && user) {
    const fallback = user.role === "super_admin" ? "/admin" : "/";
    const from = (location.state as LocationState)?.from?.pathname || fallback;
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const u = await login(values.email, values.password);
      const fallback = u.role === "super_admin" ? "/admin" : "/";
      const from = (location.state as LocationState)?.from?.pathname || fallback;
      navigate(from, { replace: true });
    } catch (e) {
      setError((e as Error).message);
    }
  };

   return (
     <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0A0A0A] px-4 py-12">
       {/* Background Decor */}
       <div className="absolute -left-1/4 -top-1/4 h-[1000px] w-[1000px] rounded-full bg-primary/5 blur-[120px]" />
       <div className="absolute -bottom-1/4 -right-1/4 h-[800px] w-[800px] rounded-full bg-primary/10 blur-[100px]" />
       
       <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-500">
         <div className="flex flex-col items-center gap-6 rounded-3xl border border-white/5 bg-black/40 p-8 shadow-2xl backdrop-blur-2xl sm:p-12">
           <div className="flex flex-col items-center gap-4 text-center">
             <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-[0_0_30px_rgba(124,58,237,0.4)]">
               <Users className="h-8 w-8 text-white" />
             </div>
             <div className="space-y-1">
               <h1 className="text-3xl font-bold tracking-tight text-white">Bem-vindo</h1>
               <p className="text-sm text-muted-foreground">
                 Acesse sua plataforma CRM tecnológica
               </p>
             </div>
           </div>
 
           <Form {...form}>
             <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
               <FormField
                 control={form.control}
                 name="email"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel className="text-white/70">E-mail</FormLabel>
                     <FormControl>
                       <Input
                         type="email"
                         autoComplete="username"
                         placeholder="exemplo@empresa.com"
                         className="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20"
                         {...field}
                       />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               <FormField
                 control={form.control}
                 name="password"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel className="text-white/70">Senha</FormLabel>
                     <FormControl>
                       <Input
                         type="password"
                         autoComplete="current-password"
                         placeholder="••••••••"
                         className="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20"
                         {...field}
                       />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
 
               {error && (
                 <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/10 animate-in shake duration-300">
                   <AlertDescription>{error}</AlertDescription>
                 </Alert>
               )}
 
               <Button
                 type="submit"
                 className="group h-12 w-full gap-3 rounded-xl bg-primary text-base font-bold shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98]"
                 disabled={form.formState.isSubmitting}
               >
                 <ShieldCheck className="h-5 w-5 transition-transform group-hover:rotate-12" />
                 {form.formState.isSubmitting ? "Autenticando..." : "Entrar no Sistema"}
               </Button>
             </form>
           </Form>
           
           <div className="mt-4 text-center">
             <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50">
               Tecnologia & Gestão • v1.0.0
             </p>
           </div>
         </div>
       </div>
     </div>
   );
}
