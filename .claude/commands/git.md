---
description: Git manipulation rules
---

# Commit creation

- When asked to "commit":
  1. Check staged files using `git diff --staged` and create a commit message using _only_ the staged files.
     - Once the message is ready, directly propose the commit command to the user.
  2. If no files are staged, check the differences using `git status`, then stage files sequentially based on the following commit granularity before committing:
     - Separate commits by package.
     - Commit dependencies first (if dependency order is unclear, check using `npx lerna list --graph`).
- If the OS, application settings, or context suggest a language other than English is being used, provide a translation and explanation of the commit message in that language immediately before proposing the commit command to the user.
- When the commit message is ready, try to execute it directly as `git commit` (the user will approve as appropriate).

# Commit message format

- You must write in English
- You must use the imperative mood
- You must use conventional commits
  - You must use the following types:
    - `feat`
    - `fix`
    - `docs`
    - `refactor`
    - `test`
    - `chore`
  - You must use the following scopes:
    - Each package name (without namespace)
    - `repo`
    - `deps`
    - `github`
- The message body's lines must not be longer than 100 characters
- The subject must not be sentence-case, start-case, pascal-case, upper-case

# Commit message safety guidelines

- Always use single quotes (') instead of double quotes (") for commit messages to avoid shell interpretation issues
- For breaking changes or complex commit messages:
  - Option 1 (Recommended for complex messages): Use the git commit without -m flag to open an editor:

    ```
    git commit
    ```

    Then write your commit message in the editor with the proper format:

    ```
    type(scope)!: subject line

    BREAKING CHANGE: detailed explanation
    - Additional details
    - More information
    ```

  - Option 2: For command line commits with breaking changes, use a simple format:
    ```
    git commit -m 'type(scope)!: subject line' -m 'BREAKING CHANGE: explanation'
    ```

- Avoid using special characters like \n in command line commit messages
- For multi-line messages in command line, use multiple -m parameters instead of line breaks
- When lines exceed 100 characters, split them using multiple -m flags:
  ```
  git commit -m 'type(scope): subject line' -m 'First line of body' -m 'Second line of body'
  ```
