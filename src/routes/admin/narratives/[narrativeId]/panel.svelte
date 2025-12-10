<script lang="ts">
	import { Panel } from '@xyflow/svelte';
	import { Button } from '$lib/components/ui/button';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import { useDiceRoll } from '$lib/hooks/use-dice-roll.svelte';
	import { page } from '$app/state';

	const narrativeId = $derived(page.params.narrativeId);
	const { admin } = useNarrative();
	const diceRoll = useDiceRoll();

	let isCreatingNode = $state(false);

	async function onclickCreateNode() {
		if (isCreatingNode || !narrativeId) return;

		isCreatingNode = true;

		try {
			// 먼저 dice_roll 생성
			const diceRollData = await diceRoll.create({
				difficulty_class: 10,
				success_action: 'narrative_node_done',
				failure_action: 'narrative_node_done',
			});

			// narrative_node 생성
			await admin.createNode({
				narrative_id: narrativeId,
				title: '새로운 노드',
				description: '',
				type: 'text',
				root: false,
				dice_roll_id: diceRollData.id,
			});
		} catch (error) {
			console.error('Failed to create narrative node:', error);
		} finally {
			isCreatingNode = false;
		}
	}
</script>

<Panel position="top-right">
	<div
		class="w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800"
	>
		<h3 class="mb-4 text-lg font-semibold">노드 관리</h3>
		<div class="space-y-2">
			<Button onclick={onclickCreateNode} disabled={isCreatingNode} class="w-full">
				{isCreatingNode ? '생성 중...' : '새로운 노드 추가'}
			</Button>
		</div>
	</div>
</Panel>
