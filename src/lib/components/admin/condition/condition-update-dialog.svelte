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
	import { useCondition } from '$lib/hooks/use-condition';

	const { conditionStore, dialogStore, closeDialog, admin } = useCondition();

	const open = $derived($dialogStore?.type === 'update');
	const conditionId = $derived($dialogStore?.type === 'update' ? $dialogStore.conditionId : undefined);
	const currentCondition = $derived(conditionId ? $conditionStore.data[conditionId] : undefined);

	let name = $state('');
	let maxValue = $state(100);
	let initialValue = $state(100);
	let decreasePerTick = $state(0);
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && currentCondition) {
			name = currentCondition.name;
			maxValue = currentCondition.max_value;
			initialValue = currentCondition.initial_value;
			decreasePerTick = currentCondition.decrease_per_tick;
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!conditionId || !name.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.updateCondition(conditionId, {
				name: name.trim(),
				max_value: maxValue,
				initial_value: initialValue,
				decrease_per_tick: decreasePerTick,
			})
			.then(() => {
				closeDialog();
			})
			.catch((error) => {
				console.error('Failed to update condition:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>컨디션 수정</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<IconHeading class="size-4" />
				</InputGroupAddon>
				<InputGroupInput placeholder="이름" bind:value={name} />
			</InputGroup>
			<div class="flex gap-1">
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>최대</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput type="number" bind:value={maxValue} />
				</InputGroup>
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>기본</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput type="number" bind:value={initialValue} />
				</InputGroup>
			</div>
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<Tooltip>
						<TooltipTrigger>
							{#snippet child({ props })}
								<InputGroupButton {...props} variant="ghost">시간당 감소</InputGroupButton>
							{/snippet}
						</TooltipTrigger>
						<TooltipContent>
							게임 틱(tick)당 감소하는 컨디션 수치입니다
						</TooltipContent>
					</Tooltip>
				</InputGroupAddon>
				<InputGroupInput type="number" step="0.01" bind:value={decreasePerTick} />
			</InputGroup>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '수정 중...' : '수정하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
