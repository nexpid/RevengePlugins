let syncTimeout: any = 0;
export function debounceSync(run: () => void) {
	clearTimeout(syncTimeout);
	syncTimeout = setTimeout(run, 1500);
}
