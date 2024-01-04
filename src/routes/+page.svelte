<script lang="ts">
	import AudioInterface from './AudioInterface.svelte';
	import { isDeviceConnected, isDeviceConnecting } from '../stores/store';
	import { connectToAudioInterface } from '../utils/Audio';
	let deviceConnected = false;
	let deviceConnecting = false;
	isDeviceConnected.subscribe((val: boolean) => {
		deviceConnected = val;
	});
	isDeviceConnecting.subscribe((val: boolean) => {
		deviceConnecting = val;
	});
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<div class="h-full w-full bg-black text-white">
	{#if !deviceConnected}
		<div
			class="bg-[#0A0A0A] h-full flex-col w-full px-64 flex space-y-8 items-center justify-center"
		>
			<div class="w-[300px] h-[300px] flex items-center justify-center">
				<div class="absolute relative flex justify-center items-center h-full w-full">
					{#if deviceConnecting}
						<div
							class="animate-spin rounded-full h-64 w-64 border-t-2 border-b-2 border-purple-900 opacity-100"
						></div>
					{/if}
					<img alt="raspberrypi logo" src="/raspberrypi.png" class="w-[256px] h-[143px] absolute" />
				</div>
			</div>
			<h1 class="text-4xl mb-6 font-bold">Connect to Raspberry Pi Pico</h1>

			<button
				class="flex w-64 h-16 flex-row items-center overflow-hidden rounded-2xl bg-white shadow-xl shadow-[#00007f] cursor-pointer"
				on:click={() => connectToAudioInterface()}
			>
				<div
					class="flex h-full w-full flex-row items-center justify-center space-x-4 rounded-2xl border-8 border-l-0 border-t-0 border-slate-300 py-6"
				>
					<span
						class="text-error-container-dark font-heading text-xl font-bold text-black select-none hover:text-[#0000FF]"
					>
						Connect
					</span>
				</div>
			</button>
		</div>
	{:else}
		<AudioInterface />
	{/if}
</div>
