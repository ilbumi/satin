import { annotationStore, dirtyAnnotations } from '$lib/stores/annotation';
import { get } from 'svelte/store';
import type { AnnotationWithLocal } from '$lib/stores/annotation';

export class AutoSaveManager {
	private timer: number | null = null;
	private saveCallback: ((annotations: AnnotationWithLocal[]) => Promise<void>) | null = null;
	private intervalMs: number = 30000; // 30 seconds default
	private enabled: boolean = true;

	constructor(
		saveCallback?: (annotations: AnnotationWithLocal[]) => Promise<void>,
		intervalMs: number = 30000
	) {
		if (saveCallback) {
			this.saveCallback = saveCallback;
		}
		this.intervalMs = intervalMs;
	}

	start() {
		if (!this.enabled || !this.saveCallback) return;

		this.stop();

		this.timer = window.setInterval(async () => {
			await this.save();
		}, this.intervalMs);
	}

	stop() {
		if (this.timer !== null) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}

	async save() {
		if (!this.saveCallback) return;

		const dirty = get(dirtyAnnotations);

		if (dirty.length === 0) {
			console.log('No changes to save');
			return;
		}

		try {
			console.log(`Auto-saving ${dirty.length} annotations...`);
			await this.saveCallback(dirty);

			const savedIds = dirty.map((a) => a.id);
			annotationStore.markAsSaved(savedIds);

			console.log('Auto-save completed');
		} catch (error) {
			console.error('Auto-save failed:', error);
		}
	}

	setSaveCallback(callback: (annotations: AnnotationWithLocal[]) => Promise<void>) {
		this.saveCallback = callback;
		if (this.enabled && this.timer === null) {
			this.start();
		}
	}

	setInterval(ms: number) {
		this.intervalMs = ms;
		if (this.enabled && this.timer !== null) {
			this.start();
		}
	}

	setEnabled(enabled: boolean) {
		this.enabled = enabled;
		if (enabled) {
			this.start();
		} else {
			this.stop();
		}
	}

	async forceSave() {
		await this.save();
	}

	reset() {
		this.stop();
		this.timer = null;
	}
}
