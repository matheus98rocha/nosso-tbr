import { useState } from "react";
import { AuthorUpsert } from "../bookUpsert/components";
import { DataTable } from "./components/dataTable";
import { AuthorDomain } from "./types";
import { AuthorsService } from "./services/authors.service";
import { useQuery } from "@tanstack/react-query";
import { createColumns } from "./components/columns";

export default function AuthorsScreen() {
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorDomain | null>(
    null,
  );

  const authorsService = new AuthorsService();

  const { data: authors, isLoading: isLoadingAuthors } = useQuery({
    queryKey: ["authors"],
    queryFn: () => authorsService.getAuthors(),
  });

  const handleEdit = (author: AuthorDomain) => {
    setSelectedAuthor(author);
    setIsAuthorModalOpen(true);
  };

  const handleDelete = (author: AuthorDomain) => {
    console.log("Delete author:", author);
  };

  const columns = createColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <>
      {isLoadingAuthors ? (
        "Loading..."
      ) : (
        <>
          <AuthorUpsert
            isOpen={isAuthorModalOpen}
            onOpenChange={setIsAuthorModalOpen}
            onSuccess={() => console.log("Autor criado com sucesso")}
            mode={selectedAuthor === null ? "create" : "edit"}
            defaultName={selectedAuthor?.name ?? ""}
          />
          <DataTable
            columns={columns}
            data={authors ?? []}
            topAction={
              <button
                onClick={() => setIsAuthorModalOpen(true)}
                className="bg-black text-white px-4 py-2 rounded-md hover:opacity-80 transition"
              >
                Novo Autor
              </button>
            }
          />
        </>
      )}
    </>
  );
}
