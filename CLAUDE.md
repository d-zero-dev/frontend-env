# Claude Code Environment Setup

This project uses Volta for Node.js and Yarn version management.

1. ALWAYS run the export command before yarn install, yarn build, yarn lint, etc.
2. Check `yarn -v` matches the version in package.json volta config
3. If wrong version, the export command above MUST be run first

## Documentation Guidelines

When adding rules to CLAUDE.md:

- **DO NOT include specific patch/minor versions** (e.g., avoid "1.22.22", "Node 22.16.0")
- **DO include major version differences** when they are significant (e.g., "Yarn v1 vs v4", "Node v18 vs v20")
- Focus on behavioral patterns and ecosystem understanding rather than exact version numbers

## Monorepo Workflow

**CRITICAL**: This is a monorepo. Always follow these rules:

1. **Always run build and lint from the root directory**

   ```bash
   # Check current directory before running commands
   pwd
   # Change to root if needed (project root directory)
   cd /path/to/project/root
   # Run commands from root
   yarn build
   yarn lint
   ```

2. **Never run build/lint from subdirectories** - this is fundamental to monorepo development

3. **Use `pwd` before executing any build commands** to verify you're in the correct location

4. **Always return to root directory after any cd operations** - stay in root as the default working directory

5. **After completing any implementation, run appropriate checks from root** based on file types:

   **Build + Lint required for:**
   - TypeScript/JavaScript code changes (.ts, .js, .tsx, .jsx)
   - CSS/SCSS changes affecting build output
   - Package.json dependency changes
   - Configuration files affecting compilation (tsconfig.json, etc.)

   **Lint only required for:**
   - Markdown files (.md)
   - Documentation changes
   - Text-only configuration files
   - README files

6. **Testing specific packages**: Only for CSS transpilation testing in scaffold package, you may run builds in subdirectories, but primary build/lint must always be from root

## Pull Request Guidelines

- **Default PR target branch**: `dev` (not `main`)
- Always create PRs against the `dev` branch unless explicitly instructed otherwise

# Commit Rules

## Commit creation

- When asked to "commit":
  1. Check staged files using `git diff --staged` and create a commit message using _only_ the staged files.
     - Once the message is ready, directly propose the commit command to the user.
  2. If no files are staged, check the differences using `git status`, then stage files sequentially based on the following commit granularity before committing:
     - Separate commits by package.
     - Commit dependencies first (if dependency order is unclear, check using `npx lerna list --graph`).
- If the OS, application settings, or context suggest a language other than English is being used, provide a translation and explanation of the commit message in that language immediately before proposing the commit command to the user.

## Commit message format

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
