# Board and My SAMPA

A signed-out visitor sees `Board` in the header, and that link opens the board page. A signed-in visitor sees `My SAMPA` instead of that top-bar `Board` link. Who sees Meetings, Dashboard, Directory, and Editor depends on the account.

## Sub-features

- `signed-out-board` shows `Board` and goes to `/board`.
- `signed-in-menu` shows `My SAMPA` for an account with a profile.
- `tabs` show `Meetings & records` and `Dashboard` only for accounts the suite lists.

## How to get to it (user POV)

- Use `Board` in the header while signed out.
- Sign in and open `My SAMPA` in the header.

## Driving it with the SAMPA checks

Preconditions:

- For the node suite, dependencies are installed. The dev server is not required.
- For the browser check, Doctor passed and the visitor is signed out.

- **Node suite.** Run `npm run test:board-nav`. Exit code is 0 and the TAP summary contains `# fail 0`.
- **Both suites.** Run `npm run test:my-sampa` when you want the same pair the GitHub workflow runs.
- **Signed-out header.** Open `http://127.0.0.1:4173/`. A link named `Board` has `href="/board"`. The header does not show `My SAMPA`.
- **Proof.** Save the TAP summary and a screenshot of the home header with `Board` visible.

## Gotchas

- The signed-in `My SAMPA` menu is proved by the node suite. Do not sign in through the browser to open it.
- While the header is still loading, `Board` can be absent. Wait until `Member Login` is visible, then look for `Board`.
- `npm run test:board-nav` prints a long TAP log. Scroll to `# fail` before calling it red.
