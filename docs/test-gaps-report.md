# Relatório de cenários sem teste pareado

Critério: arquivo `.ts`/`.tsx` (não `*.test.*`, `*.spec.*`, `*.d.ts`) sem teste com mesmo basename no mesmo diretório.
Exceções desta versão do relatório: `src/components/ui/**` (componentes base do shadcn/ui).

Total de arquivos sem teste pareado: **235**

## Resumo por área (top 15)
- `src/modules/schedule`: **18**
- `src/components/header`: **16**
- `src/modules/profile`: **15**
- `src/modules/shelves`: **15**
- `src/app/api`: **12**
- `src/modules/bookUpsert`: **10**
- `src/modules/home`: **10**
- `src/components/bookCard`: **9**
- `src/app/(main)`: **8**
- `src/modules/authors`: **7**
- `src/modules/quotes`: **7**
- `src/modules/stats`: **7**
- `(raiz)`: **4**
- `src/app/(auth)`: **4**
- `src/components/confirmDialog`: **4**

## Lista completa

### (raiz)
- `database.types.ts`
- `next.config.ts`

### src/app/(auth)/auth/error
- `src/app/(auth)/auth/error/page.tsx`

### src/app/(auth)/forgot-password
- `src/app/(auth)/forgot-password/page.tsx`

### src/app/(auth)/register
- `src/app/(auth)/register/page.tsx`

### src/app/(auth)/reset-password
- `src/app/(auth)/reset-password/page.tsx`

### src/app/(main)/authors
- `src/app/(main)/authors/page.tsx`

### src/app/(main)
- `src/app/(main)/layout.tsx`
- `src/app/(main)/loading.tsx`
- `src/app/(main)/page.tsx`

### src/app/(main)/profile
- `src/app/(main)/profile/page.tsx`

### src/app/(main)/quotes/[title]/[id]
- `src/app/(main)/quotes/[title]/[id]/page.tsx`

### src/app/(main)/schedule/[id]/[title]
- `src/app/(main)/schedule/[id]/[title]/page.tsx`

### src/app/(main)/stats
- `src/app/(main)/stats/page.tsx`

### src/app/api/_utils
- `src/app/api/_utils/requireUser.ts`

### src/app/api/authors/[id]
- `src/app/api/authors/[id]/route.ts`

### src/app/api/authors
- `src/app/api/authors/route.ts`

### src/app/api/books/[id]/link
- `src/app/api/books/[id]/link/route.ts`

### src/app/api/quotes/[id]
- `src/app/api/quotes/[id]/route.ts`

### src/app/api/quotes
- `src/app/api/quotes/route.ts`

### src/app/api/schedule/[id]
- `src/app/api/schedule/[id]/route.ts`

### src/app/api/schedule
- `src/app/api/schedule/route.ts`

### src/app/api/shelves/[id]/books/[bookId]
- `src/app/api/shelves/[id]/books/[bookId]/route.ts`

### src/app/api/shelves/[id]
- `src/app/api/shelves/[id]/route.ts`

### src/app/api/shelves
- `src/app/api/shelves/route.tsx`

### src/app/api/users
- `src/app/api/users/route.ts`

### src/app
- `src/app/layout.tsx`

### src/assets/icons
- `src/assets/icons/logo.tsx`
- `src/assets/icons/nova-logo.tsx`

### src/components/blurOverlay
- `src/components/blurOverlay/index.ts`

### src/components/blurOverlay/types
- `src/components/blurOverlay/types/blurOverlay.types.ts`

### src/components/bookCard
- `src/components/bookCard/bookCard.tsx`

### src/components/bookCard/components/addBookToShelf
- `src/components/bookCard/components/addBookToShelf/addBookToShelf.tsx`
- `src/components/bookCard/components/addBookToShelf/index.ts`

### src/components/bookCard/components/addBookToShelf/types
- `src/components/bookCard/components/addBookToShelf/types/addBookToShelf.types.ts`

### src/components/bookCard/components/dropdownBook
- `src/components/bookCard/components/dropdownBook/dropdownBook.tsx`
- `src/components/bookCard/components/dropdownBook/index.ts`

