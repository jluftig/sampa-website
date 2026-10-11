---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer **plus a one-line why** for every question, no exceptions. Then wait for the user's answers before the next round.

Format a round like so:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ **Recommend:** <your recommended answer>
💡 **Why:** <one line, plain language>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ **Recommend:** <your recommended answer>
💡 **Why:** <one line, plain language>
```

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.

## SAMPA adaptation (Josh Luftig, decision fatigue)

Local change to the upstream skill. Josh is a clinician, not an engineer, and wants to answer a whole round in one line.

- **Every question carries a recommendation and a one-line why.** Never ask an open question with no recommendation. If you genuinely can't pick, say which way you lean and what would change your mind.
- **Plain language.** No jargon (say "only paying members", not "RLS gate on is_active_member()"). One idea per question.
- **Only real decisions.** If the code, docs or `GLOSSARY.md` already answer it, it is a fact: state it, don't ask it. Aim for 5-10 questions per round.
- **Phrase each recommendation so "yes" accepts it.** End the round with a reply line, e.g. `Reply like: 1 yes, 2 yes, 3 no (…), 4 yes`. A bare "yes" accepts your recommendation; "no" plus a few words overrides it; "all yes" accepts the round.
- **"What would you recommend?" / "not sure"** means: give one recommendation, why in 1-2 sentences, and the main tradeoff. Don't add more questions.
