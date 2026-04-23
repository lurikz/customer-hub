import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  isPast
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  List,
  Plus,
  LayoutGrid,
  Filter,
  User,
  Clock,
  CheckCircle2,
  Circle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { tasksApi, type Task } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { TaskFormDialog } from "./TaskFormDialog";
import { TasksList } from "./TasksList";
import { cn } from "@/lib/utils";

const STATUS_GROUPS = [
    { id: "em_andamento", label: "Em andamento", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { id: "pendente", label: "Pendentes", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { id: "atrasada", label: "Atrasadas", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/20", border: "border-red-500/30", isCritical: true },
    { id: "concluído", label: "Concluídas", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { id: "cancelada", label: "Canceladas", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
] as const;

type StatusGroupId = typeof STATUS_GROUPS[number]["id"];

function getTaskStatusGroup(task: Task): StatusGroupId {
  const isOverdue = isPast(new Date(task.datetime)) && !isToday(new Date(task.datetime)) && (task.status === "pendente" || task.status === "em_andamento");
  if (isOverdue) return "atrasada";
  return task.status as StatusGroupId;
}

export function Agenda() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"month" | "list">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterMyTasks, setFilterMyTasks] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", filterMyTasks ? user?.id : null],
    queryFn: () => tasksApi.list(filterMyTasks ? { userId: user?.id } : undefined),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (task: Task) => {
      let nextStatus: Task["status"] = "concluído";
      if (task.status === "concluído") nextStatus = "pendente";
      else if (task.status === "pendente") nextStatus = "em_andamento";
      else if (task.status === "em_andamento") nextStatus = "concluído";
      else if (task.status === "cancelada") nextStatus = "pendente";
      
      return tasksApi.update(task.id, { status: nextStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erro ao atualizar", description: err.message });
    }
  });

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskFormOpen(true);
  };

  const handleNewTask = (date?: Date) => {
    setEditingTask(null);
    if (date) {
      const localDate = new Date(date);
      localDate.setHours(9, 0, 0, 0);
      setCurrentDate(localDate);
    }
    setTaskFormOpen(true);
  };

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const nextDate = () => setCurrentDate(addMonths(currentDate, 1));
  const prevDate = () => setCurrentDate(subMonths(currentDate, 1));
  const resetToToday = () => setCurrentDate(new Date());

  const stats = useMemo(() => {
    const counts = {
      em_andamento: 0,
      pendente: 0,
      atrasada: 0,
      concluído: 0,
      cancelada: 0,
    };
    
    tasks.forEach(task => {
      const group = getTaskStatusGroup(task);
      if (counts.hasOwnProperty(group)) {
        counts[group as keyof typeof counts]++;
      }
    });
    
    return counts;
  }, [tasks]);

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setDayModalOpen(true);
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
       <div className="flex flex-col gap-3 shrink-0 px-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {STATUS_GROUPS.map((group) => (
            <div key={group.id} className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-medium transition-colors bg-card")}>
              <span className={cn("h-1.5 w-1.5 rounded-full", group.id === "atrasada" ? "bg-red-500 animate-pulse" : group.bg.replace('bg-', 'bg-').split('/')[0])}></span>
              <span className="text-muted-foreground">{group.label}:</span>
              <span className={cn("font-bold", group.color)}>{stats[group.id as keyof typeof stats]}</span>
            </div>
          ))}
          <div className="ml-auto text-[10px] text-muted-foreground italic">
            {tasks.length} tarefas no total
          </div>
        </div>
      </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-card rounded-md border p-1">
            <Button
              variant={view === "month" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("month")}
               className="h-7 px-2 text-xs gap-1.5"
            >
              <LayoutGrid className="h-4 w-4" />
              Calendário
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
               className="h-7 px-2 text-xs gap-1.5"
            >
              <List className="h-4 w-4" />
              Lista
            </Button>
          </div>

          {view !== "list" && (
            <div className="flex items-center gap-1 ml-2">
               <Button variant="outline" size="icon" className="h-7 w-7" onClick={prevDate}>
                 <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
               <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={resetToToday}>
                Hoje
              </Button>
               <Button variant="outline" size="icon" className="h-7 w-7" onClick={nextDate}>
                 <ChevronRight className="h-3.5 w-3.5" />
              </Button>
               <h2 className="ml-1 font-bold text-sm capitalize">
                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
              </h2>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                <Filter className="h-4 w-4" />
                Filtros
                {filterMyTasks && <Badge className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">1</Badge>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Visualização</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filterMyTasks}
                onCheckedChange={setFilterMyTasks}
              >
                Ver apenas minhas tarefas
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

           <Button onClick={() => handleNewTask()} size="sm" className="h-8 gap-2 text-xs">
            <Plus className="h-4 w-4" />
            Nova tarefa
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {view === "list" ? (
          <div className="h-full overflow-auto">
            <TasksList
              tasks={tasks}
              onEdit={handleEditTask}
              onToggleStatus={(t) => toggleStatusMutation.mutate(t)}
            />
          </div>
        ) : (
          <div className="flex h-full flex-col border rounded-lg bg-background overflow-hidden">
             <div className="grid grid-cols-7 border-b bg-muted/50 backdrop-blur-sm">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                 <div key={day} className="py-1.5 text-center text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  {day}
                </div>
              ))}
            </div>
             <div 
               className="grid grid-cols-7 flex-1 overflow-hidden divide-x divide-y bg-muted/20"
               style={{ 
                 gridTemplateRows: `repeat(${Math.ceil(days.length / 7)}, 1fr)` 
               }}
             >
              {days.map((day, idx) => {
                const dayTasks = tasks.filter((t) => isSameDay(new Date(t.datetime), day));
                const isMonthDay = day.getMonth() === currentDate.getMonth();
                const isTodayDay = isToday(day);

                return (
                   <div
                     key={idx}
                     className={cn(
                       "flex flex-col min-h-0 bg-card p-0.5 transition-colors hover:bg-muted/10 cursor-pointer relative",
                       !isMonthDay && "bg-muted/5 opacity-40",
                       isTodayDay && "bg-accent/10 shadow-inner"
                     )}
                     onClick={() => handleDayClick(day)}
                   >
                     <div className="flex items-center justify-between px-1 border-b border-border/10 mb-0.5">
                       <span className={cn(
                         "flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium",
                         isTodayDay ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                       )}>
                         {format(day, "d")}
                       </span>
                       {dayTasks.some(t => getTaskStatusGroup(t) === "atrasada") && (
                         <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                       )}
                     </div>
 
                      <div className="flex-1 overflow-hidden px-0.5 flex flex-col gap-0.5">
                        {STATUS_GROUPS.filter(g => ["em_andamento", "pendente", "concluído", "atrasada", "cancelada"].includes(g.id)).map((group) => {
                          const groupTasks = dayTasks.filter(t => getTaskStatusGroup(t) === group.id);
                          if (groupTasks.length === 0) return null;
                          return (
                            <div 
                              key={group.id} 
                              className={cn(
                                "flex items-center justify-between px-1 py-0.5 rounded-sm text-[8px] font-bold leading-none",
                                group.bg,
                                group.color
                              )}
                            >
                              <span className="truncate opacity-90">{group.label}</span>
                              <span>{groupTasks.length}</span>
                            </div>
                          );
                        })}
                      </div>
                   </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Dialog open={dayModalOpen} onOpenChange={setDayModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle className="flex items-center justify-between text-2xl font-bold pr-8">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-6 w-6 text-primary" />
                <span className="capitalize">
                  {selectedDay ? format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR }) : "Tarefas do Dia"}
                </span>
              </div>
              <Button 
                size="sm" 
                onClick={() => {
                  setDayModalOpen(false);
                  handleNewTask(selectedDay || undefined);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Tarefa
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-4">
            {selectedDay && (() => {
              const dayTasks = tasks.filter((t) => isSameDay(new Date(t.datetime), selectedDay));
              
              if (dayTasks.length === 0) {
                return (
                  <div className="py-10 text-center text-muted-foreground border border-dashed rounded-lg m-4">
                    <p className="text-sm">Nenhuma tarefa agendada.</p>
                  </div>
                );
              }

              return STATUS_GROUPS.map((group) => {
                const groupTasks = dayTasks.filter(t => getTaskStatusGroup(t) === group.id);
                if (groupTasks.length === 0) return null;

                return (
                  <div key={group.id} className="space-y-2">
                    <h3 className={cn("text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur py-2 z-10", group.color)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", group.id === "atrasada" ? "bg-red-500 animate-pulse" : group.bg.replace('bg-', 'bg-').split('/')[0])}></span>
                      {group.label}
                      <span className="ml-auto text-[9px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground font-medium">
                        {groupTasks.length}
                      </span>
                    </h3>
                    <div className="grid gap-1.5">
                      {groupTasks.map((task) => (
                        <div 
                          key={task.id} 
                          className={cn(
                            "group relative flex items-center justify-between gap-3 p-2.5 rounded-md border bg-card transition-all hover:border-primary/30 cursor-pointer shadow-sm",
                            group.id === "atrasada" && "border-red-200 bg-red-50/10"
                          )}
                          onClick={() => {
                            setDayModalOpen(false);
                            handleEditTask(task);
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn("font-medium text-sm truncate", group.id === "atrasada" && "text-red-700")}>{task.title}</span>
                              <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1 rounded flex items-center gap-1 shrink-0">
                                <Clock className="h-2.5 w-2.5" />
                                {format(new Date(task.datetime), "HH:mm")}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 items-center">
                              {task.client_name && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-secondary/30 px-1.5 rounded-sm">
                                  <User className="h-2.5 w-2.5" />
                                  {task.client_name}
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <div className="h-3 w-3 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-2 w-2 text-primary" />
                                </div>
                                {task.user_name}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full opacity-60 hover:opacity-100 hover:bg-emerald-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStatusMutation.mutate(task);
                              }}
                            >
                              {task.status === "concluído" ? (
                                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                              ) : (
                                <Circle className="h-4.5 w-4.5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </DialogContent>
      </Dialog>

      <TaskFormDialog
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        task={editingTask}
        defaultDate={selectedDay ? selectedDay.toISOString() : currentDate.toISOString()}
      />
    </div>
  );
}
