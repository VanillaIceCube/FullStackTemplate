# FullStackTemplate frontend style guide

## Foundations

- Use Material UI components and responsive `sx` values before adding custom layout primitives.
- Keep colors in the CSS custom properties declared in `src/App.css`.
- Use the FullStackTemplate secondary color for focused Material UI text fields.
- Keep authenticated and public routes visually consistent with the shared application shell.

## Authentication

- Build public authentication pages with `AuthPageShell`.
- Give every form a visible heading, native submit behavior, and browser autocomplete metadata.
- Show API outcomes through the shared application snackbar.
- Avoid exposing whether an email address belongs to an account in forgot-password responses.

## Component showcase and application routes

- Keep the protected home page useful as a living showcase of reusable buttons,
  forms, feedback, data-display, loading, empty, and confirmation patterns.
- Keep product-independent sharing examples named Workspace → Collection → Item.
- Add future product routes behind `AuthenticatedRoute` unless they are intentionally public.
