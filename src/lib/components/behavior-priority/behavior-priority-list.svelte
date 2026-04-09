<script lang="ts">
	import { useBehavior } from '$lib/hooks';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import type { BehaviorPriority, BulkChanges } from '$lib/types';
	import BehaviorPriorityListItem from './behavior-priority-list-item.svelte';
	import { isEqual, clone, sort } from 'radash';

	interface Props {
		onchange: (changes: BulkChanges<BehaviorPriority>) => void;
	}

	let { onchange }: Props = $props();

	const { behaviorPriorityStore } = useBehavior();

	// priority 순으로 정렬된 우선도 리스트
	type DndItem = BehaviorPriority & { id: string };
	let current = $state<DndItem[]>([]);
	let hasLocalChanges = $state(false);

	// store가 업데이트될 때마다 current 동기화 (로컬 변경사항이 없을 때만)
	$effect(() => {
		if (!hasLocalChanges) {
			const priorities = Object.values($behaviorPriorityStore.data);
			current = sort(clone(priorities), (p) => p.priority).map((p) => ({ ...p, id: p.id }));
		}
	});

	const flipDurationMs = 200;

	function calculateAndNotifyChanges() {
		const origin = Object.values($behaviorPriorityStore.data);
		const originalMap = new Map(origin.map((p) => [p.id, p]));
		const currentIds = new Set(current.map((c) => c.id));

		// updated: priority가 변경된 항목들
		const updated = current.filter((c) => {
			const original = originalMap.get(c.id);
			return original && !isEqual(c, original);
		});

		// deleted: origin에는 있는데 current에 없는 id들
		const deleted = origin.filter((p) => !currentIds.has(p.id)).map((p) => p.id);

		// 부모에게 변경사항 전달
		onchange({
			origin,
			current: [...current],
			created: [], // priority는 생성은 command에서 함
			updated,
			deleted,
		});

		// 변경사항이 있으면 로컬 변경 플래그 설정
		hasLocalChanges = updated.length > 0 || deleted.length > 0;
	}

	// store 데이터가 실제로 변경되면 (저장 후) hasLocalChanges 리셋
	let prevStoreData = Object.values($behaviorPriorityStore.data);
	$effect(() => {
		const currentStoreData = Object.values($behaviorPriorityStore.data);
		// store 데이터가 변경되고 로컬 변경사항이 있었다면 리셋
		if (hasLocalChanges && !isEqual(prevStoreData, currentStoreData)) {
			hasLocalChanges = false;
		}
		prevStoreData = clone(currentStoreData);
	});

	function handleDndConsider(e: CustomEvent<{ items: DndItem[] }>) {
		current = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<{ items: DndItem[] }>) {
		// 순서 변경 시 priority 업데이트
		current = e.detail.items.map((item, index) => ({
			...item,
			priority: index + 1,
		}));
		calculateAndNotifyChanges();
	}

	function moveUp(index: number) {
		if (index <= 0) return;

		const prev = current[index - 1];
		const curr = current[index];
		if (!prev || !curr) return;

		// 배열에서 위치 교환
		const newCurrent = [...current];
		newCurrent[index - 1] = curr;
		newCurrent[index] = prev;

		// priority 값 업데이트
		current = newCurrent.map((item, i) => ({
			...item,
			priority: i + 1,
		}));

		calculateAndNotifyChanges();
	}

	function moveDown(index: number) {
		if (index >= current.length - 1) return;

		const curr = current[index];
		const next = current[index + 1];
		if (!curr || !next) return;

		// 배열에서 위치 교환
		const newCurrent = [...current];
		newCurrent[index] = next;
		newCurrent[index + 1] = curr;

		// priority 값 업데이트
		current = newCurrent.map((item, i) => ({
			...item,
			priority: i + 1,
		}));

		calculateAndNotifyChanges();
	}

	function remove(index: number) {
		// 배열에서 제거하고 priority 재정렬
		current = current
			.filter((_, i) => i !== index)
			.map((item, i) => ({
				...item,
				priority: i + 1,
			}));

		calculateAndNotifyChanges();
	}
</script>

<div class="flex flex-col gap-1">
	{#if current.length === 0}
		<div class="p-4 text-center text-sm text-muted-foreground">
			왼쪽 목록에서 행동을 드래그하여 우선도를 설정하세요
		</div>
	{:else}
		<div
			use:dndzone={{ items: current, flipDurationMs }}
			onconsider={handleDndConsider}
			onfinalize={handleDndFinalize}
			class="flex flex-col gap-1"
		>
			{#each current as item, index (item.id)}
				<div
					animate:flip={{ duration: flipDurationMs }}
					class="cursor-grab rounded-lg border bg-background active:cursor-grabbing"
				>
					<BehaviorPriorityListItem
						priority={item}
						isFirst={index === 0}
						isLast={index === current.length - 1}
						onmoveup={() => moveUp(index)}
						onmovedown={() => moveDown(index)}
						onremove={() => remove(index)}
					/>
				</div>
			{/each}
		</div>
	{/if}
</div>
