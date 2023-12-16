<script lang="ts">
	import { onMount } from 'svelte';
	import Serial from '../serial';
	let serial: Serial = new Serial(<USBDevice>{});
	let port: Serial = <Serial>{};

	const connectToAudioInterface = () => {
		serial
			.requestPort()
			.then((selectedPort) => {
				port = selectedPort;
				initDevice();
			})
			.catch((error) => console.error('Could not connect to PICO Audio interface', error));
	};

	let startedPlaying = false;
	let startCounts = 0;
	const initDevice = () => {
		port
			.connect()
			.then(() => {
				port.onReceive = (data) => {
					addToBuffers(data);
					playAudio();
				};
				port.onReceiveError = (error) => {
					console.error('Error on receiving data from PICO Audio interface', error);
				};
				setInterval(() => port.readData(), 10);
			})
			.catch((error) => console.error('Could not connect to PICO Audio interface', error));
	};

	let audioBuffers = Array(10000);
	let currWriteIdx = 0;
	const addToBuffers = (audioData: DataView) => {
		const chunkSize = audioData.byteLength;

		if (!accumulatedBuffer) {
			accumulatedBuffer = audioContext.createBuffer(1, chunkSize, 44100);
		}

		const channelData = accumulatedBuffer.getChannelData(0);

		for (let i = 0; i < chunkSize; ++i) {
			channelData[i] = audioData.getInt8(i) / 1280;
		}

		audioBuffers[currWriteIdx] = accumulatedBuffer;
		currWriteIdx += 1;
		currWriteIdx = currWriteIdx % audioBuffers.length;
	};

	let audioContext = null;

	let accumulatedBuffer = null;
	onMount(() => {
		audioContext = new (window.AudioContext || window.webkitAudioContext)();

		accumulatedBuffer = null;
	});
	let nextStartTime = 0;
	let currBuffIdx = 0;

	function playAudio() {
		const source = audioContext.createBufferSource();
		source.buffer = audioBuffers[currBuffIdx];
		// Connect the AudioBufferSourceNode to the AudioContext's destination (speakers)
		source.connect(audioContext.destination);

		let x = audioContext.currentTime;
		// Calculate the start time for the next buffer based on the current buffer's duration
		nextStartTime += source.buffer.duration;

		// Schedule the next buffer playback
		source.start(nextStartTime);

		// Increment the current buffer index for the next iteration
		currBuffIdx += 1;
		currBuffIdx = currBuffIdx % audioBuffers.length;
	}
</script>

<div>
	<button on:click={() => connectToAudioInterface()}> Connect </button>
</div>
