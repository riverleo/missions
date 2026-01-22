<script lang="ts">
	import type { ConditionEffect } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useNeed } from '$lib/hooks/use-need';
	import { Separator } from '$lib/components/ui/separator';

	interface Props {
		data: {
			effect: ConditionEffect;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const effect = $derived(data.effect);

	const { characterStore } = useCharacter();
	const { needStore } = useNeed();

	const character = $derived(
		effect.character_id ? $characterStore.data[effect.character_id] : undefined
	);
	const need = $derived($needStore.data[effect.need_id]);

	const label = $derived.by(() => {
		const characterName = character ? `${character.name}` : '모든 캐릭터';
		const needName = need?.name ?? '욕구';
		const changeSign = effect.change_per_tick >= 0 ? '증가' : '감소';
		return `${characterName} ${needName} ${effect.change_per_tick}씩 ${changeSign}`;
	});
</script>

<div class="min-w-48 px-3 py-2">
	<Handle type="target" position={Position.Top} style="background-color: var(--color-red-500)" />

	<div class="flex flex-col gap-1">
		<div class="truncate text-sm font-bold" class:text-muted-foreground={!effect.name}>
			{effect.name ? effect.name : '이름 미입력'}
		</div>
		<Separator class="my-1 bg-white/10" />
		<div class="truncate text-sm text-accent-foreground">
			{label}
		</div>
		<div class="text-xs text-muted-foreground">
			{effect.min_threshold}~{effect.max_threshold} / 범위
		</div>
	</div>
</div>
