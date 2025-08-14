"use client";
import { useModal } from "@/hooks/useModal";
import { BookUpsert } from "@/modules/bookUpsert/bookUpsert";
import { CreateEditBookshelves } from "@/modules/shelves/components/createEditBookshelves/createEditBookshelves";
import { useRouter, usePathname } from "next/navigation";
import React from "react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "../ui/menubar";
import { useUserStore } from "@/stores/userStore";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { Menu } from "./header.types";

function Header() {
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
          requiresAuth: true,
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

  return (
    <>
      <BookUpsert
        isOpen={bookUpsertModal.isOpen}
        onOpenChange={bookUpsertModal.setIsOpen}
      />

      <CreateEditBookshelves
        isOpen={createShelfDialog.isOpen}
        handleClose={createShelfDialog.setIsOpen}
      />

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
                  {menu.items.map((item) => {
                    const isActive = item.path && pathname === item.path;
                    return (
                      <MenubarItem
                        key={item.label}
                        onClick={!isActive ? item.action : undefined}
                        disabled={!!isActive}
                      >
                        {item.label}
                      </MenubarItem>
                    );
                  })}
                </MenubarContent>
              </MenubarMenu>
            ))}
          </Menubar>
        </div>
      </header>
    </>
  );
}

export default Header;
