import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  BookshelfCreateValidator,
  bookshelfCreateSchema,
} from "../../validators/bookshelves.validator";
import { useBookshelves } from "../../hooks/useBookshelves";
import { BookshelfDomain } from "../../types/bookshelves.types";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FolderPlus, Pencil } from "lucide-react";
import { BlurOverlay } from "@/components/blurOverlay";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { SHELVES_LIST_PATH } from "@/lib/routes/shelves";

type BookshelfDialogProps = {
  isOpen: boolean;
  handleClose: (open: boolean) => void;
  editShelf?: BookshelfDomain;
};

export function CreateEditBookshelves({
  isOpen,
  handleClose,
  editShelf,
}: BookshelfDialogProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoggedIn = useIsLoggedIn();

  const form = useForm<BookshelfCreateValidator>({
    resolver: zodResolver(bookshelfCreateSchema),
    defaultValues: {
      name: editShelf?.name ?? "",
      ...editShelf,
    },
  });

  const { mutate, isCreating } = useBookshelves({
    handleClose,
    editShelf,
    fetchEnabled: isOpen,
  });

  function onSubmit(values: BookshelfCreateValidator) {
    mutate(values, {
      onSuccess: () => {
        if (pathname !== SHELVES_LIST_PATH) {
          router.push(SHELVES_LIST_PATH);
        }
        form.reset();
      },
    });
  }

  useEffect(() => {
    if (!isOpen) {
      form.reset({
        name: editShelf?.name ?? "",
      });
    }
  }, [form, isOpen, editShelf]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[425px]">
        <BlurOverlay showOverlay={!isLoggedIn}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              {editShelf ? (
                <Pencil className="w-5 h-5 text-primary shrink-0" strokeWidth={1.5} />
              ) : (
                <FolderPlus className="w-5 h-5 text-primary shrink-0" strokeWidth={1.5} />
              )}
              <DialogTitle>
                {editShelf ? "Editar Estante" : "Criar Nova Estante"}
              </DialogTitle>
            </div>
            <DialogDescription>
              {editShelf
                ? "Altere o nome da sua coleção."
                : "Dê um nome para sua nova coleção de livros."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Estante</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Livros de Ficção" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" isLoading={isCreating}>
                  {editShelf ? "Editar Estante" : "Criar Estante"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </BlurOverlay>
      </DialogContent>
    </Dialog>
  );
}
