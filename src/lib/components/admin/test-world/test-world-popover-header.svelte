<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { IconX } from '@tabler/icons-svelte';

	interface Props {
		onmousedown: (e: MouseEvent) => void;
		onclose: () => void;
	}

	let { onmousedown, onclose }: Props = $props();
</script>

<div class="relative flex shrink-0 items-center justify-between border-b p-2">
	<Button variant="ghost" size="sm" class="cursor-move" {onmousedown}>
		테스트 월드
	</Button>
	<Button
		variant="ghost"
		size="icon-sm"
		onclick={onclose}
		class="absolute top-1/2 right-2 -translate-y-1/2"
	>
		<IconX class="size-4" />
	</Button>
</div>
