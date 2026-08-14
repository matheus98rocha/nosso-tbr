"use client";

import React, { JSX, useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BookUpsert } from "@/modules/bookUpsert";
import { CreateEditBookshelves } from "@/modules/shelves/components/createEditBookshelves";
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
import { useHeader } from "./hooks/useHeader";
import { useHeaderAccount } from "./hooks/useHeaderAccount";
import { HomeSearchBar } from "./components/homeSearchBar";
import HeaderAccountMenu from "./components/headerAccountMenu";
import HeaderAccountSummary from "./components/headerAccountSummary";
import { useUserStore } from "@/stores/userStore";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { DesktopNavMenu } from "./components/navMenu";
import LogoIcon from "@/assets/icons/logo";
import { BookService } from "@/services/books/books.service";
import { INITIAL_FILTERS, QUERY_KEYS } from "@/constants/keys";
import { cn } from "@/lib/utils";

function Header() {
  const queryClient = useQueryClient();
  const { bookUpsertModal, createShelfDialog, menuItems, pathname, router } =
    useHeader();
  const [scrolled, setScrolled] = useState(false);

  const user = useUserStore((state) => state.user);
  const isLoadingUser = useUserStore((state) => state.loading);
  const isLogged = useIsLoggedIn();
  const {
    account,
    isLoading: isLoadingAccount,
    isLoggedIn,
    navigateToProfile,
    navigateToAuth,
    handleLogout,
  } = useHeaderAccount();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePrefetchHome = useCallback(() => {
    const bookService = new BookService();
    const myBooksFilters = { ...INITIAL_FILTERS, myBooks: true };
    const commonOptions = {
      staleTime: 1000 * 60 * 5,
    };

    const prefetchRequests = [
      queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.books.list(INITIAL_FILTERS, "", 0),
        queryFn: () =>
          bookService.getAll({
            page: 0,
            pageSize: 8,
            filters: INITIAL_FILTERS,
          }),
        ...commonOptions,
      }),
    ];

    if (isLogged && user?.id) {
      prefetchRequests.push(
        queryClient.prefetchQuery({
          queryKey: QUERY_KEYS.books.list(myBooksFilters, "", 0, user.id),
          queryFn: () =>
            bookService.getAll({
              page: 0,
              pageSize: 8,
              userId: user.id,
              filters: myBooksFilters,
            }),
          ...commonOptions,
        }),
      );
    }

    Promise.allSettled(prefetchRequests);
  }, [isLogged, queryClient, user?.id]);

  const renderMobileMenu = (): JSX.Element => (
    <div className="md:hidden flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-2 cursor-pointer transition-opacity duration-200 hover:opacity-70"
          onClick={() => router.push("/")}
          onMouseEnter={handlePrefetchHome}
          aria-label="Ir para a página inicial"
        >
          <LogoIcon
            className={`transition-all duration-300 ${scrolled ? "w-6 h-6" : "w-7 h-7"}`}
          />
          <span
            className={`font-bold tracking-tight transition-all duration-300 ${scrolled ? "text-lg" : "text-xl"}`}
          >
            Nosso TBR
          </span>
        </button>

        <div className="flex items-center gap-1">
          <HeaderAccountMenu
            account={account}
            isLoading={isLoadingAccount}
            isLoggedIn={isLoggedIn}
            onNavigateToProfile={navigateToProfile}
            onNavigateToAuth={navigateToAuth}
            onLogout={handleLogout}
            showDisplayName={false}
          />
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full transition-colors hover:bg-zinc-100"
                aria-label="Abrir menu de navegação"
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-full flex-col p-0 sm:max-w-sm"
            >
            <SheetHeader className="border-b px-6 py-5">
              <SheetTitle className="text-base font-semibold tracking-tight">
                Menu
              </SheetTitle>
            </SheetHeader>
            {isLogged && account && (
              <div className="border-b px-6 py-4">
                <HeaderAccountSummary account={account} />
              </div>
            )}
            {isLogged && (
              <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-4">
                {menuItems.map((menu) => (
                  <div key={menu.label}>
                    <p className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest px-3 mb-1">
                      {menu.label}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {menu.items.map((item) => {
                        const isActive = item.path && pathname === item.path;
                        return (
                          <SheetClose asChild key={item.label}>
                            <Button
                              variant="ghost"
                              className={cn(
                                "justify-start h-11 px-3 rounded-xl text-sm font-medium transition-colors",
                                isActive
                                  ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 cursor-default"
                                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
                              )}
                              onClick={!isActive ? item.action : undefined}
                              disabled={!!isActive}
                            >
                              {item.label}
                            </Button>
                          </SheetClose>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <SheetFooter className="border-t px-4 py-4">
              <SheetClose asChild>
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-xl font-medium"
                >
                  Fechar
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        </div>
      </div>
      {pathname === "/" && <HomeSearchBar />}
    </div>
  );

  const renderDesktopMenu = (): JSX.Element => (
    <div className="hidden md:flex items-center justify-between gap-6">
      <button
        className="flex items-center gap-2.5 cursor-pointer transition-opacity duration-200 hover:opacity-75 shrink-0"
        onClick={() => router.push("/")}
        onMouseEnter={handlePrefetchHome}
        aria-label="Ir para a página inicial"
      >
        <LogoIcon
          className={`transition-all duration-300 ${scrolled ? "w-7 h-7" : "w-10 h-10"}`}
        />
        <span
          className={`font-bold tracking-tight transition-all duration-300 whitespace-nowrap ${scrolled ? "text-base" : "text-2xl"}`}
        >
          Nosso TBR
        </span>
      </button>
      {isLogged && (
        <div className="flex flex-col items-center justify-center flex-1 min-w-0 gap-2">
          {(!scrolled || isLogged) && (
            <DesktopNavMenu
              bookUpsertModal={bookUpsertModal}
              isLoading={isLoadingUser}
            />
          )}
          {pathname === "/" && <HomeSearchBar />}
        </div>
      )}
      <div className="flex shrink-0 items-center gap-2">
        <HeaderAccountMenu
          account={account}
          isLoading={isLoadingAccount}
          isLoggedIn={isLoggedIn}
          onNavigateToProfile={navigateToProfile}
          onNavigateToAuth={navigateToAuth}
          onLogout={handleLogout}
        />
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
        className={cn(
          "fixed top-0 left-0 w-full z-50 transition-all duration-300 px-6 border-b",
          scrolled
            ? "py-2 bg-white/90 backdrop-blur-md shadow-sm border-zinc-200/80"
            : "py-6 bg-white border-transparent",
        )}
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
