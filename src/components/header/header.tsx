"use client";
import { BookUpsert } from "@/modules/bookUpsert/bookUpsert";
import { CreateEditBookshelves } from "@/modules/shelves/components/createEditBookshelves/createEditBookshelves";
import React, { JSX, useEffect, useState } from "react";
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
import LogoIcon from "@/assets/icons/logo";
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
function Header() {
  const { bookUpsertModal, createShelfDialog, menuItems, pathname, router } =
    useHeader();

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isCondensed = scrolled;
  const user = useUserStore((state) => state.user);
  const isLogged = useIsLoggedIn();

  const renderMobileMenu = (): JSX.Element => {
    return (
      <div className="hidden">
        <div className="flex items-center justify-between w-full">
          <button
            className="flex items-center justify-center gap-0.5"
            onClick={() => router.push("/")}
          >
            <LogoIcon />
            <h1
              className={`font-bold transition-all duration-300 ${
                isCondensed ? "text-lg" : "text-xl"
              }`}
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
  };

  const renderDesktopMenu = (): JSX.Element => {
    return (
      <div className="">
        <div className="">
          <button
            className="flex items-center justify-center gap-0.5"
            onClick={() => router.push("/")}
          >
            <LogoIcon />
            <h1
              className={`font-bold transition-all duration-300 ${
                isCondensed ? "text-xl" : "text-2xl"
              }`}
            >
              Nosso TBR
            </h1>
          </button>
          <div className="md:flex items-center gap-2">
            <small className="text-sm leading-none font-medium">
              {user?.email}
            </small>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <CircleUser
                  className="w-6 h-6 text-primary cursor-pointer"
                  strokeWidth={1.5}
                />
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
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <BookUpsert
        isBookFormOpen={bookUpsertModal.isOpen}
        setIsBookFormOpen={bookUpsertModal.setIsOpen}
      />

      <CreateEditBookshelves
        isOpen={createShelfDialog.isOpen}
        handleClose={createShelfDialog.setIsOpen}
      />

      <header
        className={`bg-gray-50 shadow-sm fixed top-0 left-0 w-full z-50 transition-all duration-300 px-6 ${
          isCondensed ? "py-2 shadow-md" : "py-6"
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
