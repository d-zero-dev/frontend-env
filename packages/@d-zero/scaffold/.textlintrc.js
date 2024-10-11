const config = require('@d-zero/textlint-config');

module.exports = {
	...config,
	rules: {
		...config.rules,
		prh: {
			rulePaths: ['./prh.yaml'],
		},
	},
};
