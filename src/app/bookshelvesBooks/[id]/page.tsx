import ClientBookshelfBooks from "@/modules/bookshelvesBooks";

type Props = {
  params: { id: string };
};

async function BookshelvesBooks({ params }: Props) {
  return (
    <div>
      <ClientBookshelfBooks bookshelfId={params.id} />
    </div>
  );
}

export default BookshelvesBooks;
