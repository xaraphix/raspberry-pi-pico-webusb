<script>
	import '../routes/styles.css';
	export const ssr = false;
</script>

<div class="h-full w-full bg-black text-white">
	<main class="h-full w-full bg-black text-white">
		<slot />
	</main>
</div>
