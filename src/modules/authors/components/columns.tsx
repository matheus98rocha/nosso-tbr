import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { AuthorDomain } from "../types";

interface ColumnsProps {
  onEdit: (author: AuthorDomain) => void;
  onDelete: (author: AuthorDomain) => void;
}

export const createColumns = ({
  onEdit,
  onDelete,
}: ColumnsProps): ColumnDef<AuthorDomain>[] => [
  {
    accessorKey: "name",
    header: "Autor",
  },
  {
    accessorKey: "created_at",
    header: "Criado em",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return date.toLocaleDateString("pt-BR");
    },
  },
  {
    id: "actions",
    // header: "Ações",
    cell: ({ row }) => {
      const author = row.original;

      return (
        <div className="flex justify-end gap-3">
          <button onClick={() => onEdit(author)}>
            <Pencil className="h-4 w-4 text-blue-500" />
          </button>

          <button onClick={() => onDelete(author)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      );
    },
  },
];
