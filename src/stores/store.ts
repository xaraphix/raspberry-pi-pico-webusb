import { writable } from 'svelte/store';

export const isDeviceConnected = writable(false);
export const isDeviceConnecting = writable(false);
export const audioContext = writable<AudioContext | null>(null);
export const accumulatedBuffer = writable<AudioBuffer | null>(null);
export const speedInKBps = writable<number>(0);
export const chunkSizeInBytes = writable<number>(1024 * 12);
export const queryTimeInMs = writable<number>(10);
export const maxSpeed = writable<Maxspeed | null>(null);
export const chunkSizes = [
	0.5 * 1024,
	0.6 * 1024,
	0.7 * 1024,
	0.8 * 1024,
	0.9 * 1024,
	1 * 1024,
	2 * 1024,
	4 * 1024,
	8 * 1024,
	16 * 1024
];
export const queryTimes = [20, 30, 40, 50, 60];
let _performanceData: Record<number, Record<number, PerformanceCell>> = {};

chunkSizes.forEach((chunkSize) =>
	queryTimes.forEach((queryTime) => {
		if (!_performanceData[chunkSize]) {
			_performanceData[chunkSize] = {};
		}

		_performanceData[chunkSize][queryTime] = <PerformanceCell>{
			started: false,
			completed: false,
			maxSpeed: 0,
			currentSpeed: 0
		};
	})
);

export const performanceData = writable<typeof _performanceData>(_performanceData);
