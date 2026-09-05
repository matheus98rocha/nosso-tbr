import {
  BookMarked,
  BookOpen,
  Library,
  Search,
  XIcon,
} from "lucide-react";

import { BlurOverlay } from "@/components";
import { DatePicker } from "@/components/datePicker";
import { SelectField } from "@/components/selectField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { genders } from "@/constants/genders";
import { cn } from "@/lib/utils";
import { AuthorUpsert } from "@/modules/authors/components";
import { FinishedReadingRatingDialog } from "@/modules/bookRating";
import { DateUtils } from "@/utils";

import { CreateBookProps } from "./bookUpsert.types";
import {
  AutocompleteInput,
  BookLookupPanel,
  BookParticipationBlockedDialog,
  FoundCatalogBookDialog,
} from "./components";
import BookUpsertSection from "./components/bookUpsertSection";
import { useBookUpsert } from "./hooks/useBookUpsert";

export function BookUpsert(props: CreateBookProps) {
  const {
    isLoggedIn,
    onSubmit,
    isLoading,
    isAddToShelfEnabled,
    selected,
    selectedShelfId,
    setIsAddToShelfEnabled,
    setSelectedShelfId,
    isDiscoveryOpen,
    isLinkingToExistingBook,
    matchedBook,
    form,
    handleSubmit,
    control,
    checkboxes,
    isEdit,
    isLoadingBookshelves,
    bookshelfOptions,
    authors,
    isLoadingAuthors,
    emptyAuthorSearch,
    isAuthorModalOpen,
    handleOpenAddAuthorModal,
    handleAuthorModalOpenChange,
    handleAuthorCreated,
    authorSearch,
    handleDialogOpenChange,
    handleCancelDiscoveryDialog,
    isParticipationBlockOpen,
    closeParticipationBlock,
    handleLinkToExistingBook,
    handleIgnoreAndCreateNewBook,
    handleStatusChange,
    handlePageNumberChange,
    handleAuthorSearchChange,
    plannedStartDateLabel,
    shouldShowPlannedStartDate,
    isLoadingUsers,
    chosenByOptions,
    bookData,
    foundBook,
    isSearchingBooks,
    lookupError,
    lookupQuery,
    handleLookupQueryChange,
    handleSearchBooks,
    ratingPromptBookId,
    handleDismissRatingPrompt,
  } = useBookUpsert(props);

  const coverUrl = form.watch("image_url");

  return (
    <>
      <FinishedReadingRatingDialog
        bookId={ratingPromptBookId}
        open={Boolean(ratingPromptBookId)}
        onDismiss={handleDismissRatingPrompt}
      />
      <AuthorUpsert
        isOpen={isAuthorModalOpen}
        onOpenChange={handleAuthorModalOpenChange}
        defaultName={authorSearch}
        onSuccess={handleAuthorCreated}
        mode="create"
      />
      <BookParticipationBlockedDialog
        open={isParticipationBlockOpen}
        bookTitle={matchedBook?.candidate.title}
        onDismiss={closeParticipationBlock}
      />
      <FoundCatalogBookDialog
        open={isDiscoveryOpen}
        matchedBook={matchedBook}
        isLinkingToExisting={isLinkingToExistingBook}
        onAddExisting={handleLinkToExistingBook}
        onIgnoreAndCreate={handleIgnoreAndCreateNewBook}
        onCancel={handleCancelDiscoveryDialog}
      />
      <Dialog open={props.isBookFormOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "inset-x-0 bottom-0 top-auto left-0 translate-x-0 translate-y-0",
            "max-w-none rounded-t-3xl rounded-b-none h-[92dvh]",
            "sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:max-w-lg",
            "sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:h-[80%]",
            "flex flex-col gap-0 overflow-hidden border-zinc-200/80 p-0",
            "bg-[linear-gradient(180deg,#fffdf8_0%,#faf7f2_48%,#ffffff_100%)]",
            "dark:border-zinc-700/80 dark:bg-[linear-gradient(180deg,#27272a_0%,#18181b_100%)]",
          )}
        >
          <BlurOverlay showOverlay={!isLoggedIn}>
            <div
              className="flex justify-center pt-3 pb-1 sm:hidden"
              aria-hidden="true"
            >
              <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
            </div>

            <div
              className={cn(
                "shrink-0 border-b border-zinc-200/80 px-4 py-4 sm:px-6",
                "dark:border-zinc-700/70",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl",
                      "bg-zinc-900 text-zinc-50 shadow-sm",
                      "dark:bg-zinc-100 dark:text-zinc-900",
                    )}
                    aria-hidden
                  >
                    <BookOpen className="size-5" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <DialogTitle className="text-lg font-semibold tracking-tight">
                      {props.bookData
                        ? "Editar Livro"
                        : "Adicione um novo livro"}
                    </DialogTitle>
                    <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {props.bookData
                        ? "Atualize os dados e o andamento da leitura."
                        : "Busque pelo título ou preencha os detalhes na mão."}
                    </p>
                  </div>
                </div>
                <DialogClose
                  className="cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                  aria-label="Fechar"
                >
                  <XIcon className="size-4" />
                  <span className="sr-only">Fechar</span>
                </DialogClose>
              </div>
            </div>

            <div
              className={cn(
                "min-h-0 flex-1 overscroll-contain px-4 sm:px-6",
                isLoggedIn ? "overflow-y-auto" : "overflow-hidden",
              )}
            >
              <Form {...form}>
                <form
                  id="book-upsert-form"
                  onSubmit={handleSubmit(onSubmit)}
                  className="grid gap-4 py-5"
                >
                  {!isEdit && (
                    <BookUpsertSection
                      title="Busca automática"
                      description="Ache o livro pelo título ou ISBN e preencha o formulário em segundos."
                      icon={<Search className="size-4" />}
                    >
                      <BookLookupPanel
                        isSearching={isSearchingBooks}
                        error={lookupError}
                        foundBook={foundBook}
                        lookupQuery={lookupQuery}
                        onQueryChange={handleLookupQueryChange}
                        onSearch={handleSearchBooks}
                      />
                    </BookUpsertSection>
                  )}

                  <BookUpsertSection
                    title="Sobre o livro"
                    description="Informações básicas para identificar a obra na sua estante."
                    icon={<BookMarked className="size-4" />}
                  >
                    <FormField
                      control={control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Livro</FormLabel>
                          <FormControl>
                            <Input {...field} autoFocus={false} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL da Capa</FormLabel>
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "flex h-[4.5rem] w-12 shrink-0 items-center justify-center overflow-hidden rounded-md",
                                "border border-zinc-200 bg-zinc-100 shadow-sm",
                                "dark:border-zinc-700 dark:bg-zinc-800",
                              )}
                              aria-hidden
                            >
                              {coverUrl ? (
                                <img
                                  src={coverUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <BookOpen className="size-4 text-zinc-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <FormControl>
                                <Input
                                  placeholder="Link da capa na Amazon; deixe em branco para usar capa padrão"
                                  {...field}
                                  autoFocus={false}
                                />
                              </FormControl>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="author_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Autor</FormLabel>
                          <FormControl>
                            <div className="w-full">
                              <AutocompleteInput
                                items={authors}
                                value={field.value}
                                initialLabel={props.bookData?.author}
                                isLoading={isLoadingAuthors}
                                onValueChange={field.onChange}
                                onSearch={handleAuthorSearchChange}
                                onAddNew={handleOpenAddAuthorModal}
                                placeholder="Pesquisar autor..."
                                emptyMessage={
                                  emptyAuthorSearch
                                    ? "Não encontramos esse autor..."
                                    : ""
                                }
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gênero</FormLabel>
                            <FormControl>
                              <div className="w-full">
                                <SelectField
                                  value={field.value ?? undefined}
                                  onChange={field.onChange}
                                  items={genders}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="pages"
                        render={({ field }) => {
                          const isEmptyField =
                            field.value === undefined || field.value === null;
                          const value = isEmptyField ? undefined : field.value;
                          return (
                            <FormItem>
                              <FormLabel>Páginas</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  {...field}
                                  value={value ?? ""}
                                  onChange={(e) =>
                                    handlePageNumberChange(field, e)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                  </BookUpsertSection>

                  <BookUpsertSection
                    title="Leitura"
                    description="Quem lê, em que status está e as datas importantes."
                    icon={<BookOpen className="size-4" />}
                  >
                    <FormField
                      control={control}
                      name="readers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quem vai ler o livro?</FormLabel>
                          <FormControl>
                            <div className="flex flex-wrap gap-2">
                              {isLoadingUsers
                                ? [1, 2, 3].map((i) => (
                                    <div
                                      key={i}
                                      className="h-9 w-24 animate-pulse rounded-full bg-muted"
                                    />
                                  ))
                                : chosenByOptions.map(({ label, value }) => {
                                    const isSelected = (
                                      field.value ?? []
                                    ).includes(value);
                                    return (
                                      <button
                                        key={value}
                                        type="button"
                                        id={`readers-${value}`}
                                        aria-pressed={isSelected}
                                        onClick={() => {
                                          const cur = field.value ?? [];
                                          const next = isSelected
                                            ? cur.filter(
                                                (id: string) => id !== value,
                                              )
                                            : [...cur, value];
                                          field.onChange(next);
                                        }}
                                        className={cn(
                                          "inline-flex min-h-11 items-center rounded-full border px-3.5 text-sm font-medium transition-colors",
                                          isSelected
                                            ? "border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                                            : "border-zinc-200 bg-white/80 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300",
                                        )}
                                      >
                                        {label}
                                      </button>
                                    );
                                  })}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-2">
                      <Label>Status da leitura</Label>
                      <div
                        className="flex flex-wrap gap-2"
                        role="radiogroup"
                        aria-label="Status da leitura"
                      >
                        {checkboxes.map(({ id, label }) => {
                          const isSelected = selected === id;
                          return (
                            <button
                              key={id}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => handleStatusChange(id)}
                              className={cn(
                                "min-h-11 rounded-full border px-3.5 text-left text-sm font-medium transition-all",
                                isSelected
                                  ? "border-amber-500/70 bg-amber-100 text-amber-950 shadow-sm dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-100"
                                  : "border-zinc-200 bg-white/80 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300",
                              )}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {shouldShowPlannedStartDate && (
                      <FormField
                        control={control}
                        name="planned_start_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{plannedStartDateLabel}</FormLabel>
                            <FormControl>
                              <div className="w-full">
                                <DatePicker
                                  value={
                                    DateUtils.toDate(field.value) ?? undefined
                                  }
                                  onChange={(date) =>
                                    field.onChange(
                                      DateUtils.toISOString(date) || null,
                                    )
                                  }
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={control}
                      name="is_reread"
                      render={({ field }) => (
                        <FormItem>
                          <div
                            className={cn(
                              "flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3.5",
                              "border-zinc-200/90 bg-white/70",
                              "dark:border-zinc-700/80 dark:bg-zinc-950/30",
                            )}
                          >
                            <Label htmlFor="is-reread" className="text-sm">
                              Este livro é uma releitura?
                            </Label>
                            <Switch
                              id="is-reread"
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                            />
                          </div>
                        </FormItem>
                      )}
                    />

                    {selected !== "not_started" && selected !== null && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={control}
                          name="start_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Início</FormLabel>
                              <FormControl>
                                <div className="w-full">
                                  <DatePicker
                                    isAfterTodayHidden
                                    value={
                                      DateUtils.toDate(field.value) ?? undefined
                                    }
                                    onChange={(date) =>
                                      field.onChange(
                                        DateUtils.toISOString(date) || null,
                                      )
                                    }
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {selected === "finished" && (
                          <FormField
                            control={control}
                            name="end_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Data de Término</FormLabel>
                                <FormControl>
                                  <div className="w-full">
                                    <DatePicker
                                      isAfterTodayHidden
                                      value={
                                        DateUtils.toDate(field.value) ??
                                        undefined
                                      }
                                      onChange={(date) =>
                                        field.onChange(
                                          DateUtils.toISOString(date) || null,
                                        )
                                      }
                                    />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Se não informar, usaremos a data de hoje como
                                  data de término.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    )}
                  </BookUpsertSection>

                  {!isEdit && (
                    <BookUpsertSection
                      title="Estante"
                      description="Opcional: organize o livro em uma estante agora."
                      icon={<Library className="size-4" />}
                    >
                      <div
                        className={cn(
                          "flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3.5",
                          "border-zinc-200/90 bg-white/70",
                          "dark:border-zinc-700/80 dark:bg-zinc-950/30",
                        )}
                      >
                        <Label htmlFor="add-to-shelf" className="text-sm">
                          Adicionar a uma estante?
                        </Label>
                        <Switch
                          id="add-to-shelf"
                          checked={isAddToShelfEnabled}
                          onCheckedChange={setIsAddToShelfEnabled}
                          aria-label="Adicionar livro a uma estante"
                        />
                      </div>

                      {isLoadingBookshelves && isAddToShelfEnabled && (
                        <div className="h-9 w-full animate-pulse rounded bg-muted" />
                      )}

                      {!isLoadingBookshelves && isAddToShelfEnabled && (
                        <SelectField
                          items={bookshelfOptions}
                          value={selectedShelfId}
                          onChange={setSelectedShelfId}
                          placeholder="Selecione uma estante"
                        />
                      )}
                    </BookUpsertSection>
                  )}
                </form>
              </Form>
            </div>

            <div
              className={cn(
                "shrink-0 border-t border-zinc-200/80 bg-white/90 px-4 py-4 backdrop-blur-md sm:px-6",
                "dark:border-zinc-700/70 dark:bg-zinc-950/80",
                !isLoggedIn ? "pointer-events-none opacity-50" : "",
              )}
            >
              <DialogFooter className="gap-2 sm:gap-2">
                <DialogClose asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  form="book-upsert-form"
                  isLoading={isLoading}
                  className={cn(
                    "w-full sm:w-auto",
                    "bg-zinc-900 text-zinc-50 hover:bg-zinc-800",
                    "dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white",
                  )}
                >
                  {bookData ? "Editar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </div>
          </BlurOverlay>
        </DialogContent>
      </Dialog>
    </>
  );
}
