# BooksUp 4.6 – verification checklist

## Automated checks
- JavaScript parse checks for UI modules, Electron preload/main and config.
- Source wiring for Discover search, age settings, admin route and year/month statistics.
- Android and Windows build pipelines use the same package version.

## Device checks required before declaring a stable release
- Remove a book halfway down a 300-book list: stays in that list with scroll position intact.
- Reopen the auto-updating list: excluded book does not silently reappear.
- Change private age to 13: 18+ toggle cannot be enabled. Adult/unrated public discovery suggestions should be suppressed.
- Change private age to 18 and explicitly opt into mature recommendations.
- Test ISBN search across two editions and languages; selection must be explicit.
- Search Discover and add a book to a list without creating a purchased copy.
- Repeat "Mehr Bücher entdecken" with internet access and inspect new hits, loading feedback and pagination.
- Verify years/months on several dated completion records.
- Test wrong GitHub account cannot access protected publishing endpoints (after Worker deployment).
- Test backup/restore of private age, metadata, list exclusions, PDF imports on both Android and Windows.
- Confirm Android upgrade requires matching signing certificate; do NOT uninstall old app without tested backup.

**Known limitations:** Some legacy UI strings are still not fully translated; admin publishing requires external OAuth Worker configuration; public online catalogs lack reliable age ratings; no backend guarantees completeness of ISBN or book metadata.
