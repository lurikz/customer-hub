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
  addWeeks,
  subWeeks,
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
  User
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { tasksApi, type Task } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { TaskFormDialog } from "./TaskFormDialog";
import { TasksList } from "./TasksList";
import { cn } from "@/lib/utils";

export function Agenda() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"month" | "week" | "list">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterMyTasks, setFilterMyTasks] = useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", filterMyTasks ? user?.id : null],
    queryFn: () => tasksApi.list(filterMyTasks ? { userId: user?.id } : undefined),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (task: Task) => 
      tasksApi.update(task.id, { status: task.status === "pendente" ? "concluído" : "pendente" }),
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
      // Set the date in the local timezone for the datetime-local input
      const localDate = new Date(date);
      localDate.setHours(9, 0, 0, 0);
      setCurrentDate(localDate);
    }
    setTaskFormOpen(true);
  };

  const days = useMemo(() => {
    if (view === "month") {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    }
  }, [currentDate, view]);

  const nextDate = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
  };

  const prevDate = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
  };

  const resetToToday = () => setCurrentDate(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-card rounded-md border p-1">
            <Button 
              variant={view === "month" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setView("month")}
              className="h-8 gap-1.5"
            >
              <LayoutGrid className="h-4 w-4" />
              Mês
            </Button>
            <Button 
              variant={view === "week" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setView("week")}
              className="h-8 gap-1.5"
            >
              <CalendarIcon className="h-4 w-4" />
              Semana
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
                {format(currentDate, view === "month" ? "MMMM yyyy" : "'Semana de' d 'de' MMMM", { locale: ptBR })}
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

      {view === "list" ? (
        <TasksList 
          tasks={tasks} 
          onEdit={handleEditTask} 
          onToggleStatus={(t) => toggleStatusMutation.mutate(t)} 
        />
      ) : (
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border">
          {/* Header Dias da Semana */}
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div key={day} className="bg-muted/50 p-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}

          {/* Células de Dias */}
          {days.map((day, idx) => {
            const dayTasks = tasks.filter((t) => isSameDay(new Date(t.datetime), day));
            const isMonthDay = view === "week" || day.getMonth() === currentDate.getMonth();
            const isTodayDay = isToday(day);

            return (
              <div
                key={idx}
                className={cn(
                  "bg-card p-2 transition-colors hover:bg-muted/30",
                  view === "month" ? "min-h-[140px]" : "min-h-[300px]",
                  !isMonthDay && "bg-muted/20 text-muted-foreground",
                  isTodayDay && "bg-accent/10"
                )}
                onClick={() => handleNewTask(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm",
                    isTodayDay && "bg-primary text-primary-foreground font-bold"
                  )}>
                    {format(day, "d")}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {(view === "month" ? dayTasks.slice(0, 4) : dayTasks).map((task) => {
                    const isTaskOverdue = isPast(new Date(task.datetime)) && !isToday(new Date(task.datetime)) && task.status === "pendente";
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "group flex flex-col rounded border px-2 py-1.5 text-[10px] leading-tight cursor-pointer shadow-sm transition-all hover:ring-1 hover:ring-primary/20",
                          task.status === "concluído" 
                            ? "bg-muted/40 border-transparent text-muted-foreground" 
                            : isTaskOverdue 
                              ? "bg-destructive/10 border-destructive/30 text-destructive" 
                              : "bg-primary/5 border-primary/20 text-primary"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTask(task);
                        }}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className={cn("font-bold truncate", task.status === "concluído" && "line-through opacity-70")}>
                            {task.title}
                          </span>
                          <span className="shrink-0 opacity-70 font-medium tabular-nums">
                            {format(new Date(task.datetime), "HH:mm")}
                          </span>
                        </div>
                        {task.description && (
                          <p className={cn(
                            "line-clamp-2 text-[9px] leading-[1.2] opacity-80",
                            task.status === "concluído" && "opacity-50"
                          )}>
                            {task.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {view === "month" && dayTasks.length > 4 && (
                    <p className="text-[10px] text-muted-foreground text-center font-semibold bg-muted/30 rounded py-0.5">
                      + {dayTasks.length - 4} atividades
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskFormDialog
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        task={editingTask}
        defaultDate={currentDate.toISOString()}
      />
    </div>
  );
}