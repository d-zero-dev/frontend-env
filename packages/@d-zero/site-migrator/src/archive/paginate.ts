interface PaginatedResult<TItem> {
	items: readonly TItem[];
	total: number;
}

/**
 * Drives `@nitpicker/query`'s `limit`/`offset`-style query helpers as a flat
 * async iterable. The DB cost is `OFFSET N` per page (O(N²) total at the SQL
 * level), which is acceptable for current archive sizes; switch to a keyset
 * iterator once `@nitpicker/query` exposes one.
 * @param fetchPage
 * @param map
 * @param pageSize
 */
export async function* paginate<TRow, TItem>(
	fetchPage: (offset: number, limit: number) => Promise<PaginatedResult<TRow>>,
	map: (row: TRow) => TItem,
	pageSize: number,
): AsyncIterable<TItem> {
	let offset = 0;
	for (;;) {
		const result = await fetchPage(offset, pageSize);
		for (const row of result.items) {
			yield map(row);
		}
		offset += result.items.length;
		if (result.items.length === 0 || offset >= result.total) {
			return;
		}
	}
}
