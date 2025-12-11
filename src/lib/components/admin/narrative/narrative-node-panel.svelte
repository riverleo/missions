<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type {
		NarrativeNode,
		NarrativeNodeType,
		BulkChanges,
		NarrativeNodeChoice,
	} from '$lib/types';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Root as Select,
		Trigger as SelectTrigger,
		Content as SelectContent,
		Item as SelectItem,
	} from '$lib/components/ui/select';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupInput,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconFlag } from '@tabler/icons-svelte';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import NarrativeNodeChoicesSection from './narrative-node-choices-section.svelte';

	interface Props {
		narrativeNode: NarrativeNode | undefined;
	}

	let { narrativeNode }: Props = $props();

	const { admin } = useNarrative();
	const flowNodes = useNodes();

	let editTitle = $state(narrativeNode?.title ?? '');
	let editDescription = $state(narrativeNode?.description ?? '');
	let editType = $state<NarrativeNodeType>(narrativeNode?.type ?? 'text');
	let editRoot = $state(narrativeNode?.root ?? false);
	let isUpdating = $state(false);

	// 선택지 변경사항을 콜백으로 받음
	let narrativeNodeChoicesChanges = $state<BulkChanges<NarrativeNodeChoice> | undefined>(undefined);

	async function onsubmit() {
		if (!narrativeNode || isUpdating) return;

		const nodeId = narrativeNode.id; // await 이후에 narrativeNode가 변경될 수 있으므로 미리 저장
		isUpdating = true;

		try {
			// 1. 기본 정보 업데이트
			await admin.updateNode(nodeId, {
				title: editTitle,
				description: editDescription,
				type: editType,
				root: editRoot,
			});

			// 2. 선택지가 choice 타입이고 변경사항이 있으면 벌크 업데이트
			if (editType === 'choice' && narrativeNodeChoicesChanges) {
				await Promise.all([
					...narrativeNodeChoicesChanges.created.map((choice) => admin.createChoice(choice)),
					...narrativeNodeChoicesChanges.updated.map((choice) =>
						admin.updateChoice(choice.id!, choice)
					),
					...narrativeNodeChoicesChanges.deleted.map((id) => admin.removeChoice(id)),
				]);
			}

			// 선택 해제
			flowNodes.update((ns) => ns.map((n) => (n.id === nodeId ? { ...n, selected: false } : n)));
		} catch (error) {
			console.error('Failed to update narrative node:', error);
		} finally {
			isUpdating = false;
		}
	}

	function onclickCancel() {
		if (!narrativeNode) return;

		// 선택 해제
		flowNodes.update((ns) =>
			ns.map((n) => (n.id === narrativeNode.id ? { ...n, selected: false } : n))
		);
	}
</script>

<Panel position="top-right">
	<div
		class="w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800"
	>
		<h3 class="mb-4 text-lg font-semibold">내러티브 노드 수정</h3>
		<form {onsubmit} class="space-y-4">
			<div class="space-y-2">
				<Label>제목</Label>
				<ButtonGroup>
					<Select type="single" bind:value={editType}>
						<SelectTrigger>
							{editType === 'text' ? '텍스트' : '선택지'}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="text" label="텍스트">텍스트</SelectItem>
							<SelectItem value="choice" label="선택지">선택지</SelectItem>
						</SelectContent>
					</Select>
					<InputGroup>
						<InputGroupInput bind:value={editTitle} placeholder="제목을 입력하세요" />
						<InputGroupAddon align="inline-end">
							<Tooltip>
								<TooltipTrigger>
									{#snippet child({ props })}
										<InputGroupButton
											{...props}
											variant={editRoot ? 'default' : 'ghost'}
											size="icon-xs"
											aria-label="시작 노드로 설정"
											onclick={() => (editRoot = !editRoot)}
											class="rounded-full"
										>
											<IconFlag class="h-4 w-4" />
										</InputGroupButton>
									{/snippet}
								</TooltipTrigger>
								<TooltipContent>시작 노드</TooltipContent>
							</Tooltip>
						</InputGroupAddon>
					</InputGroup>
				</ButtonGroup>
			</div>
			<div class="space-y-2">
				<Label for="edit-description">설명</Label>
				<Textarea id="edit-description" bind:value={editDescription} rows={3} />
			</div>

			{#if editType === 'choice' && narrativeNode}
				<div class="mt-4 border-t pt-4">
					<NarrativeNodeChoicesSection
						narrativeNodeId={narrativeNode.id}
						narrativeNodeChoices={narrativeNode.narrative_node_choices ?? []}
						onchange={(changes) => (narrativeNodeChoicesChanges = changes)}
					/>
				</div>
			{/if}

			<div class="flex justify-end gap-2">
				<Button type="button" variant="outline" onclick={onclickCancel} disabled={isUpdating}>
					취소
				</Button>
				<Button type="submit" disabled={isUpdating}>
					{isUpdating ? '저장 중...' : '저장'}
				</Button>
			</div>
		</form>
	</div>
</Panel>
