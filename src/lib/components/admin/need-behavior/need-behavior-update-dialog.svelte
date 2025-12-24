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
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuRadioGroup,
		DropdownMenuRadioItem,
	} from '$lib/components/ui/dropdown-menu';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { IconChevronDown } from '@tabler/icons-svelte';
	import { useNeedBehavior } from '$lib/hooks/use-need-behavior';
	import { useNeed } from '$lib/hooks/use-need';
	import { alphabetical } from 'radash';
	import type { NeedId } from '$lib/types';

	const { needBehaviorStore, dialogStore, closeDialog, admin } = useNeedBehavior();
	const { needStore } = useNeed();

	const open = $derived($dialogStore?.type === 'update');
	const behaviorId = $derived(
		$dialogStore?.type === 'update' ? $dialogStore.behaviorId : undefined
	);
	const currentBehavior = $derived(behaviorId ? $needBehaviorStore.data[behaviorId] : undefined);
	const needs = $derived(alphabetical(Object.values($needStore.data), (n) => n.name));

	let name = $state('');
	let needId = $state<string | undefined>(undefined);
	let needThreshold = $state(0);
	let isSubmitting = $state(false);

	const selectedNeed = $derived(needs.find((n) => n.id === needId));
	const selectedNeedName = $derived(selectedNeed?.name ?? '욕구 선택');

	$effect(() => {
		if (open && currentBehavior) {
			name = currentBehavior.name;
			needId = currentBehavior.need_id;
			needThreshold = currentBehavior.need_threshold;
		}
	});

	function onNeedChange(value: string) {
		needId = value || undefined;
	}

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!behaviorId || !name.trim() || !needId || isSubmitting) return;

		isSubmitting = true;

		admin
			.update(behaviorId, {
				name: name.trim(),
				need_id: needId as NeedId,
				need_threshold: needThreshold,
			})
			.then(() => {
				closeDialog();
			})
			.catch((error) => {
				console.error('Failed to update behavior:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>행동 수정</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<DropdownMenu>
						<DropdownMenuTrigger>
							{#snippet child({ props })}
								<InputGroupButton {...props} variant="ghost">
									{selectedNeedName}
									<IconChevronDown class="ml-1 size-4" />
								</InputGroupButton>
							{/snippet}
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							<DropdownMenuRadioGroup value={needId ?? ''} onValueChange={onNeedChange}>
								{#each needs as need (need.id)}
									<DropdownMenuRadioItem value={need.id}>{need.name}</DropdownMenuRadioItem>
								{/each}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</InputGroupAddon>
				<InputGroupInput placeholder="이름" bind:value={name} />
			</InputGroup>
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<Tooltip>
						<TooltipTrigger>
							{#snippet child({ props })}
								<InputGroupButton {...props} variant="ghost">임계값</InputGroupButton>
							{/snippet}
						</TooltipTrigger>
						<TooltipContent>욕구가 이 값 이하로 떨어지면 행동이 발동됩니다</TooltipContent>
					</Tooltip>
				</InputGroupAddon>
				<InputGroupInput
					type="number"
					placeholder="0"
					step="1"
					min="0"
					max={selectedNeed?.max_value ?? 100}
					bind:value={needThreshold}
				/>
				<InputGroupAddon align="inline-end">
					<InputGroupText>/ {selectedNeed?.max_value ?? 100}</InputGroupText>
				</InputGroupAddon>
			</InputGroup>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !needId}>
					{isSubmitting ? '수정 중...' : '수정하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
