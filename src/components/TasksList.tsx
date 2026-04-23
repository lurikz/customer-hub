import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, CheckCircle2, Circle, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Task } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
}

export function TasksList({ tasks, onEdit, onToggleStatus }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <CalendarIcon className="h-10 w-10 text-muted-foreground opacity-20" />
        <h3 className="mt-4 text-lg font-medium">Nenhuma tarefa encontrada</h3>
        <p className="text-sm text-muted-foreground">
          Não há tarefas para o período ou filtros selecionados.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Tarefa</TableHead>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const date = new Date(task.datetime);
            const isOverdue = isPast(date) && task.status === "pendente";

            return (
              <TableRow 
                key={task.id} 
                className={cn(
                  isOverdue && "bg-destructive/10 text-destructive hover:bg-destructive/15",
                  task.status === "concluído" && "opacity-60"
                )}
              >
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStatus(task);
                    }}
                    className={cn("h-8 w-8 rounded-full")}
                  >
                    {task.status === "concluído" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 fill-green-50" />
                    ) : (
                      <Circle className={cn("h-5 w-5", isOverdue ? "text-destructive" : "text-muted-foreground")} />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{task.title}</span>
                    {task.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {task.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className={cn(isOverdue && "font-semibold text-destructive")}>
                      {format(date, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {task.client_name ? (
                    <span className="text-sm">{task.client_name}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Sem vínculo</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {task.user_name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={task.status === "concluído" ? "secondary" : isOverdue ? "destructive" : "outline"}
                  >
                    {task.status === "concluído" ? "Concluído" : isOverdue ? "Atrasado" : "Pendente"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}