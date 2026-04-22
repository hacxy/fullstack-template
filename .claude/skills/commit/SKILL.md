---
name: commit
description: Generate a git commit message and create a commit. Use when you want to stage changes and commit with an auto-generated Conventional Commits message. Optionally pass a hint, e.g. /commit fix auth bug.
---

Run the following steps to create a git commit:

1. Run `git status` and `git diff` (staged and unstaged) to understand all changes
2. Run `git log --oneline -5` to understand the commit message style used in this repo
3. Stage all relevant changed files with `git add` (prefer specific files over `git add .`, and never stage .env files or secrets)
4. Write a concise commit message following the Conventional Commits format: `type: description`
   - Common types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `ci`
   - Keep the subject line under 72 characters
   - If `$ARGUMENTS` is provided, use it as a hint for the commit message
5. Create the commit, appending the Co-Authored-By trailer

If there is nothing to commit, say so and stop.
