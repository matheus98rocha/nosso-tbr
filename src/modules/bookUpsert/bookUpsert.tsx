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
          className={`h-full sm:h-[80%] w-full ${
            isLoggedIn ? "overflow-y-auto" : "overflow-hidden"
          }`}
        >
          <BlurOverlay showOverlay={!isLoggedIn}>
            <DialogHeader>
              <DialogTitle className="mb-4">
                {props.bookData ? "Editar Livro" : "Adicione um novo livro"}
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
                          items={authors}
                          value={field.value}
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
                            onChange={(e) => handlePageNumberChange(field, e)}
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
                              handleChosenByFieldChange(field, selectedUserId)
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
                          onCheckedChange={() => handleStatusChange(id)}
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
