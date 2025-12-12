<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type { QuestBranch } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
	} from '$lib/components/ui/input-group';
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import { IconHeading, IconSortDescending } from '@tabler/icons-svelte';
	import { clone } from 'radash';

	interface Props {
		questBranch: QuestBranch | undefined;
		onupdate?: (questBranch: QuestBranch) => void;
	}

	let { questBranch, onupdate }: Props = $props();

	const { admin } = useQuest();
	const flowNodes = useNodes();

	let isUpdating = $state(false);
	let changes = $state<QuestBranch | undefined>(undefined);

	// 선택된 브랜치가 변경되면 클론해서 로컬 상태 업데이트
	$effect(() => {
		if (questBranch) {
			changes = clone(questBranch);
		}
	});

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!changes || isUpdating) return;

		const branchId = changes.id;
		const updatedBranch = changes; // await 이전에 참조 저장
		isUpdating = true;

		admin
			.updateBranch(branchId, {
				title: changes.title,
				display_order: changes.display_order,
			})
			.then(() => {
				// 부모 컴포넌트에 업데이트 알림
				onupdate?.(updatedBranch);
			})
			.catch((error) => {
				console.error('Failed to update branch:', error);
			})
			.finally(() => {
				isUpdating = false;
			});
	}

	function onclickCancel() {
		const selectedNode = flowNodes.current.find((n) => n.selected);
		if (!selectedNode) return;

		// 선택 해제
		flowNodes.update((ns) =>
			ns.map((n) => (n.id === selectedNode.id ? { ...n, selected: false } : n))
		);
	}
</script>

<Panel position="top-right">
	<Card class="w-80 py-4">
		<CardContent class="px-4">
			{#if changes}
				<form {onsubmit} class="space-y-4">
					<div class="space-y-2">
						<InputGroup>
							<InputGroupAddon align="inline-start">
								<IconHeading class="size-4" />
							</InputGroupAddon>

							<InputGroupInput bind:value={changes.title} placeholder="제목을 입력하세요" />
						</InputGroup>
						<InputGroup>
							<InputGroupAddon align="inline-start">
								<IconSortDescending class="size-4" />
							</InputGroupAddon>
							<InputGroupInput type="number" bind:value={changes.display_order} />
						</InputGroup>
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
			{/if}
		</CardContent>
	</Card>
</Panel>
