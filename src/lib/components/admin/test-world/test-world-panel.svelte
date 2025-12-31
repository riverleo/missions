<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconBug, IconBugOff, IconEraser } from '@tabler/icons-svelte';
	import { useTestWorld } from '$lib/hooks/use-world';

	const { store, setDebug, setEraser } = useTestWorld();
</script>

<div class="absolute top-2 right-2 flex items-center gap-2">
	<ButtonGroup>
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						onclick={() => setEraser(!$store.eraser)}
						size="icon-sm"
						variant={$store.eraser ? 'default' : 'ghost'}
					>
						<IconEraser />
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>
				{$store.eraser ? '지우개 끄기' : '지우개 켜기'}
			</TooltipContent>
		</Tooltip>
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button {...props} onclick={() => setDebug(!$store.debug)} size="icon-sm" variant="ghost">
						{#if $store.debug}
							<IconBugOff />
						{:else}
							<IconBug />
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
