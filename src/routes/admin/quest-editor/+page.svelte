<script lang="ts">
	import Aside from './aside.svelte';
	import Header from './header.svelte';
	import Content from './content.svelte';
</script>

<div class="flex h-screen">
	<Aside />
	<div class="flex flex-1 flex-col">
		<Header />
		<Content />
	</div>
</div>
