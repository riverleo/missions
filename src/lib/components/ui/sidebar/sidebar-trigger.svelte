<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand } from '@tabler/icons-svelte';
	import type { ComponentProps } from 'svelte';
	import { useSidebar } from './context.svelte.js';

	let {
		ref = $bindable(null),
		onclick,
		...restProps
	}: ComponentProps<typeof Button> & {
		onclick?: (e: MouseEvent) => void;
	} = $props();

	const sidebar = useSidebar();
</script>

<Button
	data-sidebar="trigger"
	data-slot="sidebar-trigger"
	variant="ghost"
	size="sm"
	type="button"
	onclick={(e: MouseEvent) => {
		onclick?.(e);
		sidebar.toggle();
	}}
	{...restProps}
>
	{#if sidebar.open}
		<IconLayoutSidebarLeftCollapse />
	{:else}
		<IconLayoutSidebarLeftExpand />
	{/if}
	<span class="sr-only">Toggle Sidebar</span>
</Button>
