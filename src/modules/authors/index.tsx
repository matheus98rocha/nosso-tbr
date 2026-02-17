import { useCallback, useEffect, useState, useMemo } from "react";
import { DataTable } from "./components/dataTable";
import { AuthorDomain } from "./types";
import { AuthorsService } from "./services/authors.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumns } from "./components/columns";
import AuthorUpsert from "./components/authorUpsert";
import { ConfirmDialog } from "@/components";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import DefaultPagination from "@/components/pagintation/pagination";

const PAGE_SIZE = 10;

export default function AuthorsScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(0);
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorDomain | null>(
    null,
  );
  const [isEdit, setIsEdit] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [searchName, setSearchName] = useState("");
  const [filterName, setFilterName] = useState("");

  const authorsService = useMemo(() => new AuthorsService(), []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilterName(searchName);
      setCurrentPage(0);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchName]);

  const { data, isLoading: isLoadingAuthors } = useQuery({
    queryKey: ["authors", currentPage, filterName],
    queryFn: () =>
      authorsService.getAuthors({
        withCountBooks: true,
        page: currentPage,
        pageSize: PAGE_SIZE,
        searchName: filterName,
      }),
  });

  const totalPages = useMemo(
    () => Math.ceil((data?.total ?? 0) / PAGE_SIZE),
    [data?.total],
  );

  const handleEdit = useCallback((author: AuthorDomain) => {
    setSelectedAuthor(author);
    setIsAuthorModalOpen(true);
    setIsEdit(true);
  }, []);

  const handleDelete = useCallback((author: AuthorDomain) => {
    setSelectedAuthor(author);
    setIsDeleteModalOpen(true);
  }, []);

  const handleViewAuthorBooks = useCallback(
    (author: AuthorDomain) => {
      router.replace(`/?authorId=${author.id}`);
    },
    [router],
  );

  const columns = useMemo(
    () =>
      createColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onView: handleViewAuthorBooks,
      }),
    [handleEdit, handleDelete, handleViewAuthorBooks],
  );

  const { mutateAsync: deleteAutor } = useMutation({
    mutationFn: (id: string) => authorsService.deleteAuthor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      toast("Autor deletado com sucesso!", {
        className: "toast-success text-white",
      });
    },
  });

  const handleClickNewAuthor = useCallback(() => {
    setIsEdit(false);
    setSelectedAuthor(null);
    setIsAuthorModalOpen(true);
  }, []);

  const handleSearchNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchName(e.target.value);
    },
    [],
  );

  const handleClearSearch = useCallback(() => {
    setSearchName("");
    setFilterName("");
    setCurrentPage(0);
  }, []);

  const onConfirmDelete = useCallback(
    async (id: string) => {
      await deleteAutor(id);
      setIsDeleteModalOpen(false);
    },
    [deleteAutor],
  );

  return (
    <div className="space-y-4">
      <AuthorUpsert
        isOpen={isAuthorModalOpen}
        onOpenChange={setIsAuthorModalOpen}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ["authors"] })
        }
        mode={isEdit ? "edit" : "create"}
        defaultName={selectedAuthor?.name ?? ""}
        authorId={selectedAuthor?.id ?? ""}
      />

      <ConfirmDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        id={selectedAuthor?.id ?? ""}
        onConfirm={onConfirmDelete}
        queryKeyToInvalidate="authors"
        title="Deletar Autor"
        buttonLabel="Deletar"
        description={`Tem certeza que deseja deletar o autor: ${selectedAuthor?.name}? Essa ação não pode ser desfeita.`}
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        onClickNewAuthor={handleClickNewAuthor}
        onChangeSearch={handleSearchNameChange}
        onClearSearch={handleClearSearch}
        searchValue={searchName}
        isLoading={isLoadingAuthors}
      />

      <DefaultPagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
}
