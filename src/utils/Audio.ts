import { throttle } from 'lodash';
import Serial from '../serial';
import {
	accumulatedBuffer,
	audioContext,
	chunkSizeInBytes,
	isDeviceConnected,
	isDeviceConnecting,
	queryTimeInMs
} from '../stores/store';

const serial: Serial = new Serial(<USBDevice>{});
let port: Serial = <Serial>{};
const audioBuffers: AudioBuffer[] = Array(10000);
let currWriteIdx = 0;
let accBufferVal: AudioBuffer | null;
let audioContextVal: AudioContext | null;
let queryTimeInMsVal: number = 0;
let chunkSizeVal: number = 0;
let readDataThrottled = throttle((chunkSize: number, queryTime: number) => {
	if (chunkSize && queryTime) {
		port.readData(chunkSize, queryTime);
	}
	readDataThrottled(chunkSizeVal, queryTimeInMsVal);
}, queryTimeInMsVal || 20);

accumulatedBuffer.subscribe((val) => {
	accBufferVal = val;
});
audioContext.subscribe((val) => {
	audioContextVal = val;
});

chunkSizeInBytes.subscribe((val) => (chunkSizeVal = val));
queryTimeInMs.subscribe((val) => {
	readDataThrottled = throttle((chunkSize: number, queryTime: number) => {
		if (chunkSize && queryTime) {
			port.readData(chunkSize, queryTime);
		}
		readDataThrottled(chunkSizeVal, queryTimeInMsVal);
	}, val || 20);

	queryTimeInMsVal = val;
});

export const connectToAudioInterface = () => {
	isDeviceConnecting.set(true);
	serial
		.requestPort()
		.then((selectedPort) => {
			port = selectedPort;
			initDevice();
		})
		.catch((error) => {
			isDeviceConnecting.set(false);
			console.error('Could not connect to PICO Audio interface', error);
		});
};

export const disconnectAudioInterface = () => {
	serial.disconnect();
};

const initDevice = () => {
	port
		.connect()
		.then(() => {
			isDeviceConnected.set(true);
			port.onReceive = (data) => {
				// if (!data) return;
				// addToBuffers(data);
				// playAudio();
			};
			port.onReceiveError = (error) => {
				console.error('Error on receiving data from PICO Audio interface', error);
			};
			readDataThrottled(chunkSizeVal, queryTimeInMsVal);
		})
		.catch((error) => console.error('Could not connect to PICO Audio interface', error));
};

const addToBuffers = (audioData: DataView) => {
	const chunkSize = audioData.byteLength;

	if (!accBufferVal) {
		accumulatedBuffer.set((audioContextVal as AudioContext).createBuffer(1, chunkSize, 44100));
	}

	const channelData = (accBufferVal as AudioBuffer).getChannelData(0);

	for (let i = 0; i < chunkSize; ++i) {
		channelData[i] = audioData.getInt8(i) / 1280;
	}

	audioBuffers[currWriteIdx] = accBufferVal as AudioBuffer;
	currWriteIdx += 1;
	currWriteIdx = currWriteIdx % audioBuffers.length;
};

let nextStartTime = 0;
let currBuffIdx = 0;

function playAudio() {
	const source = (audioContextVal as AudioContext).createBufferSource();
	source.buffer = audioBuffers[currBuffIdx];
	// Connect the AudioBufferSourceNode to the AudioContext's destination (speakers)
	source.connect((audioContextVal as AudioContext).destination);

	let x = (audioContextVal as AudioContext).currentTime;
	// Calculate the start time for the next buffer based on the current buffer's duration
	nextStartTime += source.buffer.duration;

	// Schedule the next buffer playback
	source.start(nextStartTime);

	// Increment the current buffer index for the next iteration
	currBuffIdx += 1;
	currBuffIdx = currBuffIdx % audioBuffers.length;
}
