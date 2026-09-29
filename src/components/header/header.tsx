"use client";

import { type JSX, Suspense } from "react";

import LogoIcon from "@/assets/icons/logo";
import { cn } from "@/lib/utils";
import { CreateEditBookshelves } from "@/modules/shelves/components/createEditBookshelves";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";

import { BottomNav } from "./components/bottomNav";
import HeaderAccountMenu from "./components/headerAccountMenu";
import { HomeSearchBar } from "./components/homeSearchBar";
import { DesktopNavMenu } from "./components/navMenu";
import {
  BOTTOM_NAV_CLASS,
  DESKTOP_NAV_SLOT_CLASS,
  HOME_SEARCH_FALLBACK_CLASS,
} from "./constants";
import { useHeader } from "./hooks/useHeader";
import { useHeaderAccount } from "./hooks/useHeaderAccount";
import { useHeaderChrome } from "./hooks/useHeaderChrome";

function Header() {
  const {
    createShelfDialog,
    mobileOverflowItems,
    mobilePrimaryItems,
    pathname,
    router,
  } = useHeader();
  const { handlePrefetchHome, scrolled } = useHeaderChrome();
  const isLoadingUser = useUserStore((state) => state.loading);
  const isLogged = useIsLoggedIn();
  const {
    account,
    handleLogout,
    isLoading: isLoadingAccount,
    isLoggedIn,
    navigateToAuth,
    navigateToProfile,
  } = useHeaderAccount();

  const homeSearchBar: JSX.Element | null =
    pathname === "/" ? (
      <Suspense
        fallback={<div className={HOME_SEARCH_FALLBACK_CLASS} aria-hidden />}
      >
        <HomeSearchBar />
      </Suspense>
    ) : null;

  return (
    <>
      <CreateEditBookshelves
        isOpen={createShelfDialog.isOpen}
        handleClose={() => createShelfDialog.setIsOpen(false)}
      />

      <header
        data-testid="app-header"
        className={cn("app-topbar", scrolled && "is-scrolled")}
      >
        <div className="container mx-auto flex flex-col gap-2 px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              className="flex shrink-0 cursor-pointer items-center gap-2 transition-opacity duration-200 hover:opacity-70"
              onClick={() => router.push("/")}
              onMouseEnter={handlePrefetchHome}
              aria-label="Ir para a página inicial"
            >
              <LogoIcon
                className={cn(
                  "transition-all duration-300",
                  scrolled ? "h-6 w-6 md:h-7 md:w-7" : "h-7 w-7 md:h-8 md:w-8",
                )}
              />
              <span
                className={cn(
                  "brand-display font-semibold tracking-tight whitespace-nowrap text-[var(--reading-ink)] transition-all duration-300",
                  scrolled ? "text-lg" : "text-xl md:text-[1.35rem]",
                )}
              >
                Nosso TBR
              </span>
            </button>

            <div
              data-testid="app-header-desktop-nav"
              className={DESKTOP_NAV_SLOT_CLASS}
            >
              <DesktopNavMenu isLoading={isLoadingUser} />
            </div>

            <HeaderAccountMenu
              account={account}
              isLoading={isLoadingAccount}
              isLoggedIn={isLoggedIn}
              onNavigateToProfile={navigateToProfile}
              onNavigateToAuth={navigateToAuth}
              onLogout={handleLogout}
            />
          </div>
          {homeSearchBar}
        </div>
      </header>

      {isLogged ? (
        <div data-testid="app-header-bottom-nav" className={BOTTOM_NAV_CLASS}>
          <BottomNav
            items={mobilePrimaryItems}
            overflowItems={mobileOverflowItems}
            pathname={pathname}
          />
        </div>
      ) : null}
    </>
  );
}

export default Header;
