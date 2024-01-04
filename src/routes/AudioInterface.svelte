<script lang="ts">
	import { onMount } from 'svelte';
	import TransferSpeed from '../components/TransferSpeed.svelte';
	import {
		audioContext,
		accumulatedBuffer,
		chunkSizeInBytes,
		queryTimeInMs,
		maxSpeed,
		chunkSizes,
		queryTimes,
		performanceData
	} from '../stores/store';

	let maxSpeedVal: Maxspeed | null;
	let performanceDataVal: Record<number, Record<number, PerformanceCell>> | null;

	maxSpeed.subscribe((v) => {
		maxSpeedVal = v;
	});

	performanceData.subscribe((v) => {
		performanceDataVal = v;
	});

	onMount(() => {
		$audioContext = new (window.AudioContext || window.webkitAudioContext)();
		$accumulatedBuffer = null;

		let currentIndex = 0;
		let prevChunkSize = 0;
		let prevQueryTime = 0;

		const executeFunction = (chunkSize: number, queryTime: number) => {
			chunkSizeInBytes.set(chunkSize);
			queryTimeInMs.set(queryTime);
		};

		const runWithDelay = () => {
			if (currentIndex >= chunkSizes.length * queryTimes.length) {
				return;
			}

			const currentChunkSize = chunkSizes[Math.floor(currentIndex / queryTimes.length)];
			const currentQueryTime = queryTimes[currentIndex % queryTimes.length];

			if (prevQueryTime !== 0 && prevChunkSize !== 0) {
				(performanceDataVal as Record<number, Record<number, PerformanceCell>>)[prevChunkSize][
					prevQueryTime
				].completed = true;
			}
			prevChunkSize = currentChunkSize;
			prevQueryTime = currentQueryTime;
			executeFunction(currentChunkSize, currentQueryTime);

			currentIndex++;

			setTimeout(() => {
				chunkSizeInBytes.set(0);
				queryTimeInMs.set(0);
			}, 6000);
			setTimeout(runWithDelay, 8000);
		};

		setTimeout(runWithDelay, 1000);
	});
</script>

<div
	class="h-full w-full flex flex-col relative items-center justify-between space-x-12 overflow-hidden"
>
	<span class="text-xl font-bold text-gray-400 mt-16">RaspberryPi PICO WebUSB Benchmark</span>
	<TransferSpeed />
	<div class="grow flex flex-row w-full relative items-center justify-center px-48">
		<div
			class="
				grid grid-cols-11 overflow-auto grow
			"
		>
			<div class="flex flex-col grow h-12 items-center justify-center">
				<span class="w-32 font-bold align-middle text-gray-600">QueryTime / ChunkSize</span>
			</div>
			{#each chunkSizes as chunkSize, j (j)}
				<div class="flex flex-col grow h-12 items-center justify-center">
					<span class="w-12 font-bold text-center align-middle text-gray-600"
						>{chunkSize < 1024 ? (chunkSize / 1.0).toFixed(0) : (chunkSize / 1024.0).toFixed(0)}
						{chunkSize < 1024 ? 'B' : 'KB'}</span
					>
				</div>
			{/each}
			{#each queryTimes as queryTime, i (i)}
				<span class="w-12 font-bold text-center align-middle text-gray-600">{queryTime} ms</span>
				{#each chunkSizes as chunkSize, j (j)}
					{#if performanceDataVal && maxSpeedVal && performanceDataVal[chunkSize][queryTime].maxSpeed}
						<div
							class:bg-yellow-100={performanceDataVal[chunkSize][queryTime].started &&
								!performanceDataVal[chunkSize][queryTime].completed}
							class:bg-green-800={performanceDataVal[chunkSize][queryTime].maxSpeed ===
								maxSpeedVal.speed}
							class:bg-green-600={performanceDataVal[chunkSize][queryTime].maxSpeed <
								maxSpeedVal.speed &&
								performanceDataVal[chunkSize][queryTime].maxSpeed >= 0.9 * maxSpeedVal.speed}
							class:bg-yellow-500={performanceDataVal[chunkSize][queryTime].maxSpeed <
								0.9 * maxSpeedVal.speed &&
								performanceDataVal[chunkSize][queryTime].maxSpeed >= 0.8 * maxSpeedVal.speed}
							class:bg-orange-500={performanceDataVal[chunkSize][queryTime].maxSpeed <
								0.8 * maxSpeedVal.speed &&
								performanceDataVal[chunkSize][queryTime].maxSpeed >= 0.7 * maxSpeedVal.speed}
							class:bg-orange-600={performanceDataVal[chunkSize][queryTime].maxSpeed <
								0.7 * maxSpeedVal.speed &&
								performanceDataVal[chunkSize][queryTime].maxSpeed >= 0.6 * maxSpeedVal.speed}
							class:bg-orange-700={performanceDataVal[chunkSize][queryTime].maxSpeed <
								0.6 * maxSpeedVal.speed &&
								performanceDataVal[chunkSize][queryTime].maxSpeed >= 0.5 * maxSpeedVal.speed}
							class:bg-orange-800={performanceDataVal[chunkSize][queryTime].maxSpeed <
								0.5 * maxSpeedVal.speed &&
								performanceDataVal[chunkSize][queryTime].maxSpeed >= 0.4 * maxSpeedVal.speed}
							class:bg-red-600={performanceDataVal[chunkSize][queryTime].maxSpeed <
								0.4 * maxSpeedVal.speed &&
								performanceDataVal[chunkSize][queryTime].maxSpeed >= 0.3 * maxSpeedVal.speed}
							class:bg-red-700={performanceDataVal[chunkSize][queryTime].maxSpeed <
								0.3 * maxSpeedVal.speed &&
								performanceDataVal[chunkSize][queryTime].maxSpeed >= 0.2 * maxSpeedVal.speed}
							class:bg-red-800={performanceDataVal[chunkSize][queryTime].maxSpeed <
								0.2 * maxSpeedVal.speed &&
								performanceDataVal[chunkSize][queryTime].maxSpeed >= 0.1 * maxSpeedVal.speed}
							class:bg-red-900={performanceDataVal[chunkSize][queryTime].maxSpeed <
								0.1 * maxSpeedVal.speed}
							class="flex flex-col grow h-12 items-center justify-center"
						>
							<span class="fontw-12 -bold text-center"
								>{performanceDataVal[chunkSize][queryTime].maxSpeed.toFixed(2)} KB/s</span
							>
						</div>
					{:else}
						<div class="flex flex-col grow h-12 items-center justify-center">
							<span class="w-12 font-bold text-center text-gray-600">-</span>
						</div>
					{/if}
				{/each}
			{/each}
		</div>
	</div>
</div>