### src/components/bookCard/components/dropdownBook/types
- `src/components/bookCard/components/dropdownBook/types/dropdownBook.types.ts`

### src/components/bookCard
- `src/components/bookCard/index.ts`

### src/components/bookCard/types
- `src/components/bookCard/types/bookCard.types.ts`

### src/components/confirmDialog
- `src/components/confirmDialog/confirmDialog.tsx`
- `src/components/confirmDialog/confirmDialog.types.ts`

### src/components/confirmDialog/hooks
- `src/components/confirmDialog/hooks/useConfirmDialog.ts`

### src/components/confirmDialog
- `src/components/confirmDialog/index.ts`

### src/components/datePicker
- `src/components/datePicker/index.ts`

### src/components/datePicker/types
- `src/components/datePicker/types/datePicker.types.ts`

### src/components/defaultPagintation/types
- `src/components/defaultPagintation/types/defaultPagination.types.ts`

### src/components/error
- `src/components/error/index.ts`

### src/components/header/components/homeSearchBar
- `src/components/header/components/homeSearchBar/homeSearchBar.tsx`
- `src/components/header/components/homeSearchBar/index.ts`

### src/components/header/components/navItem
- `src/components/header/components/navItem/index.ts`
- `src/components/header/components/navItem/navItem.tsx`

### src/components/header/components/navMenu
- `src/components/header/components/navMenu/index.ts`
- `src/components/header/components/navMenu/navMenu.tsx`

### src/components/header/components/navSkeleton
- `src/components/header/components/navSkeleton/index.ts`
- `src/components/header/components/navSkeleton/navSkeleton.tsx`

### src/components/header
- `src/components/header/header.tsx`

### src/components/header/hooks
- `src/components/header/hooks/useHeader.ts`
- `src/components/header/hooks/useSearchAutocomplete.ts`

### src/components/header
- `src/components/header/index.ts`

### src/components/header/services
- `src/components/header/services/searchAutocomplete.service.ts`

### src/components/header/types
- `src/components/header/types/desktopNavMenu.types.ts`
- `src/components/header/types/header.types.ts`
- `src/components/header/types/searchAutocomplete.types.ts`

### src/components
- `src/components/index.ts`

### src/components/inputWithButton
- `src/components/inputWithButton/index.ts`
- `src/components/inputWithButton/inputWithButton.tsx`

### src/components/inputWithButton/types
- `src/components/inputWithButton/types/inputWithButton.types.ts`

### src/components/linkButton
- `src/components/linkButton/index.ts`

### src/components/linkButton/types
- `src/components/linkButton/types/linkButton.types.ts`

### src/components/listGrid
- `src/components/listGrid/index.ts`

### src/components/listGrid/types
- `src/components/listGrid/types/listGrid.types.ts`

### src/components/multSelect
- `src/components/multSelect/multiSelect.tsx`

### src/components/multSelect/types
- `src/components/multSelect/types/multiSelect.types.ts`

### src/components/searchBar
- `src/components/searchBar/index.ts`

### src/components/searchBar/types
- `src/components/searchBar/types/searchBar.types.ts`

### src/components/selectField
- `src/components/selectField/index.ts`
- `src/components/selectField/selectField.tsx`

### src/components/selectField/types
- `src/components/selectField/types/selectField.types.ts`

### src/components/statusFilterChips
- `src/components/statusFilterChips/index.ts`
- `src/components/statusFilterChips/statusFilterChips.types.ts`

### src/components/yearFilterChips
- `src/components/yearFilterChips/index.ts`
- `src/components/yearFilterChips/yearFilterChips.types.ts`

### src/constants
- `src/constants/bookCover.ts`
- `src/constants/bookStatuses.ts`
- `src/constants/genders.ts`
- `src/constants/statusDictionary.ts`

### src/hooks
- `src/hooks/useDebounce.ts`
- `src/hooks/useFiltersUrl.ts`
- `src/hooks/useModal.ts`
- `src/hooks/useSafeTap.ts`

### src/lib/api
- `src/lib/api/clientJsonFetch.ts`
- `src/lib/api/isUnauthorizedError.ts`

### src/lib/supabase
- `src/lib/supabase/client.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/supabase/server.ts`

