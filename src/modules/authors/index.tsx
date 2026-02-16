import { useState } from "react";
import { DataTable } from "./components/dataTable";
import { AuthorDomain } from "./types";
import { AuthorsService } from "./services/authors.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumns } from "./components/columns";
import AuthorUpsert from "./components/authorUpsert";
import { ConfirmDialog } from "@/components";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AuthorsScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorDomain | null>(
    null,
  );
  const [isEdit, setIsEdit] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const authorsService = new AuthorsService();

  const { data: authors, isLoading: isLoadingAuthors } = useQuery({
    queryKey: ["authors"],
    queryFn: () =>
      authorsService.getAuthors({
        withCountBooks: true,
      }),
  });

  const handleEdit = (author: AuthorDomain) => {
    setSelectedAuthor(author);
    setIsAuthorModalOpen(true);
    setIsEdit(true);
  };

  const handleDelete = (author: AuthorDomain) => {
    setSelectedAuthor(author);
    setIsDeleteModalOpen(true);
  };

  const handleViewAuthorBooks = (author: AuthorDomain) => {
    router.replace(`/?authorId=${author.id}`);
  };
  const columns = createColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onView: handleViewAuthorBooks,
  });

  const { mutateAsync: deleteAutor } = useMutation({
    mutationFn: (id: string) => authorsService.deleteAuthor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      toast("Autor deletado com sucesso!", {
        className: "toast-success text-white",
      });
    },
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
            mode={isEdit ? "edit" : "create"}
            defaultName={selectedAuthor?.name ?? ""}
            authorId={selectedAuthor?.id ?? ""}
          />
          <ConfirmDialog
            open={isDeleteModalOpen}
            onOpenChange={setIsDeleteModalOpen}
            id={selectedAuthor?.id ?? ""}
            onConfirm={async (id: string) => {
              await deleteAutor(id);
              setIsDeleteModalOpen(false);
            }}
            queryKeyToInvalidate="author"
            title="Deletar Autor"
            buttonLabel="Deletar"
            description={`Tem certeza que deseja deletar o autor: ${selectedAuthor?.name}? Essa ação não pode ser desfeita.`}
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
