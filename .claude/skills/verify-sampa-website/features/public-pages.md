# Public pages

A signed-out visitor can open the home page, the sign-in page, the about page, and the news page from the header.

## Sub-features

- `home` shows the home heading and the signed-out header.
- `login` shows the sign-in heading.
- `about` shows the society name as the heading.
- `news` shows the news heading and the latest bundled weekday roundup.

## How to get to it (user POV)

- Open the site root.
- Choose `News` in the header.
- Choose `About` in the header.
- Choose `Member Login` in the header.

## Driving it with the SAMPA checks

Preconditions:

- Doctor passed at `http://127.0.0.1:4173/`.
- The visitor is signed out.
- No form on these pages gets submitted.

- **Home.** Open `http://127.0.0.1:4173/`. The heading reads `Care that reaches people`. The header has `News`, `About`, `Board`, and `Member Login`.
- **Sign in.** Open `http://127.0.0.1:4173/login`. The heading reads `Sign in`. `Member Login` still points at `/login`.
- **About.** Open `http://127.0.0.1:4173/about`. The heading reads `Society of Addiction Medicine Physician Associates`.
- **News.** Open `http://127.0.0.1:4173/news`. The heading reads `Addiction Medicine News`. A dated roundup is on the page.
- **Proof.** Save a screenshot of each URL under `artifacts/verify-sampa-website/`. The home shot shows `Member Login` and `Board` together with the heading.

## Gotchas

- Without `.env.local`, the browser shows `Missing Supabase environment variables` and the headings do not render. Copy `.env.example` to `.env.local`, restart Vite, and run Doctor again.
- Vite reads env only at startup. A file created after the server is up does nothing until the server restarts.
- The weekday roundup text is bundled with the site. A placeholder Supabase host can still show that roundup. That does not prove a live database read.
- Do not choose `Continue with Google`, `Send link`, `Subscribe`, or `Submit`.
