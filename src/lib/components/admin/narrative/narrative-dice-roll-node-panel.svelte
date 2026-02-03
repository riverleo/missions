<script lang="ts">
	import { useNarrative } from '$lib/hooks';
	import { Panel, useNodes } from '@xyflow/svelte';
	import type { NarrativeDiceRoll, DiceRollAction } from '$lib/types';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupText,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { IconDice5, IconInfoCircle } from '@tabler/icons-svelte';
	import { createNarrativeDiceRollNodeId } from '$lib/utils/flow-id';
	import { tick } from 'svelte';

	interface Props {
		narrativeDiceRoll: NarrativeDiceRoll | undefined;
	}

	let { narrativeDiceRoll }: Props = $props();

	const { admin } = useNarrative();
	const flowNodes = useNodes();

	let editDifficultyClass = $state(narrativeDiceRoll?.difficulty_class ?? 0);
	let editSuccessAction = $state<DiceRollAction>(
		narrativeDiceRoll?.success_action ?? 'narrative_node_next'
	);
	let editFailureAction = $state<DiceRollAction>(
		narrativeDiceRoll?.failure_action ?? 'narrative_node_next'
	);
	let isUpdating = $state(false);
	let difficultyInputRef = $state<HTMLInputElement | null>(null);
	let currentNarrativeDiceRollId = $state<string | undefined>(undefined);

	// 선택된 주사위 굴림이 변경되면 편집 필드 업데이트
	$effect(() => {
		if (narrativeDiceRoll && narrativeDiceRoll.id !== currentNarrativeDiceRollId) {
			currentNarrativeDiceRollId = narrativeDiceRoll.id;
			editDifficultyClass = narrativeDiceRoll.difficulty_class;
			editSuccessAction = narrativeDiceRoll.success_action;
			editFailureAction = narrativeDiceRoll.failure_action;

			tick().then(() => {
				difficultyInputRef?.focus();
			});
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
				// 저장 성공
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
	<Card class="w-96 pt-6 pb-4">
		<CardContent class="px-4">
			<form {onsubmit} class="space-y-4">
				<div class="space-y-2">
					<InputGroup>
						<InputGroupAddon align="inline-start">
							<IconDice5 class="h-4 w-4" />
						</InputGroupAddon>
						<InputGroupInput
							bind:ref={difficultyInputRef}
							type="number"
							placeholder="난이도 (DC)"
							bind:value={editDifficultyClass}
							min={0}
							max={30}
						/>
						<InputGroupAddon align="inline-end">
							<Tooltip>
								<TooltipTrigger>
									{#snippet child({ props })}
										<InputGroupButton
											{...props}
											variant="ghost"
											class="rounded-full"
											size="icon-xs"
										>
											<IconInfoCircle />
										</InputGroupButton>
									{/snippet}
								</TooltipTrigger>
								<TooltipContent>
									성공에 필요한 최소한의 주사위 숫자입니다.
									<br />
									0은 주사위를 굴리지 않고 자동으로 진행됩니다.
								</TooltipContent>
							</Tooltip>
						</InputGroupAddon>
					</InputGroup>

					<ButtonGroup class="w-full *:flex-1">
						<ButtonGroup>
							<ButtonGroupText>성공</ButtonGroupText>
							<Select type="single" bind:value={editSuccessAction}>
								<SelectTrigger class="flex-1">
									{getActionLabel(editSuccessAction)}
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="narrative_node_next" label="다음 대화">다음 대화</SelectItem>
									<SelectItem value="narrative_node_done" label="대화 종료">대화 종료</SelectItem>
								</SelectContent>
							</Select>
						</ButtonGroup>

						<ButtonGroup>
							<ButtonGroupText>실패</ButtonGroupText>
							<Select
								type="single"
								bind:value={editFailureAction}
								disabled={editDifficultyClass === 0}
							>
								<SelectTrigger class="flex-1">
									{getActionLabel(editFailureAction)}
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="narrative_node_next" label="다음 대화">다음 대화</SelectItem>
									<SelectItem value="narrative_node_done" label="대화 종료">대화 종료</SelectItem>
								</SelectContent>
							</Select>
						</ButtonGroup>
					</ButtonGroup>
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
