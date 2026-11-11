/**
 * Compares two page lists written by `kamado pages` and searches the sources for links
 * that a move or a removal of a page has broken.
 *
 * A move of a page changes its URL, and nothing rewrites the links of the other pages.
 * The list of removed URLs alone does not say where those links are, so this resolves
 * every link-like token of the sources to a URL and compares it with the lists:
 *
 * - A token is resolved as a browser resolves a link: an absolute path as it is, a full
 *   URL by its path (the host is taken to be this site), and a relative path against the
 *   URL of the page the file is (from the `inputPath` of the list written after the change).
 * - A file that is not a page (a component, a layout, a data file) has no URL of its own,
 *   so a relative path in it cannot be resolved. It is reported as a possible link when
 *   the removed URL ends with it.
 *
 * Why not match the removed URLs as text: `/news/` is part of `/news/2026.html`, and
 * `detail.html` in another directory is another page. A text match reports those, and
 * misses `../news/`, `./` and a URL with a host.
 *
 * What it does not find:
 *
 * - a link to the top page (`/`) when the top page is removed
 * - a URL assembled at run time from parts
 * - a URL with a character that ends a token in it (a bracket, a comma, `=`, `;`), and a
 *   URL followed by text without a space (`/a.html.` at the end of a sentence)
 * - a relative path that is only `./` or `../` in a file that is not a page
 * - a relative link of a moved page to a file that is not a page (an image, a style sheet)
 * - anything outside the searched directory (the globs of `kamado.config.jsonc`)
 *
 * What it reports and is not a link to the page: the same path on another site
 * (`https://other.example/news/`), and text that reads as a path (the regular expression
 * `/news/`).
 *
 * Exit code: 0 when nothing is reported, 1 when a link or a warning is, 2 on a wrong
 * argument, a file that cannot be read, or an error of this script.
 * @example
 * node diff-pages.mjs .tmp/pages-before.json .tmp/pages-after.json
 * node diff-pages.mjs before.json after.json --root src
 * @module
 */
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';

const USAGE = `Usage: node diff-pages.mjs <before.json> <after.json> [--root <dir>]

<before.json> and <after.json> are written by \`yarn pages --out <file>\`.
--root is the directory to search for links (default: __assets).`;

/** Files that can hold a link to a page (the extensions `data.dir` reads are among them). */
const SEARCHED_EXTENSIONS = new Set([
	'.tsx',
	'.jsx',
	'.ts',
	'.mts',
	'.cts',
	'.js',
	'.mjs',
	'.cjs',
	'.html',
	'.htm',
	'.json',
	'.jsonc',
	'.yml',
	'.yaml',
	'.txt',
	'.md',
	'.css',
]);

