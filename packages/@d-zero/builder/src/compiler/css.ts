import path from 'node:path';

import cssnano from 'cssnano';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
// eslint-disable-next-line import-x/default
import postcssLoadConfig from 'postcss-load-config';

type CompileCssOptions = {
	banner: string;
	minify: boolean;
	alias: Record<string, string>;
};

/**
 *
 * @param css
 * @param inputPath
 * @param options
 */
export async function compileCss(
	css: string,
	inputPath: string,
	options: CompileCssOptions,
) {
	// Configure plugins with alias resolver for postcss-import
	const plugins: postcss.AcceptedPlugin[] = [];

	// Add postcss-import plugin with alias resolver
	plugins.push(
		postcssImport({
			resolve:
				// Create alias resolver for postcss-import
				(id: string, basedir: string) => {
					// Check if the import starts with an alias
					for (const [alias, aliasPath] of Object.entries(options.alias)) {
						// Arias must be followed by a slash
						if (id.startsWith(alias + '/')) {
							const resolvedPath = id.replace(alias, aliasPath);
							return [path.resolve(basedir, resolvedPath)];
						}
					}
					// For non-alias imports, fallback to default postcss-import resolution
					return [id];
				},
		}),
		cssnano({
			preset: [
				'default',
				{
					// Preserve !important comments (license, copyright, etc.)
					discardComments: {
						removeAll: false,
						removeAllButFirst: false,
					},
					// Custom comment removal that preserves ! comments
					cssDeclarationSorter: false,
				},
			],
		}),
	);

	// Try to load PostCSS config from project root
	let config;
	try {
		config = await postcssLoadConfig();
	} catch {
		// Fallback to default config if no config found
		config = { plugins: [] };
	}

	// Add other plugins from config (excluding postcss-import if it exists)
	if (config.plugins) {
		for (const plugin of config.plugins) {
			// Skip postcss-import plugin to avoid duplicates
			if (
				typeof plugin === 'object' &&
				plugin &&
				'pluginName' in plugin &&
				plugin.pluginName === 'postcss-import'
			) {
				continue;
			}
			plugins.push(plugin);
		}
	}

	// Process CSS with PostCSS
	const result = await postcss(plugins).process(css, {
		from: inputPath,
		to: undefined,
	});

	return result.css;
}
