"use client";

import React, { JSX, useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BookUpsert } from "@/modules/bookUpsert/bookUpsert";
import { CreateEditBookshelves } from "@/modules/shelves/components/createEditBookshelves/createEditBookshelves";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CircleUser, Menu as MenuIcon } from "lucide-react";
import { Separator } from "../ui/separator";
import { useHeader } from "./hooks/useHeader";
import { HomeSearchBar } from "./components/homeSearchBar/homeSearchBar";
import { useUserStore } from "@/stores/userStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "../ui/dropdown-menu";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { DesktopNavMenu } from "./components/navMenu/navMenu";
import { Skeleton } from "../ui/skeleton";
import LogoIcon from "@/assets/icons/logo";
import { MyBooksSearchBar } from "./components/mySearchBar/myBooksSearchBar";
import { BookService } from "@/services/books/books.service";
import { INITIAL_FILTERS, QUERY_KEYS } from "@/constants/keys";

function Header() {
  const queryClient = useQueryClient();
  const { bookUpsertModal, createShelfDialog, menuItems, pathname, router } =
    useHeader();
  const [scrolled, setScrolled] = useState(false);

  const user = useUserStore((state) => state.user);
  const isLoadingUser = useUserStore((state) => state.loading);
  const isLogged = useIsLoggedIn();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePrefetchHome = useCallback(() => {
    const bookService = new BookService();
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.books.list(INITIAL_FILTERS, "", 0),
      queryFn: () =>
        bookService.getAll({ page: 0, pageSize: 8, filters: INITIAL_FILTERS }),
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient]);

  const renderMobileMenu = (): JSX.Element => (
    <div className="md:hidden flex items-center justify-center gap-4 flex-col">
      <div className="flex items-center justify-between w-full">
        <button
          className="flex items-center justify-center gap-0.5"
          onClick={() => router.push("/")}
          onMouseEnter={handlePrefetchHome}
        >
          <h1
            className={`font-bold transition-all duration-300 ${scrolled ? "text-xl" : "text-2xl"}`}
          >
            Nosso TBR
          </h1>
        </button>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <MenuIcon size={64} />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-full sm:max-w-sm flex flex-col p-0"
          >
            <SheetHeader className="p-8 pb-4 border-b">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6 pt-4 flex flex-col gap-6">
              {menuItems.map((menu) => (
                <div key={menu.label}>
                  <span className="text-lg font-semibold">{menu.label}</span>
                  <div className="flex flex-col gap-2 mt-2">
                    {menu.items.map((item) => {
                      const isActive = item.path && pathname === item.path;
                      return (
                        <SheetClose asChild key={item.label}>
                          <Button
                            variant="ghost"
                            className="justify-start"
                            onClick={!isActive ? item.action : undefined}
                            disabled={!!isActive}
                          >
                            {item.label}
                          </Button>
                        </SheetClose>
                      );
                    })}
                  </div>
                  <Separator className="mt-2 mb-2" />
                </div>
              ))}
            </div>

            <SheetFooter className="p-4 border-t">
              <SheetClose asChild>
                <Button variant="outline" className="w-full">
                  Fechar
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      {pathname === "/" && <HomeSearchBar />}
    </div>
  );

  const renderDesktopMenu = (): JSX.Element => (
    <div className="hidden md:flex items-start justify-between">
      <div className="flex items-start gap-3">
        <button
          className="flex items-center justify-center gap-2 transition-all duration-300"
          onClick={() => router.push("/")}
          onMouseEnter={handlePrefetchHome}
        >
          <LogoIcon
            className={`transition-all duration-300 ${scrolled ? "w-6 h-6" : "w-60 h-60"}`}
          />
          <h1
            className={`font-bold transition-all duration-300 whitespace-nowrap ${scrolled ? "text-base" : "text-2xl"}`}
          >
            Nosso TBR
          </h1>
        </button>
      </div>

      <div className="flex flex-col items-center justify-center w-full gap-2">
        {(!scrolled || isLogged) && (
          <DesktopNavMenu
            bookUpsertModal={bookUpsertModal}
            isLoading={isLoadingUser}
          />
        )}
        {pathname === "/" && <HomeSearchBar />}
        {pathname === "/my-books" && <MyBooksSearchBar />}
      </div>

      <div className="md:flex items-center gap-2">
        {isLoadingUser ? (
          <Skeleton className="h-4 w-[200px]" />
        ) : (
          <>
            <small className="text-sm leading-none font-medium">
              {user?.email}
            </small>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-11 h-11 rounded-full"
                  aria-label="Menu da conta"
                >
                  <CircleUser
                    className="w-5 h-5 text-primary"
                    strokeWidth={1.5}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLogged ? (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => useUserStore.getState().logout()}
                  >
                    Sair
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push("/auth")}
                  >
                    Entrar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {pathname !== "/" && !isLogged && (
        <BookUpsert
          isBookFormOpen={bookUpsertModal.isOpen}
          setIsBookFormOpen={bookUpsertModal.setIsOpen}
        />
      )}

      <CreateEditBookshelves
        isOpen={createShelfDialog.isOpen}
        handleClose={() => createShelfDialog.setIsOpen(false)}
      />

      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 px-6 border-b ${
          scrolled
            ? "py-2 shadow-md bg-white/80 backdrop-blur-md border-white/20"
            : "py-6 bg-white shadow-sm border-transparent"
        }`}
      >
        <div className="container mx-auto flex flex-col gap-2">
          {renderDesktopMenu()}
          {renderMobileMenu()}
        </div>
      </header>
    </>
  );
}

export default Header;
