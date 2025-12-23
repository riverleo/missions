<script lang="ts">
	import type { NarrativeNodeChoice, BulkChanges } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import { Label } from '$lib/components/ui/label';
	import { IconTrash, IconPlus, IconGripVertical } from '@tabler/icons-svelte';
	import { isEqual, sort, clone } from 'radash';
	import { dndzone } from 'svelte-dnd-action';
	import type { DndEvent } from 'svelte-dnd-action';
	import { page } from '$app/state';
	import type { ScenarioId } from '$lib/types';

	interface Props {
		narrativeNodeId: string;
		narrativeNodeChoices: NarrativeNodeChoice[];
		onchange: (changes: BulkChanges<NarrativeNodeChoice>) => void;
	}

	let { narrativeNodeId, narrativeNodeChoices, onchange }: Props = $props();

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const TEMP_ID_PREFIX = 'temp-';

	let current = $state<NarrativeNodeChoice[]>(
		sort(clone(narrativeNodeChoices), (c) => c.order_in_narrative_node)
	);

	$effect(() => {
		current = sort(clone(narrativeNodeChoices), (c) => c.order_in_narrative_node);
	});

	// 변경사항 계산 및 콜백 호출
	function calculateAndNotifyChanges() {
		const originalMap = new Map(narrativeNodeChoices.map((c) => [c.id, c]));
		const currentIds = new Set(current.map((c) => c.id).filter(Boolean));

		// created: id가 임시 id인 항목들 (id 필드 제거)
		const created = current
			.filter((c) => c.id?.startsWith(TEMP_ID_PREFIX))
			.map((c) => {
				const { id, ...rest } = c;
				return rest;
			}) as Omit<NarrativeNodeChoice, 'id'>[];

		// updated: id 있고(임시 id 제외) 변경된 항목들
		const updated = current.filter((c) => {
			if (!c.id || c.id.startsWith(TEMP_ID_PREFIX)) return false;
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
		if (!scenarioId) return;
		// id 없이 추가 = 새로 생성될 항목
		// svelte-dnd-action은 각 항목에 id가 필요하므로 임시 id 생성
		current = [
			...current,
			{
				id: `${TEMP_ID_PREFIX}${Date.now()}-${Math.random()}`,
				narrative_node_id: narrativeNodeId,
				scenario_id: scenarioId,
				order_in_narrative_node: current.length,
				title: '',
			} as NarrativeNodeChoice,
		];
		calculateAndNotifyChanges();
	}

	function onchangeChoiceTitle(index: number, newTitle: string) {
		current = current.map((choice, i) => (i === index ? { ...choice, title: newTitle } : choice));
		calculateAndNotifyChanges();
	}

	function onclickDeleteChoice(e: MouseEvent, index: number) {
		current = current
			.filter((_, i) => i !== index)
			.map((choice, i) => ({
				...choice,
				order_in_narrative_node: i,
			}));
		calculateAndNotifyChanges();
	}

	function handleDndConsider(e: CustomEvent<DndEvent<NarrativeNodeChoice>>) {
		current = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<NarrativeNodeChoice>>) {
		// 순서 변경 시 order_in_narrative_node 업데이트
		current = e.detail.items.map((item, index) => ({
			...item,
			order_in_narrative_node: index,
		}));
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

	<div
		class="space-y-2"
		use:dndzone={{ items: current, flipDurationMs: 200 }}
		onconsider={handleDndConsider}
		onfinalize={handleDndFinalize}
	>
		{#each current as choice, index (choice.id)}
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<button type="button" class="cursor-grab px-1 active:cursor-grabbing" aria-label="드래그">
						<IconGripVertical class="h-4 w-4 text-muted-foreground" />
					</button>
				</InputGroupAddon>
				<InputGroupInput
					value={choice.title || ''}
					onchange={(e) => onchangeChoiceTitle(index, e.currentTarget.value)}
					placeholder="선택지 이름"
				/>
				<InputGroupAddon align="inline-end">
					<InputGroupButton
						type="button"
						variant="ghost"
						size="icon-xs"
						onclick={(e) => onclickDeleteChoice(e, index)}
						class="hover:text-destructive"
					>
						<IconTrash class="size-3" />
					</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>
		{/each}

		{#if current.length === 0}
			<p class="text-sm text-muted-foreground">선택지가 없습니다. 추가해주세요.</p>
		{/if}
	</div>
</div>