/** A run of characters that can be a link: everything but spaces, quotes and brackets. */
const TOKEN = /[^\s"'`()<>=,;{}[\]\\|]+/g;

/** Character references that end a link inside an attribute value. */
const CHARACTER_REFERENCES = /&(?:quot|apos|amp|lt|gt|#\d+|#x[\da-f]+);/gi;

/** A longer line (a minified file) is cut in the report. */
const MAX_LINE_LENGTH = 200;

/**
 * An error of the arguments or the files, shown without a stack trace.
 */
class UsageError extends Error {}

/**
 * Reads a page list.
 * @param {string} file - Path as typed
 * @returns {{ urls: Set<string>, pages: { url: string, inputPath: string | null }[], warnings: string[] }}
 * @throws {UsageError} when the file cannot be read or is not a page list
 */
function readPages(file) {
	const hint = `Write it with \`yarn pages --out ${file}\`.`;
	let text;
	try {
		text = readFileSync(file, 'utf8');
	} catch (error) {
		throw new UsageError(`cannot read ${file}: ${reasonOf(error)}\n${hint}`);
	}
	let data;
	try {
		data = JSON.parse(text);
	} catch (error) {
		throw new UsageError(`${file} is not JSON (${reasonOf(error)}). ${hint}`);
	}
	if (!Array.isArray(data?.pages)) {
		throw new UsageError(
			`${file} is not the output of \`kamado pages\` (no "pages" array). ${hint}`,
		);
	}
	const pages = data.pages.map((page, index) => {
		if (typeof page?.url !== 'string') {
			throw new UsageError(
				`${file} is not the output of \`kamado pages\` (pages[${index}] has no "url"). ${hint}`,
			);
		}
		return {
			url: page.url,
			inputPath: typeof page.inputPath === 'string' ? page.inputPath : null,
		};
	});
	const warnings = Array.isArray(data.warnings) ? data.warnings.map(String) : [];
	return { urls: new Set(pages.map((page) => page.url)), pages, warnings };
}

/**
 * The message of a thrown value.
 * @param {unknown} error
 * @returns {string}
 */
function reasonOf(error) {
	return error instanceof Error ? error.message : String(error);
}

/**
 * Lists the files under a directory that can hold a link. Directories whose name starts
 * with a dot and `node_modules` are not entered, as kamado does not read them either.
 * @param {string} dir - Directory to walk
 * @param {Set<string>} [visited] - The real paths of the directories already walked, so
 * that a symbolic link to a directory above is not walked again
 * @returns {string[]} Paths, sorted
 * @throws {UsageError} when the directory cannot be read
 */
function listFiles(dir, visited = new Set()) {
	const real = realPathOf(dir);
	if (visited.has(real)) {
		return [];
	}
	visited.add(real);
	let entries;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch (error) {
		throw new UsageError(
			`cannot search ${dir}: ${reasonOf(error)}\nGive the source directory with --root.`,
		);
	}
	const files = [];
	for (const entry of entries.toSorted((a, b) => (a.name < b.name ? -1 : 1))) {
		const file = path.join(dir, entry.name);
		// A symbolic link is followed: a linked page is still a page. A link that cannot be
		// followed (broken, or a loop) is not a file to search.
		let stats = entry;
		if (entry.isSymbolicLink()) {
			try {
				stats = statSync(file);
			} catch {
				continue;
			}
		}
		if (stats.isDirectory()) {
			if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
				files.push(...listFiles(file, visited));
			}
		} else if (
			stats.isFile() &&
			SEARCHED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
		) {
			files.push(file);
		}
	}
	return files;
}

/**
 * Normalizes the path of a URL: resolves `.` and `..`, and reads `/dir/index.html` as
 * `/dir/`.
 * @param {string} urlPath - A path that starts with `/`
 * @returns {string}
 */
function normalizeUrlPath(urlPath) {
	const normalized = path.posix.normalize(urlPath);
	return normalized.replace(/\/index\.html?$/, '/');
}

/**
 * Reads a token as a link.
 * @param {string} token - A run of characters of a source line
 * @returns {{ kind: 'absolute' | 'relative', path: string } | null} The path of the link
 * without the query and the fragment, or `null` when the token is not a link to a path
 */
function linkOf(token) {
	let rest = token;
	const scheme = /^[a-z][\d+.a-z-]*:/i.exec(rest);
	if (scheme) {
		rest = rest.slice(scheme[0].length);
		// `mailto:a`, `tel:0`, `data:…`: no path. `url:/a.html` (YAML without a space): a path.
		if (!rest.startsWith('/')) {
			return null;
		}
	}
	if (rest.startsWith('//')) {
		const slash = rest.indexOf('/', 2);
		rest = slash === -1 ? '' : rest.slice(slash);
	}
	rest = rest.replace(/[#?].*$/, '');
	if (rest === '') {
		return null;
	}
	try {
		rest = decodeURI(rest);
	} catch {
		// Not percent-encoded text (`100%`): compared as written.
	}
	return { kind: rest.startsWith('/') ? 'absolute' : 'relative', path: rest };
}

/**
 * Whether a path is a URL of a page: a directory or an `.html` file.
 * @param {string} urlPath
 * @returns {boolean}
 */
function isPageLike(urlPath) {
	return urlPath.endsWith('/') || /\.html?$/.test(urlPath);
}

/**
 * The page a path points to, among a set of URLs. `/dir` is read as `/dir/` when it was
 * written as a path (not a bare word), as a server redirects it.
 * @param {string} urlPath - A normalized path
 * @param {Set<string>} urls
 * @returns {string | null} The URL of the set, or `null`
 */
function pageAt(urlPath, urls) {
	if (urls.has(urlPath)) {
		return urlPath;
	}
	return urls.has(`${urlPath}/`) ? `${urlPath}/` : null;
}

/**
 * Parses the arguments.
 * @param {readonly string[]} argv - Arguments after the script
 * @returns {{ before: string, after: string, root: string } | null} `null` for `--help`
 * @throws {UsageError} on a missing file or an unknown option
 */
function parseArguments(argv) {
	const files = [];
	let root = '__assets';
	for (let index = 0; index < argv.length; index++) {
		const argument = argv[index];
		if (argument === '--help' || argument === '-h') {
			return null;
		}
		if (argument === '--root' || argument.startsWith('--root=')) {
			const value = argument === '--root' ? argv[++index] : argument.slice('--root='.length);
			if (value === undefined || value === '' || value.startsWith('--')) {
				throw new UsageError(`--root needs a directory\n\n${USAGE}`);
			}
			root = value;
		} else if (argument.startsWith('-')) {
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
 * The real path of a file, or the path itself when it cannot be resolved.
 * @param {string} file
 * @returns {string}
 */
function realPathOf(file) {
	try {
		return realpathSync(file);
	} catch {
		return path.resolve(file);
	}
}

/**
 * The last segment of a path, with the `/` that ends a directory.
 * @param {string} urlPath
 * @returns {string}
 * @example
 * lastSegmentOf('/about/history.html'); // 'history.html'
 * lastSegmentOf('/about/news/'); // 'news/'
 */
function lastSegmentOf(urlPath) {
	return /[^/]*\/?$/.exec(urlPath)[0];
}

/**
 * A section of the report.
 * @param {string} title
 * @param {readonly string[]} items - Lines, already indented
 * @param {number} [count] - The number to show, when an item takes more than one line
 * @returns {string[]}
 */
function section(title, items, count = items.length) {
	return [`${title} (${count}):`, ...(items.length > 0 ? items : ['  (none)'])];
}

/**
 * Compares the lists, searches the sources and prints the report.
 * @param {readonly string[]} argv - Arguments after the script
 * @returns {number} The exit code
 */
function main(argv) {
	const options = parseArguments(argv);
	if (options === null) {
		process.stdout.write(`${USAGE}\n`);
		return 0;
	}
	const before = readPages(options.before);
	const after = readPages(options.after);
	// The two lists hold every URL: with `--root .` they would be reported as links.
	const lists = new Set([realPathOf(options.before), realPathOf(options.after)]);
	const files = listFiles(options.root).filter((file) => !lists.has(realPathOf(file)));
	const removed = [...before.urls].filter((url) => !after.urls.has(url)).toSorted();
	const added = [...after.urls].filter((url) => !before.urls.has(url)).toSorted();
	// The top page is not searched: `/` is also a division, a separator of CSS and the top
	// of every other site, and the report would be those.
	const searched = removed.filter((url) => url !== '/');
	const removedUrls = new Set(searched);
	const addedUrls = new Set(added);
	/** The removed URLs by their last segment, to find those that end with a relative path. */
	const removedBySegment = Map.groupBy(searched, (url) => lastSegmentOf(url));

	/** The URL of each page file, to resolve the relative links in it. */
	const urlOfFile = new Map(
		after.pages
			.filter((page) => page.inputPath !== null)
			.map((page) => [realPathOf(page.inputPath), page.url]),
	);

	const links = [];
	const missing = [];
	const possible = [];
	for (const file of files) {
		let text;
		try {
			text = readFileSync(file, 'utf8');
		} catch (error) {
			throw new UsageError(`cannot read ${file}: ${reasonOf(error)}`);
		}
		const shown = file.split(path.sep).join('/');
		const pageUrl = urlOfFile.get(realPathOf(file)) ?? null;
		for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
			const line = rawLine.replaceAll(CHARACTER_REFERENCES, ' ');
			const trimmed = rawLine.trim();
			const excerpt =
				trimmed.length > MAX_LINE_LENGTH ? `${trimmed.slice(0, MAX_LINE_LENGTH)}…` : trimmed;
			const report = (list, token, mark, url) => {
				list.push(`  ${shown}:${index + 1}: ${token} ${mark} ${url}`, `    ${excerpt}`);
			};
			for (const match of line.matchAll(TOKEN)) {
				const token = match[0];
				// `</a>`, `<br/>` and the `/` of `<br />` are tags, not links to `/a`, `br/` and `/`.
				// `<https://example.com/a.html>` (Markdown) and `href=/a.html>` are links.
				const afterOpening = line[match.index - 1] === '<' && !token.includes('://');
				const closing = token === '/' && line[match.index + token.length] === '>';
				if (afterOpening || closing) {
					continue;
				}
				const link = linkOf(token);
				// A relative path names something or is `./` or `../`: `*/` and `--` are punctuation.
				if (
					link === null ||
					(link.kind === 'relative' &&
						!/[\p{L}\p{N}]/u.test(link.path) &&
						!/^(?:\.\.?\/)+$/.test(link.path))
				) {
					continue;
				}
				if (link.kind === 'absolute') {
					const target = pageAt(normalizeUrlPath(link.path), removedUrls);
					if (target !== null) {
						report(links, token, '->', target);
					}
					continue;
				}
				if (pageUrl === null) {
					// No URL to resolve against: compare the end of the removed URLs.
					const tail = normalizeUrlPath(`/${link.path.replace(/^(?:\.\.?\/)+/, '')}`);
					if (tail === '/') {
						continue;
					}
					// `about/news` can be the directory `/about/news/`; a bare word (`news`) is not read so.
					const asDirectory = link.path.includes('/') && !isPageLike(tail) ? `${tail}/` : null;
					for (const end of asDirectory === null ? [tail] : [tail, asDirectory]) {
						for (const url of removedBySegment.get(lastSegmentOf(end)) ?? []) {
							if (url.endsWith(end)) {
								report(possible, token, '~', url);
							}
						}
					}
					continue;
				}
				const base = pageUrl.slice(0, pageUrl.lastIndexOf('/') + 1);
				const resolved = normalizeUrlPath(`${base}${link.path}`);
				const written = /^\.\.?\//.test(link.path) || link.path.includes('/');
				const target = written
					? pageAt(resolved, removedUrls)
					: removedUrls.has(resolved)
						? resolved
						: null;
				if (target !== null) {
					report(links, token, '->', target);
				} else if (
					addedUrls.has(pageUrl) &&
					isPageLike(resolved) &&
					pageAt(resolved, after.urls) === null
				) {
					// A relative link of a moved page still points next to the old place.
					report(missing, token, '->', resolved);
				}
			}
		}
	}

	const lines = [
		...section(
			'Removed URLs',
			removed.map((url) => `  ${url}`),
		),
		...section(
			'Added URLs',
			added.map((url) => `  ${url}`),
		),
		...section('Links to removed URLs', links, links.length / 2),
		...section(
			'Relative links of moved or new pages to pages that do not exist',
			missing,
			missing.length / 2,
		),
		...section(
			'Possible links to removed URLs (relative paths in files that are not pages)',
			possible,
			possible.length / 2,
		),
		...section(
			'Warnings of kamado pages',
			after.warnings.map((warning) => `  ${warning}`),
		),
		...(removed.includes('/')
			? ['Not searched: / (the top page was removed; check the links to it by hand)']
			: []),
	];
	process.stdout.write(`${lines.join('\n')}\n`);
	const reported = links.length + missing.length + possible.length + after.warnings.length;
	return reported > 0 ? 1 : 0;
}

try {
	process.exitCode = main(process.argv.slice(2));
} catch (error) {
	// 1 means "a link is left": an error must not be read as that.
	process.exitCode = 2;
	process.stderr.write(
		error instanceof UsageError
			? `${error.message}\n`
			: `diff-pages.mjs failed: ${error instanceof Error ? error.stack : String(error)}\n`,
	);
}
