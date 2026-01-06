<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupButton,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { IconX } from '@tabler/icons-svelte';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuRadioGroup,
		DropdownMenuRadioItem,
	} from '$lib/components/ui/dropdown-menu';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { IconListNumbers } from '@tabler/icons-svelte';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useNeed } from '$lib/hooks/use-need';
	import type { CharacterFaceStateId, NeedId } from '$lib/types';

	const { faceStateStore, admin, faceStateDialogStore, closeFaceStateDialog } = useCharacter();
	const { needStore } = useNeed();

	const open = $derived($faceStateDialogStore?.type === 'update');
	const characterFaceStateId = $derived(
		$faceStateDialogStore?.type === 'update'
			? $faceStateDialogStore.characterFaceStateId
			: undefined
	);

	// Find the face state from all character face states
	const faceState = $derived.by(() => {
		if (!characterFaceStateId) return undefined;
		for (const states of Object.values($faceStateStore.data)) {
			const state = states.find((s) => s.id === characterFaceStateId);
			if (state) return state;
		}
		return undefined;
	});

	const needs = $derived(Object.values($needStore.data));

	let needId = $state<string>('');

	const selectedNeed = $derived.by(() => {
		if (!needId) return null;
		return needs.find((n) => n.id === needId);
	});
	let minValue = $state('');
	let maxValue = $state('');
	let priority = $state('');
	let offsetX = $state('');
	let offsetY = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && faceState) {
			needId = faceState.need_id ?? '';
			minValue = faceState.min_value.toString();
			maxValue = faceState.max_value.toString();
			priority = faceState.priority.toString();
			offsetX = faceState.offset_x?.toString() ?? '0';
			offsetY = faceState.offset_y?.toString() ?? '0';
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeFaceStateDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!characterFaceStateId || !faceState || isSubmitting) return;

		isSubmitting = true;

		const min = parseFloat(minValue) || 0;
		const max = parseFloat(maxValue) || 100;
		const prio = parseInt(priority) || 0;
		const offX = parseInt(offsetX) || 0;
		const offY = parseInt(offsetY) || 0;

		admin
			.updateCharacterFaceState(
				characterFaceStateId as CharacterFaceStateId,
				faceState.character_id,
				{
					need_id: needId ? (needId as NeedId) : null,
					min_value: min,
					max_value: max,
					priority: prio,
					offset_x: offX,
					offset_y: offY,
				}
			)
			.then(() => {
				closeFaceStateDialog();
			})
			.catch((error) => {
				console.error('Failed to update character face state:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>얼굴 상태 수정</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<Tooltip>
							<TooltipTrigger>
								{#snippet child({ props: tooltipProps })}
									<DropdownMenu>
										<DropdownMenuTrigger>
											{#snippet child({ props })}
												<InputGroupButton {...tooltipProps} {...props}>
													{selectedNeed?.name ?? '욕구 선택'}
												</InputGroupButton>
											{/snippet}
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											<DropdownMenuRadioGroup bind:value={needId}>
												{#each needs as need (need.id)}
													<DropdownMenuRadioItem value={need.id}>
														{need.name}
													</DropdownMenuRadioItem>
												{/each}
											</DropdownMenuRadioGroup>
										</DropdownMenuContent>
									</DropdownMenu>
								{/snippet}
							</TooltipTrigger>
							<TooltipContent>이 상태가 활성화되는 욕구를 선택합니다</TooltipContent>
						</Tooltip>
					</InputGroupAddon>
					<InputGroupInput placeholder="최소" type="number" step="0.1" bind:value={minValue} />
					<InputGroupText>~</InputGroupText>
					<InputGroupInput placeholder="최대" type="number" step="0.1" bind:value={maxValue} />
					<InputGroupAddon align="inline-end">
						{#if selectedNeed}
							<InputGroupText>최대 {selectedNeed.max_value}</InputGroupText>
						{/if}
					</InputGroupAddon>
				</InputGroup>

				<InputGroup>
					<InputGroupAddon align="inline-start">
						<Tooltip>
							<TooltipTrigger>
								{#snippet child({ props })}
									<InputGroupButton {...props}>우선 순위</InputGroupButton>
								{/snippet}
							</TooltipTrigger>
							<TooltipContent>
								여러 욕구가 동시에 만족될 때 높은 우선 순위를 가진 상태가 먼저 적용됩니다
							</TooltipContent>
						</Tooltip>
					</InputGroupAddon>
					<InputGroupInput placeholder="우선 순위" type="number" bind:value={priority} />
				</InputGroup>

				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>오프셋</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput type="number" bind:value={offsetX} placeholder="x" />
					<InputGroupText>
						<IconX class="size-3" />
					</InputGroupText>
					<InputGroupInput type="number" bind:value={offsetY} placeholder="y" />
				</InputGroup>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '저장 중...' : '저장'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
