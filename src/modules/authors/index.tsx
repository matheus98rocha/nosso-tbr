import { useCallback, useEffect, useState } from "react";
import { DataTable } from "./components/dataTable";
import { AuthorDomain } from "./types";
import { AuthorsService } from "./services/authors.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumns } from "./components/columns";
import AuthorUpsert from "./components/authorUpsert";
import { ConfirmDialog } from "@/components";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

  const authorsService = new AuthorsService();

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

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

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

  return (
    <div className="space-y-4">
      <>
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
          onConfirm={async (id: string) => {
            await deleteAutor(id);
            setIsDeleteModalOpen(false);
          }}
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

        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 0) setCurrentPage((prev) => prev - 1);
                  }}
                  className={
                    currentPage === 0
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }).map((_, idx) => (
                <PaginationItem key={idx}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === idx}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(idx);
                    }}
                  >
                    {idx + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages - 1)
                      setCurrentPage((prev) => prev + 1);
                  }}
                  className={
                    currentPage === totalPages - 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </>
    </div>
  );
}
