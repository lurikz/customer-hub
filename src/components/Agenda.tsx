import { useState, useMemo, useEffect } from "react";
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
  User,
  Clock,
  CheckCircle2,
  Circle,
  MoreHorizontal
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
  };

  const prevDate = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
  };

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
