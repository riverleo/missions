<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconInputSearch, IconEditCircle, IconPlus, IconTrash } from '@tabler/icons-svelte';
	import { page } from '$app/state';
	import { useCharacter } from '$lib/hooks/use-character';
	import type { CharacterInteractionId } from '$lib/types';
	import CharacterInteractionCommand from './character-interaction-command.svelte';
	import CharacterInteractionCreateDialog from './character-interaction-create-dialog.svelte';
	import CharacterInteractionUpdateDialog from './character-interaction-update-dialog.svelte';
	import CharacterInteractionDeleteDialog from './character-interaction-delete-dialog.svelte';

	const { openCharacterInteractionDialog } = useCharacter();
	const currentInteractionId = $derived(page.params.characterInteractionId);

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
								onclick={() => openCharacterInteractionDialog({ type: 'create' })}
							>
								<IconPlus class="size-4" />
							</Button>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>새로운 캐릭터 상호작용</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								size="icon"
								disabled={!currentInteractionId}
								onclick={() =>
									currentInteractionId &&
									openCharacterInteractionDialog({
										type: 'update',
										interactionId: currentInteractionId as CharacterInteractionId,
									})}
							>
								<IconEditCircle class="size-4" />
							</Button>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>캐릭터 상호작용 수정</TooltipContent>
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
							disabled={!currentInteractionId}
							onclick={() =>
								currentInteractionId &&
								openCharacterInteractionDialog({
									type: 'delete',
									interactionId: currentInteractionId as CharacterInteractionId,
								})}
						>
							<IconTrash class="size-4" />
						</Button>
					{/snippet}
				</TooltipTrigger>
				<TooltipContent>캐릭터 상호작용 삭제</TooltipContent>
			</Tooltip>
		</ButtonGroup>
	</ButtonGroup>

	{#if toggleValue.includes('list')}
		<CharacterInteractionCommand />
	{/if}
</aside>

<CharacterInteractionCreateDialog />
<CharacterInteractionUpdateDialog />
<CharacterInteractionDeleteDialog />
