<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type { NarrativeNode, NarrativeNodeType } from '$lib/types';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import NarrativeNodeChoiceEditor from './narrative-node-choice-editor.svelte';

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

	// 선택된 노드가 변경되면 편집 필드 업데이트
	$effect(() => {
		if (narrativeNode) {
			editTitle = narrativeNode.title || '';
			editDescription = narrativeNode.description || '';
			editType = narrativeNode.type;
			editRoot = narrativeNode.root;
		}
	});

	// 타입이 변경되면 dice_roll_id를 null로 설정
	let prevType = $state<NarrativeNodeType>(narrativeNode?.type ?? 'text');
	$effect(() => {
		if (narrativeNode && editType !== prevType) {
			prevType = editType;
			if (narrativeNode.dice_roll_id) {
				admin.updateNode(narrativeNode.id, { dice_roll_id: null });
			}
		}
	});

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!narrativeNode || isUpdating) return;

		isUpdating = true;

		admin
			.updateNode(narrativeNode.id, {
				title: editTitle,
				description: editDescription,
				type: editType,
				root: editRoot,
			})
			.then(() => {
				// 선택 해제
				flowNodes.update((ns) =>
					ns.map((n) => (n.id === narrativeNode.id ? { ...n, selected: false } : n))
				);
			})
			.catch((error) => {
				console.error('Failed to update narrative node:', error);
			})
			.finally(() => {
				isUpdating = false;
			});
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
				<Label for="edit-title">제목</Label>
				<Input id="edit-title" bind:value={editTitle} />
			</div>
			<div class="space-y-2">
				<Label for="edit-description">설명</Label>
				<Textarea id="edit-description" bind:value={editDescription} rows={3} />
			</div>
			<div class="space-y-2">
				<Label for="edit-type">타입</Label>
				<Select.Root type="single" bind:value={editType}>
					<Select.Trigger id="edit-type">
						{editType === 'text' ? '텍스트' : '선택지'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="text" label="텍스트">텍스트</Select.Item>
						<Select.Item value="choice" label="선택지">선택지</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
			<div class="flex items-center space-x-2">
				<input id="edit-root" type="checkbox" bind:checked={editRoot} class="h-4 w-4" />
				<Label for="edit-root">시작 노드</Label>
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

		{#if editType === 'choice' && narrativeNode?.narrative_node_choices}
			<div class="mt-4 border-t pt-4">
				<NarrativeNodeChoiceEditor
					narrativeNodeId={narrativeNode.id}
					choices={narrativeNode.narrative_node_choices}
				/>
			</div>
		{/if}
	</div>
</Panel>
