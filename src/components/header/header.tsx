"use client";
import { BookUpsert } from "@/modules/bookUpsert/bookUpsert";
import { CreateEditBookshelves } from "@/modules/shelves/components/createEditBookshelves/createEditBookshelves";
import React, { JSX } from "react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "../ui/menubar";
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
import { Menu as MenuIcon } from "lucide-react";
import { Separator } from "../ui/separator";
import { useHeader } from "./useHeader";

function Header() {
  const { bookUpsertModal, createShelfDialog, menuItems, pathname, router } =
    useHeader();

  const renderMobileMenu = (): JSX.Element => {
    return (
      <div className="md:hidden">
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
    );
  };

  const renderDesktopMenu = (): JSX.Element => {
    return (
      <div className="hidden md:flex items-center gap-2">
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

      <header className="flex justify-between items-center container py-2">
        <button onClick={() => router.push("/")}>
          <h1 className="text-2xl font-bold">Nosso TBR</h1>
        </button>

        {renderDesktopMenu()}

        {renderMobileMenu()}
      </header>
    </>
  );
}

export default Header;
