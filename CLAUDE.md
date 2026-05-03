# CLAUDE.md

This file gives Claude Code instructions for working safely and accurately in this repository.

## Core Rule

Do not assume that README files, docs, comments, old plans, or previous sprint notes are fully up to date.

Before making any code change, verify the real implementation from the current source code.

When there is a conflict between:
1. current source code,
2. README/docs,
3. sprint notes,
4. previous explanations,

the current source code is the source of truth unless the user says otherwise.

## Working Style

- Do not edit any file unless the user explicitly gives permission.
- Before editing, explain:
  - which files will be changed,
  - why they need to be changed,
  - what the expected result is.
- Keep changes small, focused, and easy to review.
- Do not perform large refactors unless the user explicitly asks.
- Do not delete files unless the user explicitly asks.
- Do not rename files, folders, functions, components, routes, or database fields unless the user explicitly asks.
- Do not commit, push, pull, merge, rebase, or reset Git history unless the user explicitly asks.
- Do not install new packages unless the user explicitly approves.
- Do not modify `.env`, secrets, tokens, API keys, passwords, or private credentials.
- Do not print secret values from `.env` files.
- If environment variables are needed, refer to `.env.example` or explain what variable is needed without exposing actual values.

## Before Answering About the Project

When the user asks about the project, first inspect the relevant files instead of relying only on memory or documentation.

For project-level questions, check the actual folder structure and key config files, such as:

- `package.json`
- workspace/package files
- backend entry files
- frontend entry files
- database schema files
- route files
- service/controller files
- context/provider files
- test files

Do not say a feature exists unless you verify it in the code.

If something appears in README/docs but not in code, clearly say that it appears documented but was not verified in the implementation.

If something appears in code but not in README/docs, clearly say that the implementation exists but the documentation may be outdated.

## Code Change Workflow

For every task, follow this process:

1. Understand the request.
2. Inspect the relevant files.
3. Summarize the current implementation.
4. Identify the exact change needed.
5. Ask for approval before editing, unless the user already clearly asked you to make the edit.
6. Edit only the necessary files.
7. Summarize exactly what changed.
8. Explain how to test it.
9. Mention any risks, assumptions, or incomplete parts.

## Testing Rules

After making code changes, suggest the most relevant test or verification command.

Do not claim that tests pass unless you actually ran them.

If tests are not run, say clearly:

"Tests were not run."

If a test fails, do not hide it. Explain:
- which command failed,
- what the error says,
- the likely reason,
- what should be checked next.

## Project Understanding Rules

Do not invent architecture details.

If unsure, say so and inspect the code.

Do not assume:
- frontend framework version,
- backend framework version,
- database type,
- ORM,
- authentication flow,
- payment flow,
- cart logic,
- order logic,
- admin logic,
- email logic,
- deployment setup,
- Docker setup,
- CI/CD setup,
- test framework,

unless verified from the actual files.

## Frontend Rules

When working on frontend code:

- Preserve the existing UI style.
- Do not redesign pages unless asked.
- Do not make the interface look overly generic or AI-generated.
- Keep component structure consistent with the existing project.
- Reuse existing components, hooks, contexts, utilities, and API clients when possible.
- Do not create duplicate state management logic if an existing context/hook already handles it.
- Check existing routing before adding or modifying pages.
- Check existing API call patterns before adding new requests.
- Avoid unnecessary new dependencies.

Before changing frontend behavior, inspect relevant files such as:
- pages
- components
- contexts
- hooks
- API/client utilities
- route definitions
- type definitions

## Backend Rules

When working on backend code:

- Follow the existing folder structure.
- Keep controller, service, route, middleware, and validation responsibilities consistent with the existing code.
- Do not bypass existing authentication or authorization patterns.
- Do not change database schema or migrations unless explicitly asked.
- Do not add business logic directly into routes if the project uses services/controllers.
- Validate inputs consistently with the existing style.
- Preserve existing error handling patterns.
- Avoid breaking existing API response formats unless the user explicitly asks.

Before changing backend behavior, inspect relevant files such as:
- server/app entry files
- route files
- controller files
- service files
- middleware files
- validation files
- database/Prisma/schema files
- tests

## Database Rules

- Do not modify schema files unless explicitly asked.
- Do not create, edit, or run migrations unless explicitly asked.
- Do not reset, seed, drop, or overwrite the database unless explicitly asked.
- Be careful with any command that can delete data.
- Before suggesting database commands, explain what they do.

If the project uses Prisma, do not run destructive commands such as reset without explicit permission.

## Documentation Rules

When editing README or docs:

- Keep the content aligned with the actual current code.
- Do not document features that are not implemented.
- If a feature is planned but not implemented, label it clearly as planned.
- Prefer clear setup steps, run commands, test commands, and troubleshooting notes.
- Avoid exaggerated marketing language.
- Use a student/team-project tone when appropriate.

## Git Rules

Do not perform Git actions unless explicitly asked.

Allowed only with permission:
- `git add`
- `git commit`
- `git push`
- `git pull`
- `git merge`
- `git rebase`
- `git reset`
- branch creation
- branch deletion

It is okay to inspect Git status/log if needed, but do not change Git state without permission.

Safe inspection commands:
- `git status`
- `git diff`
- `git log --oneline --max-count=10`

## Security Rules

Never reveal:
- `.env` values
- tokens
- API keys
- passwords
- database credentials
- private URLs
- private account credentials

If a secret appears in code, warn the user and suggest moving it to environment variables.

Do not upload or expose private project files outside the local repository.

## Accuracy Rules

Use precise language.

Do not say:
- "this definitely works"
- "all tests pass"
- "the feature is complete"
- "the implementation is correct"

unless verified.

Prefer:
- "Based on the inspected files..."
- "This appears to..."
- "I verified this in..."
- "I could not verify..."
- "This needs to be tested with..."

## When Creating New Features

Before implementing a new feature:

1. Find the closest existing similar feature.
2. Follow its structure and style.
3. Reuse existing utilities and patterns.
4. Add only the minimum required files.
5. Keep naming consistent.
6. Update docs only if needed.
7. Suggest tests or manual verification steps.

## When Fixing Bugs

Before fixing a bug:

1. Reproduce or understand the bug from code.
2. Identify the likely source.
3. Explain the cause in simple terms.
4. Make the smallest safe fix.
5. Explain how to verify the fix.

## Communication Style

Explain clearly and directly.

When explaining to the user:
- Use simple language.
- Be specific.
- Avoid unnecessary jargon.
- Mention exact file paths.
- Mention exact commands when useful.
- Clearly separate assumptions from verified facts.

The user prefers careful, step-by-step explanations and wants to avoid careless or overly broad code changes.

## Important Reminder

This repository may be part of a university team project.

Preserve the existing coding style and project structure.

Do not make the code look unnecessarily advanced, over-engineered, or inconsistent with the rest of the project.

When in doubt, inspect more files and ask before editing.
