<script lang="ts">
	import type { ConditionEffect } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useNeed } from '$lib/hooks/use-need';

	interface Props {
		data: {
			effect: ConditionEffect;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const effect = $derived(data.effect);

	const { store: characterStore } = useCharacter();
	const { needStore } = useNeed();

	const character = $derived(
		effect.character_id ? $characterStore.data[effect.character_id] : undefined
	);
	const need = $derived($needStore.data[effect.need_id]);

	const label = $derived(() => {
		const characterName = character ? `${character.name}만` : '모든 캐릭터가';
		const needName = need?.name ?? '욕구';
		const changeSign = effect.change_per_tick >= 0 ? '증가' : '감소';
		return `${characterName} 사용 시 ${effect.change_per_tick}씩 ${changeSign} (${needName})`;
	});
</script>

<div class="min-w-48 px-3 py-2">
	<Handle type="target" position={Position.Top} style="background-color: var(--color-red-500)" />

	<div class="flex flex-col gap-1">
		<div class="truncate text-sm font-medium" class:text-muted-foreground={!effect.name}>
			{effect.name ? effect.name : '이름 미입력'} ({effect.min_threshold}~{effect.max_threshold})
		</div>
		<div class="truncate text-xs text-muted-foreground">
			{label()}
		</div>
	</div>
</div>