### src/lib
- `src/lib/utils.ts`

### src
- `src/middleware.ts`

### src/modules/ResetPasswordClient/hooks
- `src/modules/ResetPasswordClient/hooks/useResetPassword.ts`

### src/modules/ResetPasswordClient
- `src/modules/ResetPasswordClient/index.tsx`

### src/modules/auth/actions
- `src/modules/auth/actions/login.ts`

### src/modules/auth/hooks
- `src/modules/auth/hooks/useLogin.ts`

### src/modules/auth
- `src/modules/auth/index.tsx`

### src/modules/auth/services
- `src/modules/auth/services/auth.service.ts`

### src/modules/authors/components
- `src/modules/authors/components/authorUpsert.tsx`
- `src/modules/authors/components/columns.tsx`
- `src/modules/authors/components/dataTable.tsx`

### src/modules/authors
- `src/modules/authors/index.tsx`

### src/modules/authors/services
- `src/modules/authors/services/authors.service.ts`

### src/modules/authors/services/mappers
- `src/modules/authors/services/mappers/authors.mapper.ts`

### src/modules/authors/types
- `src/modules/authors/types/index.tsx`

### src/modules/bookUpsert
- `src/modules/bookUpsert/bookUpsert.types.ts`

### src/modules/bookUpsert/components
- `src/modules/bookUpsert/components/autocomplete.tsx`
- `src/modules/bookUpsert/components/index.tsx`

### src/modules/bookUpsert/hooks
- `src/modules/bookUpsert/hooks/useBookUpsert.ts`

### src/modules/bookUpsert
- `src/modules/bookUpsert/index.ts`

### src/modules/bookUpsert/services/mappers
- `src/modules/bookUpsert/services/mappers/bookUpsert.mapper.ts`

### src/modules/bookUpsert/types
- `src/modules/bookUpsert/types/authorOptions.ts`
- `src/modules/bookUpsert/types/bookDiscovery.types.ts`
- `src/modules/bookUpsert/types/bookParticipationBlockedDialog.types.ts`
- `src/modules/bookUpsert/types/foundCatalogBookDialog.types.ts`

### src/modules/bookshelves/_hooks
- `src/modules/bookshelves/_hooks/useBookshelfBooks.ts`

### src/modules/bookshelves/services
- `src/modules/bookshelves/services/bookshelvesBooks.service.ts`

### src/modules/bookshelves/services/mappers
- `src/modules/bookshelves/services/mappers/bookshelves.mapper.ts`

### src/modules/bookshelves/types
- `src/modules/bookshelves/types/bookshelves.types.ts`

### src/modules/forgot-password/hooks
- `src/modules/forgot-password/hooks/useRecoverPassword.ts`

### src/modules/forgot-password
- `src/modules/forgot-password/index.tsx`

### src/modules/home/components/filtersSheet
- `src/modules/home/components/filtersSheet/filters.tsx`

### src/modules/home/components/filtersSheet/hooks
- `src/modules/home/components/filtersSheet/hooks/useFiltersSheet.ts`

### src/modules/home/components/shortSheet/hooks
- `src/modules/home/components/shortSheet/hooks/useLocalSort.tsx`
- `src/modules/home/components/shortSheet/hooks/useShortSheetSheet.ts`

### src/modules/home/components/shortSheet
- `src/modules/home/components/shortSheet/index.ts`
- `src/modules/home/components/shortSheet/shortSheet.tsx`

### src/modules/home/hooks
- `src/modules/home/hooks/useBookSearchRefinement.types.ts`

### src/modules/home/utils
- `src/modules/home/utils/index.ts`

### src/modules/home/utils/sortWithPriority
- `src/modules/home/utils/sortWithPriority/index.ts`

### src/modules/home/validators
- `src/modules/home/validators/createBook.validator.ts`

### src/modules/profile/clientProfile/hooks
- `src/modules/profile/clientProfile/hooks/index.ts`

### src/modules/profile/clientProfile
- `src/modules/profile/clientProfile/index.ts`

### src/modules/profile/clientProfile/types
- `src/modules/profile/clientProfile/types/clientProfile.types.ts`

