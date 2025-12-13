<script lang="ts">
	import { Panel, useNodes, useEdges } from '@xyflow/svelte';
	import type {
		NarrativeNode,
		NarrativeNodeType,
		BulkChanges,
		NarrativeNodeChoice,
	} from '$lib/types';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuItem,
	} from '$lib/components/ui/dropdown-menu';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupTextarea,
		InputGroupAddon,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { IconCircleDashedNumber1, IconHeading } from '@tabler/icons-svelte';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import NarrativeNodeChoicesSection from './narrative-node-choices-section.svelte';
	import { createNarrativeNodeId } from '$lib/utils/flow-id';
	import { clone } from 'radash';
	import { tick } from 'svelte';

	interface Props {
		narrativeNode: NarrativeNode | undefined;
	}

	let { narrativeNode }: Props = $props();

	const { admin, store } = useNarrative();
	const flowNodes = useNodes();
	const flowEdges = useEdges();

	let isUpdating = $state(false);

	let changes = $state<NarrativeNode | undefined>(undefined);
	let narrativeNodeChoicesChanges = $state<BulkChanges<NarrativeNodeChoice> | undefined>(undefined);
	let currentNarrativeNodeId = $state<string | undefined>(undefined);
	let titleInputRef = $state<HTMLInputElement | null>(null);

	// narrativeNode가 변경될 때마다 클론해서 로컬 상태 업데이트
	// 단, 다른 노드로 바뀔 때만 초기화 (같은 노드의 업데이트는 무시)
	$effect(() => {
		if (narrativeNode && narrativeNode.id !== currentNarrativeNodeId) {
			currentNarrativeNodeId = narrativeNode.id;
			changes = clone(narrativeNode);
			narrativeNodeChoicesChanges = undefined;

			// 패널 열릴 때 title input에 포커스
			tick().then(() => {
				titleInputRef?.focus();
			});
		}
	});

	async function onsubmit() {
		if (!changes || isUpdating) return;

		const nodeId = changes.id;
		const flowNodeId = createNarrativeNodeId(changes);
		isUpdating = true;

		try {
			// 1. 시작 대화로 설정하려는 경우, 다른 시작 대화 해제
			if (changes.root) {
				const currentNarrative = $store.data?.find((n) =>
					n.narrative_nodes?.some((node) => node.id === nodeId)
				);
				if (currentNarrative?.narrative_nodes) {
					const otherRootNodes = currentNarrative.narrative_nodes.filter(
						(n) => n.id !== nodeId && n.root
					);
					// 다른 root 노드들을 먼저 해제
					await Promise.all(otherRootNodes.map((n) => admin.updateNode(n.id, { root: false })));
				}
			}

			// 2. 기본 정보 업데이트
			await admin.updateNode(nodeId, {
				title: changes.title,
				description: changes.description,
				type: changes.type,
				root: changes.root,
			});

			// 3. 시작 노드로 설정된 경우 들어오는 엣지 제거
			if (changes.root) {
				flowEdges.update((edges) => edges.filter((edge) => edge.target !== flowNodeId));
			}

			// 4. 선택지가 choice 타입이고 변경사항이 있으면 벌크 업데이트
			if (changes.type === 'choice' && narrativeNodeChoicesChanges) {
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
		if (!changes) return;

		const nodeId = changes.id;
		// 선택 해제
		flowNodes.update((ns) => ns.map((n) => (n.id === nodeId ? { ...n, selected: false } : n)));
	}
</script>

<Panel position="top-right">
	<Card class="w-80 py-4">
		<CardContent class="px-4">
			<form {onsubmit} class="space-y-4">
				{#if changes}
					<div class="space-y-2">
						<InputGroup>
							<InputGroupAddon align="inline-start">
								<IconHeading class="size-4" />
							</InputGroupAddon>
							<InputGroupInput bind:ref={titleInputRef} bind:value={changes.title} placeholder="제목을 입력하세요" />
						</InputGroup>
						<InputGroup>
							<InputGroupTextarea
								id="edit-description"
								bind:value={changes.description}
								rows={3}
								placeholder="내용을 입력하세요"
							/>
							<InputGroupAddon align="block-end" class="justify-between">
								<DropdownMenu>
									<DropdownMenuTrigger>
										{#snippet child({ props })}
											<InputGroupButton {...props} variant="ghost">
												{changes?.type === 'text' ? '텍스트' : '선택지'}
											</InputGroupButton>
										{/snippet}
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem
											onclick={() => {
												if (changes) changes.type = 'text';
											}}
										>
											텍스트
										</DropdownMenuItem>
										<DropdownMenuItem
											onclick={() => {
												if (changes) changes.type = 'choice';
											}}
										>
											선택지
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
								<Tooltip>
									<TooltipTrigger>
										{#snippet child({ props })}
											<InputGroupButton
												{...props}
												variant={changes?.root ? 'default' : 'ghost'}
												size="icon-xs"
												aria-label="시작 대화로 지정"
												onclick={() => {
													if (changes) changes.root = !changes.root;
												}}
												class="rounded-full"
											>
												<IconCircleDashedNumber1 class="h-4 w-4" />
											</InputGroupButton>
										{/snippet}
									</TooltipTrigger>
									<TooltipContent>시작 대화로 지정</TooltipContent>
								</Tooltip>
							</InputGroupAddon>
						</InputGroup>
					</div>

					{#if changes.type === 'choice'}
						<div class="mt-3 border-t pt-2">
							<NarrativeNodeChoicesSection
								narrativeNodeId={changes.id}
								narrativeNodeChoices={changes.narrative_node_choices ?? []}
								onchange={(c) => (narrativeNodeChoicesChanges = c)}
							/>
						</div>
					{/if}
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
		</CardContent>
	</Card>
</Panel>
