<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		label: string;
		tooltip?: string[];
		children: Snippet;
	}

	let { label, tooltip, children }: Props = $props();
	const tooltipItems = $derived((tooltip ?? []).map((item) => item.trim()).filter(Boolean));
	const hasTooltip = $derived(tooltipItems.length > 0);
</script>

<div class="flex items-center justify-between text-xs">
	{#if hasTooltip}
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="sm"
						class="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
					>
						{label}
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent side="left">
				<div class="flex flex-col gap-1">
					{#each tooltipItems as item, index}
						<div>{index + 1}. {item}</div>
					{/each}
				</div>
			</TooltipContent>
		</Tooltip>
	{:else}
		<div class="text-muted-foreground">{label}</div>
	{/if}
	<div class="flex items-center gap-2 font-medium">{@render children()}</div>
</div>
