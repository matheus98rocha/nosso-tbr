import { useModal } from "@/hooks/useModal";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "../header.types";

export function useHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const bookUpsertModal = useModal();
  const createShelfDialog = useModal();
  const logout = useUserStore((state) => state.logout);
  const isLoggedIn = useIsLoggedIn();

  const allMenuItems: Menu[] = [
    {
      label: "Livros",
      items: [
        {
          label: "Adicionar Livro",
          action: () => bookUpsertModal.setIsOpen(true),
          requiresAuth: false,
        },
      ],
    },
    {
      label: "Estatisticas",
      items: [
        {
          label: "Estatisticas",
          action: () => router.push("/stats"),
          path: "/stats",
        },
      ],
    },
    {
      label: "Estantes",
      items: [
        {
          label: "Ver Estantes",
          action: () => router.push("/shelves"),
          path: "/shelves",
        },
        {
          label: "Adicionar Estante",
          action: () => createShelfDialog.setIsOpen(true),
          requiresAuth: false,
        },
      ],
    },
    {
      label: "Conta",
      items: [
        {
          label: "Login",
          action: () => router.push("/auth"),
          path: "/auth",
          requiresAuth: false,
          hideIfLoggedIn: true,
        },
      ],
    },
    {
      label: "Conta",
      items: [
        {
          label: "Logout",
          action: () => logout(),
          requiresAuth: true,
          hideIfLoggedIn: false,
        },
      ],
    },
  ];

  const menuItems = allMenuItems
    .map((menu) => ({
      ...menu,
      items: menu.items.filter((item) => {
        if (item.requiresAuth && !isLoggedIn) return false;
        if (item.hideIfLoggedIn && isLoggedIn) return false;
        return true;
      }),
    }))
    .filter((menu) => menu.items.length > 0);

  return {
    menuItems,
    bookUpsertModal,
    createShelfDialog,
    logout,
    isLoggedIn,
    router,
    pathname,
  };
}
