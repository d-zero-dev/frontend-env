import { extendsConfig } from '@d-zero/markuplint-config';

export default {
	...extendsConfig({
		// classNaming: ['/^splide(?:__[a-z]+)?$/'],
	}),
	nodeRules: [
		{
			selector: '.c-pagination a',
			rules: {
				'required-attr': false,
			},
		},
	],
};
