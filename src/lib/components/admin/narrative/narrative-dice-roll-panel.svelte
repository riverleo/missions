<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type { NarrativeDiceRoll, DiceRollAction } from '$lib/types';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import { createNarrativeDiceRollNodeId } from '$lib/utils/flow-id';

	interface Props {
		narrativeDiceRoll: NarrativeDiceRoll | undefined;
	}

	let { narrativeDiceRoll }: Props = $props();

	const { admin } = useNarrative();
	const flowNodes = useNodes();

	let editDifficultyClass = $state(narrativeDiceRoll?.difficulty_class ?? 0);
	let editSuccessAction = $state<DiceRollAction>(narrativeDiceRoll?.success_action ?? 'narrative_node_next');
	let editFailureAction = $state<DiceRollAction>(narrativeDiceRoll?.failure_action ?? 'narrative_node_next');
	let isUpdating = $state(false);

	// 선택된 주사위 굴림이 변경되면 편집 필드 업데이트
	$effect(() => {
		if (narrativeDiceRoll) {
			editDifficultyClass = narrativeDiceRoll.difficulty_class;
			editSuccessAction = narrativeDiceRoll.success_action;
			editFailureAction = narrativeDiceRoll.failure_action;
		}
	});

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!narrativeDiceRoll || isUpdating) return;

		isUpdating = true;

		admin
			.updateNarrativeDiceRoll(narrativeDiceRoll.id, {
				difficulty_class: editDifficultyClass,
				success_action: editSuccessAction,
				failure_action: editFailureAction,
			})
			.then(() => {
				// 선택 해제
				const narrativeDiceRollNodeId = createNarrativeDiceRollNodeId(narrativeDiceRoll);
				flowNodes.update((ns) =>
					ns.map((n) => (n.id === narrativeDiceRollNodeId ? { ...n, selected: false } : n))
				);
			})
			.catch((error) => {
				console.error('Failed to update narrative dice roll:', error);
			})
			.finally(() => {
				isUpdating = false;
			});
	}

	function onclickCancel() {
		if (!narrativeDiceRoll) return;

		// 선택 해제
		const narrativeDiceRollNodeId = createNarrativeDiceRollNodeId(narrativeDiceRoll);
		flowNodes.update((ns) =>
			ns.map((n) => (n.id === narrativeDiceRollNodeId ? { ...n, selected: false } : n))
		);
	}

	function getActionLabel(action: DiceRollAction) {
		switch (action) {
			case 'narrative_node_next':
				return '다음 대화';
			case 'narrative_node_done':
				return '대화 종료';
		}
	}
</script>

<Panel position="top-right">
	<Card class="w-80 pt-6 pb-4">
		<CardContent class="px-4">
			<form {onsubmit} class="space-y-4">
				<InputGroup.Root>
					<InputGroup.Input
						type="number"
						placeholder="난이도 (DC)"
						bind:value={editDifficultyClass}
						min={1}
						max={30}
					/>
				</InputGroup.Root>

				<div class="space-y-2">
					<Select.Root type="single" bind:value={editSuccessAction}>
						<Select.Trigger>
							<span class="text-muted-foreground">성공:</span>
							<span class="ml-1">{getActionLabel(editSuccessAction)}</span>
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="narrative_node_next" label="다음 대화">다음 대화</Select.Item>
							<Select.Item value="narrative_node_done" label="대화 종료">대화 종료</Select.Item>
						</Select.Content>
					</Select.Root>

					<Select.Root type="single" bind:value={editFailureAction}>
						<Select.Trigger>
							<span class="text-muted-foreground">실패:</span>
							<span class="ml-1">{getActionLabel(editFailureAction)}</span>
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="narrative_node_next" label="다음 대화">다음 대화</Select.Item>
							<Select.Item value="narrative_node_done" label="대화 종료">대화 종료</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				<div class="flex justify-end gap-2">
					<Button type="button" variant="outline" onclick={onclickCancel} disabled={isUpdating}>
						취소
					</Button>
					<Button type="submit" disabled={isUpdating}>
						{isUpdating ? '저장 중...' : '저장'}
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>
</Panel>
