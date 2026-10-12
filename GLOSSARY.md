# SAMPA Glossary

Words as Josh and the site use them. No implementation details here (see `CLAUDE.md` and `docs/architecture/` for how things work). Format: `.claude/skills/domain-modeling/GLOSSARY-FORMAT.md`.

**SAMPA**: The official AAPA constituent organization focused on addiction. In copy, PAs are "physician associates", never "physician assistants". Write "misuse", not "abuse".

**Member**: A person whose SAMPA membership is currently active (paid, or lifetime). _Avoid_: "user" or "account" when you mean a member.

**Account**: A sign-in on the site. Having an account does not make someone a member.

**Lapsed member**: Someone whose membership is past due or canceled. Has an account, is not currently a member.

**Staff**: Editors and administrators of the site. Staff see member areas without paying.

**Editor**: Staff who write and publish News. Lands on the editor dashboard after sign-in.

**Administrator**: Staff with full control of people, permissions, and records.

**Board member**: A person on the SAMPA board of directors. A board role, separate from membership.

**Committee chair**: A person who chairs (or co-chairs) a SAMPA committee. A role, separate from membership.

**Roster**: The private staff list of all members (`/editor/members`). Board and chair roles alone do not open it.

**Directory**: The member-to-member directory (`/members`), open to members.

**Board hub**: The board meetings, records, and schedule area at `/board`.

**Board dashboard**: Organization numbers (membership, reach, finance) at `/board/dashboard`, for board members, committee chairs, and administrators.

**Keyword**: A topic label on News, as shown to readers and in URLs. Called a "tag" in code and the database.

**Daily Roundup**: The weekday news digest at `/news/daily`.

**Join**: Starting a new paid membership (`/join`).
