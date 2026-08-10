import type { ArchiveSession } from '../types.js';

import { ArchiveManager } from '@nitpicker/query';

/**
 * Opens a `.nitpicker` archive and returns a session with a read-only accessor.
 * The session owns a fresh {@link ArchiveManager} per call — sharing one across
 * multiple opens is intentionally hidden so callers cannot accidentally leak
 * the manager (each open is matched with a single `close`).
 *
 * The returned `close()` is idempotent: calling it twice is a no-op.
 * @param filePath
 */
export async function openArchive(filePath: string): Promise<ArchiveSession> {
	const manager = new ArchiveManager();
	const { archiveId, accessor } = await manager.open(filePath);

	let closing: Promise<void> | null = null;
	const close = () => {
		closing ??= manager.close(archiveId);
		return closing;
	};

	return { archiveId, accessor, close };
}
