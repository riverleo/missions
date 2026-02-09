<script lang="ts">
	import { useCharacter } from '$lib/hooks';
	import { getFallbackString } from '$lib/utils/label';
	import type { ConditionEffect } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
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

	const { getOrUndefinedCharacter, getOrUndefinedNeed } = useCharacter();

	const character = $derived(getOrUndefinedCharacter(effect.character_id));
	const need = $derived(getOrUndefinedNeed(effect.need_id));

	const label = $derived.by(() => {
		const characterName = character ? `${character.name}` : getFallbackString('allCharacters');
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
