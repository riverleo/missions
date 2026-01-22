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
		InputGroupText,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { IconHeading } from '@tabler/icons-svelte';
	import { useCharacter } from '$lib/hooks/use-character';

	const { needStore, needDialogStore, closeNeedDialog, admin } = useCharacter();

	const open = $derived($needDialogStore?.type === 'update');
	const needId = $derived($needDialogStore?.type === 'update' ? $needDialogStore.needId : undefined);
	const currentNeed = $derived(needId ? $needStore.data[needId] : undefined);

	let name = $state('');
	let maxValue = $state(100);
	let initialValue = $state(100);
	let decreasePerTick = $state(0);
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && currentNeed) {
			name = currentNeed.name;
			maxValue = currentNeed.max_value;
			initialValue = currentNeed.initial_value;
			decreasePerTick = currentNeed.decrease_per_tick;
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeNeedDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!needId || !name.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.updateNeed(needId, {
				name: name.trim(),
				max_value: maxValue,
				initial_value: initialValue,
				decrease_per_tick: decreasePerTick,
			})
			.then(() => {
				closeNeedDialog();
			})
			.catch((error) => {
				console.error('Failed to update need:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>욕구 수정</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<IconHeading class="size-4" />
					</InputGroupAddon>
					<InputGroupInput placeholder="이름" bind:value={name} />
				</InputGroup>
				<div class="flex gap-2">
					<InputGroup>
						<InputGroupAddon align="inline-start">
							<InputGroupText>기본</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput type="number" bind:value={initialValue} />
					</InputGroup>
					<InputGroup>
						<InputGroupAddon align="inline-start">
							<InputGroupText>최대</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput type="number" bind:value={maxValue} />
					</InputGroup>
				</div>
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<Tooltip>
							<TooltipTrigger>
								{#snippet child({ props })}
									<InputGroupButton {...props} variant="ghost">틱당 감소</InputGroupButton>
								{/snippet}
							</TooltipTrigger>
							<TooltipContent>게임 틱(tick)당 감소하는 욕구 수치입니다</TooltipContent>
						</Tooltip>
					</InputGroupAddon>
					<InputGroupInput type="number" step="0.01" bind:value={decreasePerTick} />
				</InputGroup>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '수정 중...' : '수정하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
