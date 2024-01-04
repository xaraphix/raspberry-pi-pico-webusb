interface Maxspeed {
	speed: number;
	queryTime: number;
	chunkSizeInBytes: number;
}

interface PerformanceCell {
	currentSpeed: number;
	maxSpeed: number;
	started: boolean;
	completed: boolean;
}
