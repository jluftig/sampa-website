# Member Login

Member Login sends a signed-out visitor to the sign-in page. The same control sends an editor to the editor and a member to the dashboard. A held sign-in that has no profile still looks signed out.

## Sub-features

- `signed-out` shows `Member Login` and goes to `/login`.
- `editor` shows `Editor` and goes to `/editor`.
- `member` shows `Dashboard` and goes to `/dashboard`.
- `no-profile` keeps `Member Login` and `/login` when a session has no profile row.

## How to get to it (user POV)

- Use `Member Login` in the header.
- Use `Member Login` in the footer.
- Sign in, then use the same control again. The label becomes `Editor` or `Dashboard`.

## Driving it with the SAMPA checks

Preconditions:

- For the node suite, dependencies are installed. The dev server is not required.
- For the browser check, Doctor passed and the visitor is signed out.

- **Node suite.** Run `npm run test:member-login`. Exit code is 0 and the TAP summary contains `# fail 0`.
- **Header and footer.** Open `http://127.0.0.1:4173/`. Two links named `Member Login` are on the page. Both have `href="/login"`.
- **Sign-in page.** Choose `Member Login`. The address is `http://127.0.0.1:4173/login` and the heading is `Sign in`.
- **Proof.** Save the TAP summary and a screenshot that shows `Member Login` with the home heading.

## Gotchas

- A `MODULE_TYPELESS_PACKAGE_JSON` warning is not a failed test. Use the exit code and `# fail 0`.
- Signed-in labels are covered by the node suite. Do not sign in through Google or email to re-check them.
- Do not treat a loading header as a failure by itself. Wait until `Member Login` or `Board` is visible, then read the href.
