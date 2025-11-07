<script lang="ts">
	import Landing from '$lib/components/Landing.svelte';
	import PlayerSheet from '$lib/components/player/PlayerSheet.svelte';
	import { wasLoggedIn } from '$lib/stores';
</script>

{#if $wasLoggedIn}
	<div class="container mx-auto p-4">
		<div class="grid gap-6 md:grid-cols-2">
			<div>
				<PlayerSheet />
			</div>
			<div class="rounded-lg border p-6">
				<h2 class="mb-4 text-xl font-bold">진행 중인 미션</h2>
				<p class="text-muted-foreground">아직 진행 중인 미션이 없습니다.</p>
			</div>
		</div>
	</div>
{:else}
	<Landing />
{/if}