### src/modules/profile/communityMemberFollowRow
- `src/modules/profile/communityMemberFollowRow/index.ts`

### src/modules/profile/communityMemberFollowRow/types
- `src/modules/profile/communityMemberFollowRow/types/communityMemberFollowRow.types.ts`

### src/modules/profile/components
- `src/modules/profile/components/ProfileInitialsAvatar.tsx`
- `src/modules/profile/components/index.ts`

### src/modules/profile/hooks
- `src/modules/profile/hooks/index.ts`
- `src/modules/profile/hooks/useClientMounted.ts`
- `src/modules/profile/hooks/useOptimisticFollowToggle.ts`

### src/modules/profile
- `src/modules/profile/index.ts`

### src/modules/profile/types
- `src/modules/profile/types/followToggle.types.ts`
- `src/modules/profile/types/profile.types.ts`

### src/modules/profile/utils
- `src/modules/profile/utils/index.ts`
- `src/modules/profile/utils/initials.ts`

### src/modules/quotes/components
- `src/modules/quotes/components/UpsertQuoteModal.tsx`

### src/modules/quotes/components/hooks
- `src/modules/quotes/components/hooks/useUpsertQuoteModal.ts`

### src/modules/quotes/hooks
- `src/modules/quotes/hooks/useQuotes.ts`

### src/modules/quotes
- `src/modules/quotes/index.tsx`

### src/modules/quotes/services
- `src/modules/quotes/services/quotes.service.ts`

### src/modules/quotes/types
- `src/modules/quotes/types/quotes.types.ts`

### src/modules/quotes/validators
- `src/modules/quotes/validators/quotes.validator.ts`

### src/modules/register/hooks
- `src/modules/register/hooks/useRegister.ts`

### src/modules/register
- `src/modules/register/index.tsx`

### src/modules/schedule/components/createScheduleForm
- `src/modules/schedule/components/createScheduleForm/createScheduleForm.tsx`

### src/modules/schedule/components/createScheduleForm/hooks
- `src/modules/schedule/components/createScheduleForm/hooks/useCreateScheduleForm.ts`

### src/modules/schedule/components/createScheduleForm
- `src/modules/schedule/components/createScheduleForm/index.ts`

### src/modules/schedule/components/createScheduleForm/types
- `src/modules/schedule/components/createScheduleForm/types/createScheduleForm.types.ts`

### src/modules/schedule/components/createScheduleForm/validators
- `src/modules/schedule/components/createScheduleForm/validators/schedule.validator.ts`

### src/modules/schedule/components/scheduleTable
- `src/modules/schedule/components/scheduleTable/ScheduleReadToggleCell.tsx`
- `src/modules/schedule/components/scheduleTable/index.ts`
- `src/modules/schedule/components/scheduleTable/scheduleTable.tsx`

### src/modules/schedule/components/scheduleTable/types
- `src/modules/schedule/components/scheduleTable/types/scheduleReadToggleCell.types.ts`
- `src/modules/schedule/components/scheduleTable/types/scheduleTable.types.ts`

### src/modules/schedule/hooks
- `src/modules/schedule/hooks/index.ts`
- `src/modules/schedule/hooks/useSchedule.ts`

### src/modules/schedule
- `src/modules/schedule/index.tsx`

### src/modules/schedule/services/mappers
- `src/modules/schedule/services/mappers/schedule.mapper.ts`

### src/modules/schedule/services
- `src/modules/schedule/services/schedule.service.ts`

### src/modules/schedule/types
- `src/modules/schedule/types/schedule.types.ts`
- `src/modules/schedule/types/scheduleDelete.types.ts`
- `src/modules/schedule/types/scheduleReadToggle.types.ts`

### src/modules/shelves/components/addBookToBookshelfDialog
- `src/modules/shelves/components/addBookToBookshelfDialog/addBookToBookshelfDialog.tsx`
- `src/modules/shelves/components/addBookToBookshelfDialog/index.ts`

### src/modules/shelves/components/bookCombobox
- `src/modules/shelves/components/bookCombobox/bookCombobox.tsx`
- `src/modules/shelves/components/bookCombobox/index.ts`

