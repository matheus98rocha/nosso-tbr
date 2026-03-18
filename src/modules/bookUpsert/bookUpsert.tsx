import React from "react";
import { XIcon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/selectField/selectField";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/datePicker/datePicker";

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
import { BlurOverlay, ConfirmDialog } from "@/components/";
import { CreateBookProps } from "./bookUpsert.types";
import { genders } from "@/constants/genders";
import { AutocompleteInput } from "./components";
import AuthorUpsert from "../authors/components/authorUpsert";
import { useBookUpsert } from "./hooks/useBookUpsert";
import { DateUtils } from "@/utils";

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
    isDuplicateBookDialogOpen,
    handleConfirmCreateBook,
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
    handleCancelDuplicateDialog,
    handleStatusChange,
    handlePageNumberChange,
    handleChosenByFieldChange,
    handleAuthorSearchChange,
    isLoadingUsers,
    chosenByOptions,
    bookData,
  } = useBookUpsert(props);

  const showPlannedDate = !form.watch("start_date") && !form.watch("end_date");
  return (
    <>
      <AuthorUpsert
        isOpen={isAuthorModalOpen}
        onOpenChange={handleAuthorModalOpenChange}
        defaultName={authorSearch}
        onSuccess={handleAuthorCreated}
        mode="create"
      />
      <ConfirmDialog
        open={isDuplicateBookDialogOpen}
        onOpenChange={handleDialogOpenChange}
        title="Livro Duplicado"
        description="Um livro com este título já existe, deseja continuar?"
        onConfirm={handleConfirmCreateBook}
        id="duplicate-book-warning"
        queryKeyToInvalidate="books"
        buttonLabel="Continuar"
        onCancel={handleCancelDuplicateDialog}
      />
      <Dialog open={props.isBookFormOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="inset-x-0 bottom-0 top-auto left-0 translate-x-0 translate-y-0 max-w-none rounded-t-2xl rounded-b-none h-[92dvh] sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:h-[80%] flex flex-col gap-0 p-0 overflow-hidden"
        >
          <BlurOverlay showOverlay={!isLoggedIn}>
            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden="true">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
            </div>

            {/* Sticky header */}
            <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b">
              <DialogTitle>
                {props.bookData ? "Editar Livro" : "Adicione um novo livro"}
              </DialogTitle>
              <DialogClose
                className="cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                aria-label="Fechar"
              >
                <XIcon className="size-4" />
                <span className="sr-only">Fechar</span>
              </DialogClose>
            </div>

            {/* Scrollable body */}
            <div
              className={`flex-1 min-h-0 overscroll-contain px-4 sm:px-6 ${
                isLoggedIn ? "overflow-y-auto" : "overflow-hidden"
              }`}
            >
              <Form {...form}>
                <form
                  id="book-upsert-form"
                  onSubmit={handleSubmit(onSubmit)}
                  className="grid gap-6 py-5"
                >
                  <section className="grid gap-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Sobre o livro
                    </p>

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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
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
                              <FormLabel>Páginas</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
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
                  </section>

                  <Separator orientation="horizontal" />

                  <section className="grid gap-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Leitura
                    </p>

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
                                  label: "Barbara, Fabi e Matheus",
                                  value: "Barbara,Fabi e Matheus",
                                },
                              ]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="user_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quem escolheu?</FormLabel>
                          <FormControl>
                            {isLoadingUsers ? (
                              <div className="flex gap-4">
                                {[1, 2].map((i) => (
                                  <div
                                    key={i}
                                    className="h-5 w-20 animate-pulse rounded bg-muted"
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-x-6 gap-y-1">
                                {chosenByOptions.map(({ label, value }) => (
                                  <div
                                    key={value}
                                    className="flex items-center gap-2 min-h-[44px]"
                                  >
                                    <Checkbox
                                      id={`chosen-by-${value}`}
                                      checked={field.value === value}
                                      onCheckedChange={() =>
                                        handleChosenByFieldChange(field, value)
                                      }
                                    />
                                    <FormLabel htmlFor={`chosen-by-${value}`}>
                                      {label}
                                    </FormLabel>
                                  </div>
                                ))}
                              </div>
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormItem>
                      <FormLabel>Status da leitura</FormLabel>
                      <div className="flex flex-wrap gap-x-6 gap-y-1">
                        {checkboxes.map(({ id, label }) => (
                          <div
                            key={id}
                            className="flex items-center gap-2 min-h-[44px]"
                          >
                            <Checkbox
                              id={id}
                              checked={selected === id}
                              onCheckedChange={() => handleStatusChange(id)}
                            />
                            <FormLabel htmlFor={id}>{label}</FormLabel>
                          </div>
                        ))}
                      </div>
                    </FormItem>

                    {showPlannedDate && (
                      <FormField
                        control={control}
                        name="planned_start_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Previsão de Início da Leitura</FormLabel>
                            <FormControl>
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
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {selected !== "not_started" && selected !== null && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={control}
                          name="start_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Início</FormLabel>
                              <FormControl>
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
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    )}
                  </section>

                  {!isEdit && (
                    <>
                      <Separator orientation="horizontal" />

                      <section className="grid gap-4">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Estante
                        </p>

                        <div className="flex items-center gap-3 min-h-[44px]">
                          <Switch
                            id="add-to-shelf"
                            checked={isAddToShelfEnabled}
                            onCheckedChange={setIsAddToShelfEnabled}
                            aria-label="Adicionar livro a uma estante"
                          />
                          <Label htmlFor="add-to-shelf">
                            Adicionar a uma estante?
                          </Label>
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
                      </section>
                    </>
                  )}
                </form>
              </Form>
            </div>

            {/* Sticky footer */}
            <div
              className={`shrink-0 border-t px-4 sm:px-6 py-4 bg-background ${
                !isLoggedIn ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  form="book-upsert-form"
                  isLoading={isLoading}
                  className="w-full sm:w-auto"
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
