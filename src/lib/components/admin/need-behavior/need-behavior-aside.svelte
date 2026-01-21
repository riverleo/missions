<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconInputSearch, IconPlus, IconEditCircle, IconTrash } from '@tabler/icons-svelte';
	import { page } from '$app/state';
	import { useNeedBehavior } from '$lib/hooks/use-need-behavior';
	import type { NeedBehaviorId } from '$lib/types';
	import NeedBehaviorCommand from './need-behavior-command.svelte';
	import NeedBehaviorCreateDialog from './need-behavior-create-dialog.svelte';
	import NeedBehaviorUpdateDialog from './need-behavior-update-dialog.svelte';
	import NeedBehaviorDeleteDialog from './need-behavior-delete-dialog.svelte';

	const { openDialog } = useNeedBehavior();
	const currentBehaviorId = $derived(page.params.behaviorId);

	let toggleValue = $state<string[]>(['list']);
</script>

<aside class="absolute top-4 left-4 z-10 flex w-80 flex-col gap-2">
	<ButtonGroup class="w-full justify-between">
		<ButtonGroup>
			<ToggleGroup type="multiple" variant="outline" bind:value={toggleValue}>
				<Tooltip>
					<TooltipTrigger>
						{#snippet child({ props })}
							<ToggleGroupItem {...props} value="list" class="size-9 px-0">
								<IconInputSearch class="size-4" />
							</ToggleGroupItem>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>목록 {toggleValue.includes('list') ? '숨기기' : '보기'}</TooltipContent>
				</Tooltip>
			</ToggleGroup>
			<ButtonGroup>
				<Tooltip>
					<TooltipTrigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								size="icon"
								onclick={() => openDialog({ type: 'create' })}
							>
								<IconPlus class="size-4" />
							</Button>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>새로운 욕구 행동 생성</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								size="icon"
								disabled={!currentBehaviorId}
								onclick={() =>
									currentBehaviorId &&
									openDialog({
										type: 'update',
										needBehaviorId: currentBehaviorId as NeedBehaviorId,
									})}
							>
								<IconEditCircle class="size-4" />
							</Button>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>욕구 행동 수정</TooltipContent>
				</Tooltip>
			</ButtonGroup>
		</ButtonGroup>
		<ButtonGroup>
			<Tooltip>
				<TooltipTrigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="outline"
							size="icon"
							disabled={!currentBehaviorId}
							onclick={() =>
								currentBehaviorId &&
								openDialog({ type: 'delete', needBehaviorId: currentBehaviorId as NeedBehaviorId })}
						>
							<IconTrash class="size-4" />
						</Button>
					{/snippet}
				</TooltipTrigger>
				<TooltipContent>행동 삭제</TooltipContent>
			</Tooltip>
		</ButtonGroup>
	</ButtonGroup>

	{#if toggleValue.includes('list')}
		<NeedBehaviorCommand />
	{/if}
</aside>

<NeedBehaviorCreateDialog />
<NeedBehaviorUpdateDialog />
<NeedBehaviorDeleteDialog />