### src/modules/shelves/components/createEditBookshelves
- `src/modules/shelves/components/createEditBookshelves/createEditBookshelves.tsx`
- `src/modules/shelves/components/createEditBookshelves/index.ts`

### src/modules/shelves/components/dropdownShelf
- `src/modules/shelves/components/dropdownShelf/dropdownShelf.tsx`
- `src/modules/shelves/components/dropdownShelf/index.ts`

### src/modules/shelves/components/shelfCard
- `src/modules/shelves/components/shelfCard/index.ts`
- `src/modules/shelves/components/shelfCard/shelfCard.tsx`

### src/modules/shelves
- `src/modules/shelves/index.tsx`

### src/modules/shelves/services
- `src/modules/shelves/services/booksshelves.service.ts`

### src/modules/shelves/services/mapper
- `src/modules/shelves/services/mapper/bookshelves.mapper.ts`

### src/modules/shelves/types
- `src/modules/shelves/types/bookshelves.types.ts`

### src/modules/shelves/validators
- `src/modules/shelves/validators/bookshelves.validator.ts`

### src/modules/stats/_components/readingRanking
- `src/modules/stats/_components/readingRanking/index.ts`
- `src/modules/stats/_components/readingRanking/leaderboardPodium.tsx`

### src/modules/stats/_hooks
- `src/modules/stats/_hooks/useReadingRanking.ts`

### src/modules/stats
- `src/modules/stats/index.tsx`

### src/modules/stats/services/mappers
- `src/modules/stats/services/mappers/stats.mapper.ts`

### src/modules/stats/services
- `src/modules/stats/services/stats.service.ts`

### src/modules/stats/types
- `src/modules/stats/types/stats.types.ts`

### src/providers
- `src/providers/AppProviders.tsx`
- `src/providers/ReactQuery.provider.tsx`
- `src/providers/UserProvider.tsx`

### src/services/books
- `src/services/books/books.mapper.ts`

### src/services/errors
- `src/services/errors/error.ts`

### src/services/query
- `src/services/query/queryConfigs.ts`

### src/services/userRegistration/mappers
- `src/services/userRegistration/mappers/userRegistration.mapper.ts`

### src/services/userRegistration/service
- `src/services/userRegistration/service/registerUser.service.ts`

### src/services/userRegistration/validators
- `src/services/userRegistration/validators/userRegistration.validator.ts`

### src/services/userSocial/mappers
- `src/services/userSocial/mappers/userSocial.mapper.ts`

### src/services/userSocial/types
- `src/services/userSocial/types/userSocial.types.ts`

### src/services/users/mappers
- `src/services/users/mappers/users.mapper.ts`

### src/services/users/service
- `src/services/users/service/getCurrentUser.service.ts`

### src/services/users/types
- `src/services/users/types/users.types.ts`

### src/stores/hooks
- `src/stores/hooks/useAuth.ts`

### src/stores
- `src/stores/userStore.ts`

### src/test-utils
- `src/test-utils/QueryWrapper.tsx`

### src/types
- `src/types/books.types.ts`
- `src/types/filters.ts`
- `src/types/user.types.ts`

### src/utils/buildQueryStringFromFilters
- `src/utils/buildQueryStringFromFilters/index.ts`

### src/utils/date
- `src/utils/date/index.ts`

### src/utils
- `src/utils/date.utils.ts`

### src/utils/error-mapper
- `src/utils/error-mapper/error-mapper-supabase.ts`

### src/utils/formatters
- `src/utils/formatters/index.ts`

### src/utils
- `src/utils/index.ts`

### src/utils/levenshteinDistance
- `src/utils/levenshteinDistance/index.ts`

### src/utils/normalizeForBookTitleSearch
- `src/utils/normalizeForBookTitleSearch/index.ts`
- `src/utils/normalizeForBookTitleSearch/portugueseStopWords.ts`

### src/utils/parseFiltersFromSearchParams
- `src/utils/parseFiltersFromSearchParams/index.ts`

### src/utils
- `src/utils/passwordRules.ts`

### src/utils/stripLatinDiacritics
- `src/utils/stripLatinDiacritics/index.ts`

### (raiz)
- `vitest.config.ts`
- `vitest.setup.ts`
