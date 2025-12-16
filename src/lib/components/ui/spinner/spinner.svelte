<script lang="ts">
	import { cn } from '$lib/utils';
	import { IconLoader2 } from '@tabler/icons-svelte';

	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();
</script>

<IconLoader2 role="status" aria-label="Loading" class={cn('size-4 animate-spin', className)} />
