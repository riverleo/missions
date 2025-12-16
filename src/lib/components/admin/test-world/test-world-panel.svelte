<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconBug, IconBugOff } from '@tabler/icons-svelte';
	import { useTestWorld } from '$lib/hooks/use-test-world';

	const { store, setDebug } = useTestWorld();
</script>

<div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
	<ButtonGroup>
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button {...props} onclick={() => setDebug(!$store.debug)} size="icon-lg" variant="outline">
						{#if $store.debug}
							<IconBug />
						{:else}
							<IconBugOff />
						{/if}
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>
				{$store.debug ? '디버그 모드 끄기' : '디버그 모드 켜기'}
			</TooltipContent>
		</Tooltip>
	</ButtonGroup>
</div>
