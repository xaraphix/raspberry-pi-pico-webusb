<script lang="ts">
	import { maxSpeed, speedInKBps } from '../stores/store';

	let speedVal: number;
	speedInKBps.subscribe((val) => {
		speedVal = val;
	});
	let maxSpeedVal: Maxspeed | null;
	maxSpeed.subscribe((val) => {
		maxSpeedVal = val;
	});
</script>

<div class="grow shrink-0 flex flex-col items-center justify-center">
	<div class="shrink-0 flex flex-row space-x-4 items-center justify-center mt-16">
		<div class="flex flex-col">
			<span class="font-boldt text-gray-600"> Max Speed </span>
			<span class="font-boldt text-gray-600"> Max Speed Query Time </span>
			<span class="font-boldt text-gray-600"> Max Speed Chunk Size </span>
		</div>
		<div class="flex flex-col">
			{#if maxSpeedVal}
				<span class="text-md">{maxSpeedVal.speed.toFixed(2)} KB/s</span>
				<span class="text-md">{maxSpeedVal.queryTime} ms</span>
				<span class="text-md">{(maxSpeedVal.chunkSizeInBytes / 1024.0).toFixed(2)} KB</span>
			{/if}
		</div>
	</div>
</div>
