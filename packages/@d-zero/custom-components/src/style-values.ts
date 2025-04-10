export const lengthUnits = ['em', 'px', 'rem', 'cqi', '%'] as const;

export type LengthUnit = (typeof lengthUnits)[number];

export const borderStyles = [
	'solid',
	'dashed',
	'dotted',
	'double',
	'groove',
	'ridge',
	'inset',
	'outset',
] as const;

export type BorderStyle = (typeof borderStyles)[number];
