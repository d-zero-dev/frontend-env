import { describe, expect, test } from 'vitest';

import { paginate } from './paginate.js';

interface Row {
	id: number;
}

describe('paginate', () => {
	test('yields every item across multiple pages in order', async () => {
		const all: Row[] = Array.from({ length: 7 }, (_, index) => ({ id: index }));
		const fetcher = (offset: number, limit: number) =>
			Promise.resolve({ items: all.slice(offset, offset + limit), total: all.length });

		const collected: number[] = [];
		for await (const row of paginate(fetcher, (row) => row.id, 3)) {
			collected.push(row);
		}
		expect(collected).toEqual([0, 1, 2, 3, 4, 5, 6]);
	});

	test('terminates immediately when the first page is empty', async () => {
		let calls = 0;
		const fetcher = () => {
			calls += 1;
			return Promise.resolve({ items: [] as Row[], total: 0 });
		};
		const collected: number[] = [];
		for await (const row of paginate(fetcher, (row) => row.id, 5)) {
			collected.push(row);
		}
		expect(collected).toEqual([]);
		expect(calls).toBe(1);
	});

	test('stops when the cumulative offset reaches total even if a page returns extras', async () => {
		// Guards against silently looping forever if a server returns more than total claims.
		const total = 3;
		const fetcher = () =>
			Promise.resolve({
				items: [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }] as Row[],
				total,
			});
		const collected: number[] = [];
		for await (const row of paginate(fetcher, (row) => row.id, 4)) {
			collected.push(row);
		}
		expect(collected).toEqual([0, 1, 2, 3]);
	});
});
