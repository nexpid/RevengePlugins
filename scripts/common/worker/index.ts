import { join } from "node:path";
import { Worker, type WorkerOptions } from "node:worker_threads";

export class TsWorker extends Worker {
	constructor(filename: string, options: WorkerOptions = {}) {
		options.workerData ??= {};
		options.workerData.__ts_worker_filename = filename;
		super(join(import.meta.dirname, "worker.mjs"), options);
	}
}
