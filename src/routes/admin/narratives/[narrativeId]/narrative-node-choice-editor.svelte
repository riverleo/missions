<script lang="ts">
	import type { NarrativeNodeChoice, BulkChanges } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { IconTrash, IconPlus } from '@tabler/icons-svelte';
	import { isEqual } from 'radash';

	interface Props {
		narrativeNodeId: string;
		narrativeNodeChoices: NarrativeNodeChoice[];
		onchange: (changes: BulkChanges<NarrativeNodeChoice>) => void;
	}

	let { narrativeNodeId, narrativeNodeChoices, onchange }: Props = $props();

	// current만 $state로 관리 (origin은 narrativeNodeChoices prop을 그대로 사용)
	let current = $state<NarrativeNodeChoice[]>(structuredClone(narrativeNodeChoices));

	$effect(() => {
		current = structuredClone(narrativeNodeChoices);
	});

	// 변경사항 계산 및 콜백 호출
	function calculateAndNotifyChanges() {
		const originalMap = new Map(narrativeNodeChoices.map((c) => [c.id, c]));
		const currentIds = new Set(current.map((c) => c.id).filter(Boolean));

		// created: id 없는 항목들
		const created = current.filter((c) => !c.id);

		// updated: id 있고 변경된 항목들
		const updated = current.filter((c) => {
			if (!c.id) return false;
			const original = originalMap.get(c.id);
			return original && !isEqual(c, original);
		});

		// deleted: original에는 있는데 current에 없는 id들
		const deleted = narrativeNodeChoices.filter((c) => !currentIds.has(c.id)).map((c) => c.id);

		// 부모에게 변경사항 전달 (plain object, $state 프록시 제거)
		onchange({
			origin: narrativeNodeChoices,
			current: [...current],
			created,
			updated,
			deleted,
		});
	}

	function onclickAddChoice(e: MouseEvent) {
		// id 없이 추가 = 새로 생성될 항목
		current.push({
			narrative_node_id: narrativeNodeId,
			title: '새로운 선택지',
		} as NarrativeNodeChoice);

		current = current;
		calculateAndNotifyChanges();
	}

	function onchangeChoiceTitle(index: number, newTitle: string) {
		current[index].title = newTitle;
		current = current;
		calculateAndNotifyChanges();
	}

	function onclickDeleteChoice(e: MouseEvent, index: number) {
		current.splice(index, 1);
		current = current;
		calculateAndNotifyChanges();
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<Label>선택지</Label>
		<Button type="button" size="sm" variant="ghost" onclick={onclickAddChoice}>
			<IconPlus class="h-4 w-4" />
		</Button>
	</div>

	<div class="space-y-2">
		{#each current as choice, index (choice.id ?? `new-${index}`)}
			<div class="flex items-center gap-2">
				<Input
					value={choice.title || ''}
					onchange={(e) => onchangeChoiceTitle(index, e.currentTarget.value)}
					class="flex-1"
				/>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onclick={(e) => onclickDeleteChoice(e, index)}
				>
					<IconTrash class="h-4 w-4 text-destructive" />
				</Button>
			</div>
		{/each}

		{#if current.length === 0}
			<p class="text-sm text-muted-foreground">선택지가 없습니다. 추가해주세요.</p>
		{/if}
	</div>
</div>
