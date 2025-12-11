<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type { NarrativeDiceRoll, DiceRollAction } from '$lib/types';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { useDiceRoll } from '$lib/hooks/use-dice-roll.svelte';
	import { createDiceRollNodeId } from '$lib/utils/flow-id';

	interface Props {
		diceRoll: NarrativeDiceRoll | undefined;
	}

	let { diceRoll }: Props = $props();

	const { admin } = useDiceRoll();
	const flowNodes = useNodes();

	let editDifficultyClass = $state(diceRoll?.difficulty_class ?? 0);
	let editSuccessAction = $state<DiceRollAction>(diceRoll?.success_action ?? 'narrative_node_next');
	let editFailureAction = $state<DiceRollAction>(diceRoll?.failure_action ?? 'narrative_node_next');
	let isUpdating = $state(false);

	// 선택된 주사위 굴림이 변경되면 편집 필드 업데이트
	$effect(() => {
		if (diceRoll) {
			editDifficultyClass = diceRoll.difficulty_class;
			editSuccessAction = diceRoll.success_action;
			editFailureAction = diceRoll.failure_action;
		}
	});

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!diceRoll || isUpdating) return;

		isUpdating = true;

		admin
			.update(diceRoll.id, {
				difficulty_class: editDifficultyClass,
				success_action: editSuccessAction,
				failure_action: editFailureAction,
			})
			.then(() => {
				// 선택 해제
				const diceRollNodeId = createDiceRollNodeId(diceRoll);
				flowNodes.update((ns) =>
					ns.map((n) => (n.id === diceRollNodeId ? { ...n, selected: false } : n))
				);
			})
			.catch((error) => {
				console.error('Failed to update dice roll:', error);
			})
			.finally(() => {
				isUpdating = false;
			});
	}

	function onclickCancel() {
		if (!diceRoll) return;

		// 선택 해제
		const diceRollNodeId = createDiceRollNodeId(diceRoll);
		flowNodes.update((ns) =>
			ns.map((n) => (n.id === diceRollNodeId ? { ...n, selected: false } : n))
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
				<div class="space-y-2">
					<Label for="edit-dc">난이도 (DC)</Label>
					<Input id="edit-dc" type="number" bind:value={editDifficultyClass} min={1} max={30} />
				</div>
				<div class="space-y-2">
					<Label for="edit-success-action">성공 시 동작</Label>
					<Select.Root type="single" bind:value={editSuccessAction}>
						<Select.Trigger id="edit-success-action">
							{getActionLabel(editSuccessAction)}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="narrative_node_next" label="다음 대화">다음 대화</Select.Item>
							<Select.Item value="narrative_node_done" label="대화 종료">대화 종료</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
				<div class="space-y-2">
					<Label for="edit-failure-action">실패 시 동작</Label>
					<Select.Root type="single" bind:value={editFailureAction}>
						<Select.Trigger id="edit-failure-action">
							{getActionLabel(editFailureAction)}
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
