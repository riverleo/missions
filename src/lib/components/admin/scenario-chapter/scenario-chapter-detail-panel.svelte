<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type { ScenarioChapter } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { InputGroup, InputGroupInput, InputGroupAddon } from '$lib/components/ui/input-group';
	import { IconHeading, IconSortDescending } from '@tabler/icons-svelte';
	import { useScenarioChapter } from '$lib/hooks/use-scenario-chapter.svelte';
	import { clone } from 'radash';
	import { tick } from 'svelte';

	interface Props {
		scenarioChapter: ScenarioChapter;
		onupdate?: (scenarioChapter: ScenarioChapter) => void;
	}

	let { scenarioChapter, onupdate }: Props = $props();

	const { admin } = useScenarioChapter();
	const flowNodes = useNodes();

	let isUpdating = $state(false);
	let isPublishing = $state(false);
	let changes = $state<ScenarioChapter | undefined>(undefined);
	let titleInputRef = $state<HTMLInputElement | null>(null);
	let currentChapterId = $state<string | undefined>(undefined);

	const isPublished = $derived(changes?.status === 'published');

	$effect(() => {
		if (scenarioChapter && scenarioChapter.id !== currentChapterId) {
			currentChapterId = scenarioChapter.id;
			changes = clone(scenarioChapter);

			tick().then(() => {
				titleInputRef?.focus();
			});
		}
	});

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!changes || isUpdating) return;

		const scenarioChapterId = changes.id;
		const updatedScenarioChapter = changes;
		isUpdating = true;

		admin
			.update(scenarioChapterId, {
				title: changes.title,
				display_order_in_scenario: changes.display_order_in_scenario,
			})
			.then(() => {
				onupdate?.(updatedScenarioChapter);
			})
			.catch((error) => {
				console.error('Failed to update scenario chapter:', error);
			})
			.finally(() => {
				isUpdating = false;
			});
	}

	function onclickCancel() {
		const selectedNode = flowNodes.current.find((n) => n.selected);
		if (!selectedNode) return;

		flowNodes.update((ns) =>
			ns.map((n) => (n.id === selectedNode.id ? { ...n, selected: false } : n))
		);
	}

	function onclickPublish() {
		if (!changes || isPublishing) return;

		isPublishing = true;

		const action = isPublished ? admin.unpublish : admin.publish;

		action(changes.id)
			.catch((error) => {
				console.error('Failed to change scenario chapter status:', error);
			})
			.finally(() => {
				isPublishing = false;
			});
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
							<InputGroupInput bind:ref={titleInputRef} bind:value={changes.title} placeholder="제목을 입력하세요" />
						</InputGroup>
						<InputGroup>
							<InputGroupAddon align="inline-start">
								<IconSortDescending class="size-4" />
							</InputGroupAddon>
							<InputGroupInput type="number" bind:value={changes.display_order_in_scenario} />
						</InputGroup>
					</div>
					<div class="flex justify-between">
						<Button
							type="button"
							variant="ghost"
							onclick={onclickPublish}
							disabled={isPublishing}
						>
							{isPublished ? '작업중으로 전환' : '공개로 전환'}
						</Button>
						<div class="flex gap-2">
							<Button type="button" variant="outline" onclick={onclickCancel} disabled={isUpdating}>
								취소
							</Button>
							<Button type="submit" disabled={isUpdating}>
								{isUpdating ? '저장 중...' : '저장'}
							</Button>
						</div>
					</div>
				</form>
			{/if}
		</CardContent>
	</Card>
</Panel>
