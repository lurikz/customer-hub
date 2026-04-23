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
  { id: "em_andamento", label: "Em andamento", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  { id: "pendente", label: "Pendentes", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  { id: "atrasada", label: "Atrasadas", color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
  { id: "concluído", label: "Concluídas", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  { id: "cancelada", label: "Canceladas", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-100" },
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

  const { data: tasks = [] } = useQuery({
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

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setDayModalOpen(true);
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <div className="flex flex-col gap-3 shrink-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-card rounded-md border p-1">
            <Button
              variant={view === "month" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("month")}
              className="h-8 gap-1.5"
            >
              <LayoutGrid className="h-4 w-4" />
              Calendário
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className="h-8 gap-1.5"
            >
              <List className="h-4 w-4" />
              Lista
            </Button>
          </div>

          {view !== "list" && (
            <div className="flex items-center gap-1 ml-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevDate}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8" onClick={resetToToday}>
                Hoje
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextDate}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="ml-2 font-semibold capitalize">
                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
              </h2>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
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

          <Button onClick={() => handleNewTask()} size="sm" className="gap-2">
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
            <div className="grid grid-cols-7 border-b bg-muted/30">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div key={day} className="p-2 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 flex-1 overflow-hidden divide-x divide-y">
              {days.map((day, idx) => {
                const dayTasks = tasks.filter((t) => isSameDay(new Date(t.datetime), day));
                const isMonthDay = day.getMonth() === currentDate.getMonth();
                const isTodayDay = isToday(day);

                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex flex-col min-h-0 bg-card p-1 transition-colors hover:bg-muted/10 cursor-pointer",
                      !isMonthDay && "bg-muted/5 opacity-40",
                      isTodayDay && "bg-accent/5"
                    )}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="flex items-center justify-between mb-0.5 px-1">
                      <span className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium",
                        isTodayDay ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      )}>
                        {format(day, "d")}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {dayTasks.length}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 space-y-1 overflow-hidden px-0.5 pb-1">
                      {STATUS_GROUPS.map((group) => {
                        const groupTasks = dayTasks.filter(t => getTaskStatusGroup(t) === group.id);
                        if (groupTasks.length === 0) return null;

                        return (
                          <div key={group.id} className="space-y-0.5">
                            <div className={cn("px-1 text-[8px] font-bold uppercase tracking-tight opacity-70", group.color)}>
                              {group.label}
                            </div>
                            <div className="space-y-0.5">
                              {groupTasks.slice(0, 2).map((task) => (
                                <div
                                  key={task.id}
                                  className={cn(
                                    "truncate rounded px-1 py-0.5 text-[9px] font-medium leading-none",
                                    group.bg,
                                    group.color,
                                    group.border,
                                    "border"
                                  )}
                                >
                                  {task.title}
                                </div>
                              ))}
                              {groupTasks.length > 2 && (
                                <div className="px-1 text-[8px] text-muted-foreground italic">
                                  +{groupTasks.length - 2}
                                </div>
                              )}
                            </div>
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
            <DialogTitle className="flex items-center justify-between text-2xl font-bold">
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
          
          <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
            {selectedDay && (() => {
              const dayTasks = tasks.filter((t) => isSameDay(new Date(t.datetime), selectedDay));
              
              if (dayTasks.length === 0) {
                return (
                  <div className="py-12 text-center text-muted-foreground">
                    <p>Nenhuma tarefa agendada para este dia.</p>
                  </div>
                );
              }

              return STATUS_GROUPS.map((group) => {
                const groupTasks = dayTasks.filter(t => getTaskStatusGroup(t) === group.id);
                if (groupTasks.length === 0) return null;

                return (
                  <div key={group.id} className="space-y-3">
                    <h3 className={cn("text-xs font-bold uppercase tracking-widest flex items-center gap-2", group.color)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", group.bg.replace('bg-', 'bg-').replace('50', '500'))}></span>
                      {group.label}
                      <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                        {groupTasks.length}
                      </span>
                    </h3>
                    <div className="grid gap-2">
                      {groupTasks.map((task) => (
                        <div 
                          key={task.id} 
                          className={cn(
                            "flex items-center justify-between gap-4 p-3 rounded-lg border bg-card transition-all hover:shadow-md cursor-pointer",
                            group.border
                          )}
                          onClick={() => {
                            setDayModalOpen(false);
                            handleEditTask(task);
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm truncate">{task.title}</span>
                              <Badge variant="outline" className="text-[10px] h-4 py-0 flex gap-1 items-center font-mono">
                                <Clock className="h-2.5 w-2.5" />
                                {format(new Date(task.datetime), "HH:mm")}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {task.client_name && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {task.client_name}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <div className="h-3 w-3 rounded-full bg-primary/20 flex items-center justify-center">
                                  <User className="h-2 w-2 text-primary" />
                                </div>
                                {task.user_name}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStatusMutation.mutate(task);
                              }}
                            >
                              {task.status === "concluído" ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
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
