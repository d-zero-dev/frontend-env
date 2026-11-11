/**
 * Compares two page lists written by `kamado pages` and searches the sources for links to
 * the URLs that are gone.
 *
 * A move of a page changes its URL, and nothing rewrites the links of the other pages. The
 * list of removed URLs alone does not say where those links are, so this looks for them:
 * the full URL, the file name (a relative link), and for a directory index the
 * `index.html` form. A URL is matched only between delimiters, so that `/news/` does not
 * match `/news/2026.html`.
 *
 * The root URL (`/`) is not searched: every absolute link starts with it.
 *
 * Exit code: 0 when no reference is left, 1 when one is, 2 on a wrong argument or a file
 * that cannot be read.
 * @example
 * node diff-pages.mjs .tmp/pages-before.json .tmp/pages-after.json
 * node diff-pages.mjs before.json after.json --root src
 * @module
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const USAGE = `Usage: node diff-pages.mjs <before.json> <after.json> [--root <dir>]

<before.json> and <after.json> are written by \`yarn pages --out <file>\`.
--root is the directory to search for links (default: __assets).`;

/** Files that can hold a link to a page. */
const SEARCHED_EXTENSIONS = new Set([
	'.tsx',
	'.jsx',
	'.ts',
	'.js',
	'.mjs',
	'.html',
	'.json',
	'.css',
]);

/** A reference ends before one of these, and starts after one of them or a `/`. */
const DELIMITERS = String.raw`"'\`\s()<>=,`;

/**
 * An error of the arguments or the files, shown without a stack trace.
 */
class UsageError extends Error {}

/**
 * Reads the URLs of a page list.
 * @param {string} file - Path as typed
 * @returns {Set<string>} The URLs
 * @throws {UsageError} when the file cannot be read or is not a page list
 */
function readUrls(file) {
	let text;
	try {
		text = readFileSync(file, 'utf8');
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new UsageError(
			`cannot read ${file}: ${reason}\nWrite it with \`yarn pages --out ${file}\`.`,
		);
	}
	let data;
	try {
		data = JSON.parse(text);
	} catch {
		throw new UsageError(`${file} is not JSON. Write it with \`yarn pages --out ${file}\`.`);
	}
	if (!Array.isArray(data?.pages)) {
		throw new UsageError(
			`${file} is not the output of \`kamado pages\` (no "pages" array). Write it with \`yarn pages --out ${file}\`.`,
		);
	}
	return new Set(
		data.pages.map((page) => page?.url).filter((url) => typeof url === 'string'),
	);
}

/**
 * Lists the files under a directory that can hold a link.
 * @param {string} dir - Directory to walk
 * @returns {string[]} Paths, sorted
 * @throws {UsageError} when the directory cannot be read
 */
function listFiles(dir) {
	let entries;
	try {
		entries = readdirSync(dir, { withFileTypes: true, recursive: true });
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new UsageError(`cannot search ${dir}: ${reason}\nGive the source directory with --root.`);
	}
	return entries
		.filter(
			(entry) => entry.isFile() && SEARCHED_EXTENSIONS.has(path.extname(entry.name)),
		)
		.map((entry) => path.join(entry.parentPath, entry.name))
		.filter((file) => !file.split(path.sep).includes('node_modules'))
		.toSorted();
}

/**
 * Escapes a string for use in a regular expression.
 * @param {string} text
 * @returns {string}
 */
function escapeRegExp(text) {
	return text.replaceAll(/[$()*+.?[\\\]^{|}]/g, String.raw`\$&`);
}

/**
 * Builds the pattern that finds a link to a URL.
 * @param {string} url - A URL of a page, not `/`
 * @returns {RegExp} The pattern
 */
function referencePattern(url) {
	const before = `(?<=[${DELIMITERS}])`;
	const after = `(?=[${DELIMITERS}#?]|$)`;
	const forms = [escapeRegExp(url)];
	if (url.endsWith('/')) {
		// A directory index is also linked as `/dir/index.html`.
		forms.push(`${escapeRegExp(url)}index\\.[a-z]+`);
	} else {
		// A page is also linked by its file name alone, from the same directory.
		const name = url.slice(url.lastIndexOf('/') + 1);
		forms.push(`(?:\\./)?${escapeRegExp(name)}`);
	}
	return new RegExp(`${before}(?:${forms.join('|')})${after}`);
}

/**
 * Parses the arguments.
 * @param {readonly string[]} argv - Arguments after the script
 * @returns {{ before: string, after: string, root: string }}
 * @throws {UsageError} on a missing file or an unknown option
 */
function parseArguments(argv) {
	const files = [];
	let root = '__assets';
	for (let index = 0; index < argv.length; index++) {
		const argument = argv[index];
		if (argument === '--root') {
			const value = argv[index + 1];
			if (value === undefined) {
				throw new UsageError(`--root needs a directory\n\n${USAGE}`);
			}
			root = value;
			index++;
		} else if (argument.startsWith('--')) {
			throw new UsageError(`unknown option ${argument}\n\n${USAGE}`);
		} else {
			files.push(argument);
		}
	}
	if (files.length !== 2) {
		throw new UsageError(USAGE);
	}
	return { before: files[0], after: files[1], root };
}

/**
 * Compares the lists, searches the sources and prints the report.
 * @param {readonly string[]} argv - Arguments after the script
 * @returns {number} The exit code
 */
function main(argv) {
	const { before, after, root } = parseArguments(argv);
	const beforeUrls = readUrls(before);
	const afterUrls = readUrls(after);
	const removed = [...beforeUrls].filter((url) => !afterUrls.has(url)).toSorted();
	const added = [...afterUrls].filter((url) => !beforeUrls.has(url)).toSorted();

	const listed = (urls) => (urls.length > 0 ? urls.map((url) => `  ${url}`) : ['  (none)']);

	const searched = removed.filter((url) => url !== '/');
	const patterns = searched.map((url) => ({ url, pattern: referencePattern(url) }));
	const references = [];
	if (patterns.length > 0) {
		for (const file of listFiles(root)) {
			const fileLines = readFileSync(file, 'utf8').split(/\r?\n/);
			for (const [index, line] of fileLines.entries()) {
				for (const { url, pattern } of patterns) {
					if (pattern.test(line)) {
						references.push(
							`  ${file.split(path.sep).join('/')}:${index + 1}: ${url}`,
							`    ${line.trim()}`,
						);
					}
				}
			}
		}
	}
	const count = references.length / 2;
	const lines = [
		`Removed URLs (${removed.length}):`,
		...listed(removed),
		`Added URLs (${added.length}):`,
		...listed(added),
		`References to removed URLs (${count}):`,
		...(count > 0 ? references : ['  (none)']),
		...(removed.includes('/')
			? ['Not searched: / (every link starts with it; check links to the top page by hand)']
			: []),
	];
	process.stdout.write(`${lines.join('\n')}\n`);
	return count > 0 ? 1 : 0;
}

try {
	process.exitCode = main(process.argv.slice(2));
} catch (error) {
	if (!(error instanceof UsageError)) {
		throw error;
	}
	process.stderr.write(`${error.message}\n`);
	process.exitCode = 2;
}
