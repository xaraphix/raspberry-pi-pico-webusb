<script>
	import SineCurve from "../components/SineCurve.svelte";
	import TestControls from "../components/TestControls.svelte";
	import TransferSpeed from "../components/TransferSpeed.svelte";

</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<h1>
		PICO Audio Interface
	</h1>

	<SineCurve />
	<TestControls />
	<TransferSpeed />
	
</section>
