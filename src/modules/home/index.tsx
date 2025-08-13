"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BookUpsert } from "@/modules/bookUpsert/bookUpsert";
import { useHome } from "@/modules/home/hooks/useHome";
import { useModal } from "@/hooks/useModal";
import FiltersSheet, {
  FiltersOptions,
} from "./components/filtersSheet/filters";
import { ListGrid } from "../../components/listGrid/listGrid";
import { BookDomain } from "../../types/books.types";
import { BookCard } from "./components/bookCard/bookCard";
import { CreateEditBookshelves } from "../shelves/components/createEditBookshelves/createEditBookshelves";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useRouter, useSearchParams } from "next/navigation";
import { genders } from "./utils/genderBook";
import { Sliders } from "lucide-react";
import {
  InputWithButton,
  InputWithButtonRef,
} from "@/components/inputWithButton/inputWithButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUserStore } from "@/stores/userStore";

export default function ClientHome() {
  const logout = useUserStore((state) => state.logout);
  const isLoggingOut = useUserStore((state) => state.isLoggingOut);

  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FiltersOptions>({
    readers: [],
    gender: [],
    status: [],
  });

  const initialSearch = searchParams.get("search") ?? "";
  const searchQuery = searchParams.get("search") ?? "";
  const inputRef = useRef<InputWithButtonRef>(null);

  const statusDictionary = {
    finished: "Terminei a Leitura",
    reading: "Já iniciei a leitura",
    not_started: "Vou iniciar a leitura",
  };

  const dialogModal = useModal();
  const filtersSheet = useModal();
  const createShelfDialog = useModal();

  const {
    allBooks,
    isFetched,
    isLoadingAllBooks,
    isError,
    user,
    isLoadingUser,
  } = useHome({
    filters,
    search: searchQuery,
  });
  console.log("User data:", user);
  const handleOnPressEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    if (event.key === "Enter" && value.trim() !== "") {
      updateSearchInUrl(value);
    }
  };

  const handleClearAllFilters = () => {
    setFilters({ readers: [], gender: [], status: [] });
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    updateSearchInUrl("");
    inputRef.current?.clear();
  };

  const updateSearchInUrl = (term: string) => {
    const trimmed = term.trim();
    const params = new URLSearchParams(searchParams.toString());

    if (trimmed) {
      params.set("search", trimmed);
    } else {
      params.delete("search");
    }

    const qs = params.toString();
    const target = qs ? `?${qs}` : window.location.pathname;
    router.push(target);
  };

  const handleInputBlur = (value: string) => updateSearchInUrl(value);
  const handleSearchButtonClick = (value: string) => updateSearchInUrl(value);

  const formatList = (items: string[]) => {
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} e ${items[1]}`;
    return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
  };

  const formattedGenres =
    Array.isArray(filters?.gender) && filters.gender.length > 0
      ? formatList(
          filters.gender.map(
            (value) => genders.find((g) => g.value === value)?.label ?? value
          )
        )
      : null;

  const formattedReaders =
    Array.isArray(filters?.readers) && filters.readers.length > 0
      ? formatList(filters.readers)
      : null;

  const formattedStatus =
    Array.isArray(filters?.status) && filters.status.length > 0
      ? formatList(
          filters.status.map(
            (value) =>
              `"${
                statusDictionary[value as keyof typeof statusDictionary] ??
                value
              }"`
          )
        )
      : null;
  type MenuItem = {
    label: string;
    action: () => void;
    requiresAuth?: boolean;
    hideIfLoggedIn?: boolean;
  };

  type Menu = {
    label: string;
    items: MenuItem[];
  };

  const allMenuItems: Menu[] = [
    {
      label: "Livros",
      items: [
        {
          label: "Adicionar Livro",
          action: () => dialogModal.setIsOpen(true),
          requiresAuth: true,
        },
      ],
    },
    {
      label: "Estatisticas",
      items: [{ label: "Estatisticas", action: () => router.push("/stats") }],
    },
    {
      label: "Estantes",
      items: [
        { label: "Ver Estantes", action: () => router.push("/shelves") },
        {
          label: "Adicionar Estante",
          action: () => createShelfDialog.setIsOpen(true),
          requiresAuth: true,
        },
      ],
    },
    {
      label: "Conta",
      items: [
        {
          label: "Login",
          action: () => router.push("/auth"),
          requiresAuth: false, // só exibe se não estiver logado
          hideIfLoggedIn: true,
        },
      ],
    },
  ];

  const menuItems = allMenuItems
    .map((menu) => ({
      ...menu,
      items: menu.items.filter((item) => {
        if (item.requiresAuth && !user) return false;
        if (item.hideIfLoggedIn && user) return false;
        return true;
      }),
    }))
    .filter((menu) => menu.items.length > 0);

  return (
    <>
      <BookUpsert
        isOpen={dialogModal.isOpen}
        onOpenChange={dialogModal.setIsOpen}
      />

      <FiltersSheet
        filters={filters}
        setFilters={setFilters}
        open={filtersSheet.isOpen}
        setIsOpen={filtersSheet.setIsOpen}
      />

      <CreateEditBookshelves
        isOpen={createShelfDialog.isOpen}
        handleClose={createShelfDialog.setIsOpen}
      />

      <main className="p-6 flex flex-col items-center gap-6">
        <header className="flex justify-between items-center container">
          <button onClick={() => router.push("/")}>
            <h1 className="text-2xl font-bold mb-4">Nosso TBR</h1>
          </button>
          <div className="flex items-center gap-2">
            <Menubar>
              {menuItems.map((menu) => (
                <MenubarMenu key={menu.label}>
                  <MenubarTrigger>{menu.label}</MenubarTrigger>
                  <MenubarContent>
                    {menu.items.map((item) => (
                      <MenubarItem key={item.label} onClick={item.action}>
                        {item.label}
                      </MenubarItem>
                    ))}
                  </MenubarContent>
                </MenubarMenu>
              ))}
            </Menubar>

            {user !== undefined && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>ADM</AvatarFallback>
                    <span className="sr-only">Toggle user menu</span>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem asChild>
                    <Button
                      variant="outline"
                      className="block w-full text-left"
                      onClick={() => logout()}
                    >
                      Sair
                    </Button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>
        <div className="w-full flex items-center justify-center flex-col gap-4 container">
          <div className="grid w-full mx-auto grid-cols-[1fr_auto] gap-2 items-center">
            <InputWithButton
              ref={inputRef}
              defaultValue={initialSearch}
              onBlur={handleInputBlur}
              onButtonClick={handleSearchButtonClick}
              placeholder="Pesquise por título do livro ou nome do autor"
              onKeyDown={handleOnPressEnter}
            />

            <Button
              variant="ghost"
              onClick={() => filtersSheet.setIsOpen(true)}
              className="border border-gray-300 hover:bg-gray-100 flex items-center gap-1"
              aria-label="Filters"
            >
              <Sliders size={16} />
              Filtros
            </Button>
          </div>
          {!isLoadingAllBooks && (
            <div className="flex items-start justify-center flex-col container">
              <h4 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                Resultados
              </h4>

              <p className="leading-7">
                Foram encontrados:{" "}
                <strong>{allBooks?.length || 0} livros</strong>
              </p>
              <div className="flex items-center justify-center gap-4">
                {(formattedGenres ||
                  formattedReaders ||
                  formattedStatus ||
                  searchQuery) && (
                  <p className="leading-7 text-muted-foreground mt-2">
                    {searchQuery && (
                      <>
                        Buscando por: <strong>{searchQuery}</strong>
                        {(formattedGenres ||
                          formattedReaders ||
                          formattedStatus) && <br />}
                      </>
                    )}

                    {(formattedGenres ||
                      formattedReaders ||
                      formattedStatus) && (
                      <>
                        Filtros aplicados:
                        {formattedGenres && ` gênero ${formattedGenres}`}
                        {formattedReaders &&
                          `${
                            formattedGenres ? "," : ""
                          } Leitor(s) ${formattedReaders}`}
                        {formattedStatus &&
                          `${
                            formattedGenres || formattedReaders ? " e" : ""
                          } com status ${formattedStatus}`}
                      </>
                    )}
                  </p>
                )}

                {(searchQuery ||
                  (Array.isArray(filters.gender) &&
                    filters.gender.length > 0) ||
                  (Array.isArray(filters.readers) &&
                    filters.readers.length > 0) ||
                  (Array.isArray(filters.status) &&
                    filters.status.length > 0)) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      handleClearAllFilters();
                    }}
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            </div>
          )}

          <ListGrid<BookDomain>
            items={allBooks ?? []}
            isLoading={isLoadingAllBooks || isLoadingUser || isLoggingOut}
            isFetched={isFetched}
            renderItem={(book) => <BookCard key={book.id} book={book} />}
            isError={isError}
          />
        </div>
      </main>
    </>
  );
}
