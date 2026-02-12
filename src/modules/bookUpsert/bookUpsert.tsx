import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SelectField } from "../home/components/select/select.";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "../home/components/datePicker/datePicker";
import { useBookDialog } from "./hooks/useBookDialog";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { BlurOverlay, ConfirmDialog } from "@/components/";
import { CreateBookProps } from "./bookUpsert.types";
import { useUser } from "@/services/users/hooks/useUsers";
import { genders } from "@/constants/genders";
import { BookUpsertService } from "./services/bookUpsert.service";
import { useQuery } from "@tanstack/react-query";
import { ComboboxOption } from "./types/authorOptions";
import { AuthorUpsert, AutocompleteInput } from "./components";

export function BookUpsert({
  bookData,
  isBookFormOpen,
  setIsBookFormOpen,
}: CreateBookProps) {
  const isLoggedIn = useIsLoggedIn();
  const { chosenByOptions, isLoadingUsers } = useUser();

  const {
    onSubmit,
    isLoading,
    isAddToShelfEnabled,
    selected,
    selectedShelfId,
    setIsAddToShelfEnabled,
    setSelected,
    setSelectedShelfId,
    isDuplicateBookDialogOpen,
    setIsDuplicateBookDialogOpen,
    form,
    reset,
    handleSubmit,
    control,
    checkboxes,
    isEdit,
    isLoadingBookshelves,
    bookshelfOptions,
    handleConfirmCreateBook,
    handleOnChangePageNumber,
    handleChosenByChange,
  } = useBookDialog({
    bookData,
    setIsBookFormOpen,
    chosenByOptions,
  });

  const [authorSearch, setAuthorSearch] = React.useState("");
  const [isAuthorModalOpen, setIsAuthorModalOpen] = React.useState(false);

  const deferredAuthorSearch = React.useDeferredValue(authorSearch);

  const bookUpsertService = React.useMemo(() => new BookUpsertService(), []);

  const { data: authors = [], isLoading: isLoadingAuthors } = useQuery({
    queryKey: ["authors", deferredAuthorSearch], // Use o deferred aqui
    queryFn: () => bookUpsertService.searchAuthors(deferredAuthorSearch),
    staleTime: 1000 * 60 * 5,
  });

  const handleOpenAddAuthorModal = () => {
    setIsAuthorModalOpen(true);
  };

  const handleAuthorCreated = (authorId: string) => {
    form.setValue("author_id", authorId);
  };

  return (
    <>
      <AuthorUpsert
        isOpen={isAuthorModalOpen}
        onOpenChange={setIsAuthorModalOpen}
        defaultName={authorSearch}
        onSuccess={handleAuthorCreated}
      />
      <ConfirmDialog
        open={isDuplicateBookDialogOpen}
        onOpenChange={setIsDuplicateBookDialogOpen}
        title="Livro Duplicado"
        description="Um livro com este título já existe, deseja continuar?"
        onConfirm={() => handleConfirmCreateBook()}
        id="duplicate-book-warning"
        queryKeyToInvalidate="books"
        buttonLabel="Continuar"
        onCancel={() => {
          setIsDuplicateBookDialogOpen(false);
          setIsBookFormOpen(true);
        }}
      />
      <Dialog
        open={isBookFormOpen}
        onOpenChange={(isBookFormOpen) => {
          if (!isBookFormOpen) {
            reset();
            setSelected(null);
            setAuthorSearch("");
          }
          setIsBookFormOpen(isBookFormOpen);
        }}
      >
        <DialogContent
          className={`h-full sm:h-[80%] w-full ${
            isLoggedIn ? "overflow-y-auto" : "overflow-hidden"
          }`}
        >
          <BlurOverlay showOverlay={!isLoggedIn}>
            <DialogHeader>
              <DialogTitle className="mb-4">
                {bookData ? "Editar Livro" : "Adicione um novo livro"}
              </DialogTitle>
            </DialogHeader>
            <Separator orientation="horizontal" className="mt-4 mb-4" />
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
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
                      <FormLabel>URL do Livro</FormLabel>
                      <FormControl>
                        <Input {...field} autoFocus={false} />
                      </FormControl>
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
                        <AutocompleteInput
                          items={authors as ComboboxOption[]}
                          value={field.value}
                          isLoading={isLoadingAuthors}
                          onValueChange={field.onChange}
                          onSearch={setAuthorSearch}
                          onAddNew={handleOpenAddAuthorModal}
                          placeholder="Pesquisar autor..."
                          emptyMessage="Não encontramos esse autor..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gênero</FormLabel>
                      <FormControl>
                        <SelectField
                          value={field.value ?? undefined}
                          onChange={field.onChange}
                          items={genders}
                        />
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
                        <FormLabel>Número de páginas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={value ?? ""}
                            onChange={(e) => handleOnChangePageNumber(field, e)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={control}
                  name="user_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quem escolheu?</FormLabel>
                      <FormControl>
                        {isLoadingUsers ? (
                          <p className="text-sm text-muted-foreground">
                            Carregando perfis...
                          </p>
                        ) : (
                          <SelectField
                            value={field.value}
                            onChange={(selectedUserId) =>
                              handleChosenByChange(field, selectedUserId)
                            }
                            items={chosenByOptions}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="readers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quem vai ler o livro?</FormLabel>
                      <FormControl>
                        <SelectField
                          value={field.value}
                          onChange={field.onChange}
                          items={[
                            { label: "Matheus", value: "Matheus" },
                            { label: "Fabi", value: "Fabi" },
                            {
                              label: "Matheus e Fabi",
                              value: "Matheus e Fabi",
                            },
                            {
                              label: "Barbara e Fabi",
                              value: "Barbara e Fabi",
                            },
                            {
                              label: "Barbara,Fabi e Matheus",
                              value: "Barbara,Fabi e Matheus",
                            },
                          ]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>Status da leitura</FormLabel>
                  <div className="flex items-start justify-center flex-col gap-3">
                    {checkboxes.map(({ id, label }) => (
                      <div key={id} className="flex items-center gap-2">
                        <Checkbox
                          id={id}
                          checked={selected === id}
                          onCheckedChange={() =>
                            selected === id
                              ? setSelected(null)
                              : setSelected(id)
                          }
                        />
                        <FormLabel htmlFor={id}>{label}</FormLabel>
                      </div>
                    ))}
                  </div>
                </FormItem>

                {selected !== "not_started" && selected !== null && (
                  <>
                    <FormField
                      control={control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Início da Leitura</FormLabel>
                          <FormControl>
                            <DatePicker
                              isAfterTodayHidden
                              value={
                                field.value ? new Date(field.value) : undefined
                              }
                              onChange={(date) =>
                                field.onChange(date?.toISOString() ?? null)
                              }
                            />
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
                            <FormLabel>Data de Término da Leitura</FormLabel>
                            <FormControl>
                              <DatePicker
                                isAfterTodayHidden
                                value={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onChange={(date) =>
                                  field.onChange(date?.toISOString() ?? null)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}

                {!isEdit && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="airplane-mode"
                        checked={isAddToShelfEnabled}
                        onCheckedChange={setIsAddToShelfEnabled}
                      />
                      <Label htmlFor="airplane-mode">
                        Deseja adicionar esse livro a uma estante?
                      </Label>
                    </div>
                    {!isLoadingBookshelves && isAddToShelfEnabled && (
                      <SelectField
                        items={bookshelfOptions}
                        value={selectedShelfId}
                        onChange={setSelectedShelfId}
                        placeholder="Selecione uma estante"
                      />
                    )}
                    {isLoadingBookshelves && (
                      <p className="text-sm text-muted-foreground">
                        Carregando estantes...
                      </p>
                    )}
                  </>
                )}

                <Separator orientation="horizontal" />
                <DialogFooter
                  className={
                    !isLoggedIn ? "pointer-events-none opacity-50" : ""
                  }
                >
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button type="submit" isLoading={isLoading}>
                    {bookData ? "Editar" : "Adicionar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </BlurOverlay>
        </DialogContent>
      </Dialog>
    </>
  );
}
