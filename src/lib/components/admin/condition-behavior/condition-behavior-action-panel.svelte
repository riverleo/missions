<script lang="ts">
	import type { ConditionBehavior } from '$lib/types';
	import { Panel } from '@xyflow/svelte';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconLayoutDistributeHorizontal, IconPlus } from '@tabler/icons-svelte';
	import { useBehavior } from '$lib/hooks/use-behavior';

	interface Props {
		behavior: ConditionBehavior | undefined;
		onlayout?: () => void;
	}

	let { behavior, onlayout }: Props = $props();

	const { admin } = useBehavior();

	let isLayouting = $state(false);
	let isCreating = $state(false);

	function onclickLayout() {
		if (isLayouting || !onlayout) return;

		isLayouting = true;

		try {
			onlayout();
		} finally {
			isLayouting = false;
		}
	}

	async function onclickCreate() {
		if (isCreating || !behavior) return;

		isCreating = true;

		try {
			await admin.createConditionBehaviorAction({
				condition_id: behavior.condition_id,
				condition_behavior_id: behavior.id,
			});
		} catch (error) {
			console.error('Failed to create action:', error);
		} finally {
			isCreating = false;
		}
	}
</script>

<Panel position="bottom-center">
	<ButtonGroup>
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						onclick={onclickCreate}
						disabled={isCreating || !behavior}
						size="icon-lg"
						variant="outline"
					>
						<IconPlus />
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>액션 추가</TooltipContent>
		</Tooltip>
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						onclick={onclickLayout}
						disabled={isLayouting}
						size="icon-lg"
						variant="outline"
					>
						<IconLayoutDistributeHorizontal />
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>자동 정렬</TooltipContent>
		</Tooltip>
	</ButtonGroup>
</Panel>
