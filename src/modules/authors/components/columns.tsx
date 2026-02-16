import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Eye } from "lucide-react";
import { AuthorDomain } from "../types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DateUtils } from "@/utils";

interface ColumnsProps {
  onEdit: (author: AuthorDomain) => void;
  onDelete: (author: AuthorDomain) => void;
  onView: (author: AuthorDomain) => void;
}

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}

function ActionButton({ label, onClick, icon }: ActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className="hover:bg-slate-100 p-1 rounded-md transition-colors"
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export const createColumns = ({
  onEdit,
  onDelete,
  onView,
}: ColumnsProps): ColumnDef<AuthorDomain>[] => [
  {
    accessorKey: "name",
    header: "Autor",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "totalBooks",
    header: () => <div className="text-center">Livros Cadastrados</div>,
    cell: ({ row }) => (
      <div className="text-center font-mono">
        {row.original.totalBooks ?? 0}
      </div>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Criado em",
    cell: ({ row }) => {
      const value = row.original.createdAt;

      return DateUtils.formatForDisplay(value as string);
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const author = row.original;

      const actions = [
        {
          label: "Visualizar Livros do autor",
          onClick: () => onView(author),
          icon: <Eye className="h-4 w-4 text-green-500" />,
        },
        {
          label: "Editar",
          onClick: () => onEdit(author),
          icon: <Pencil className="h-4 w-4 text-blue-500" />,
        },
        {
          label: "Excluir",
          onClick: () => onDelete(author),
          icon: <Trash2 className="h-4 w-4 text-red-500" />,
        },
      ];

      return (
        <div className="flex justify-end gap-3">
          {actions.map((action) => (
            <ActionButton
              key={action.label}
              label={action.label}
              onClick={action.onClick}
              icon={action.icon}
            />
          ))}
        </div>
      );
    },
  },
];
