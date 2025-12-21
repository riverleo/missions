<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import { InputGroup, InputGroupInput, InputGroupAddon } from '$lib/components/ui/input-group';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { IconHeading, IconCategory } from '@tabler/icons-svelte';
	import { useNeedBehavior } from '$lib/hooks/use-need-behavior';
	import { useNeed } from '$lib/hooks/use-need';
	import { alphabetical } from 'radash';

	const { dialogStore, closeDialog, admin } = useNeedBehavior();
	const { needStore } = useNeed();

	const open = $derived($dialogStore?.type === 'create');
	const needs = $derived(alphabetical(Object.values($needStore.data), (n) => n.name));

	let name = $state('');
	let needId = $state<string | undefined>(undefined);
	let needThreshold = $state(0);
	let isSubmitting = $state(false);

	const selectedNeedName = $derived(needs.find((n) => n.id === needId)?.name ?? '욕구 선택');

	$effect(() => {
		if (open) {
			name = '';
			needId = undefined;
			needThreshold = 0;
		}
	});

	function onNeedChange(value: string | undefined) {
		needId = value;
	}

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim() || !needId || isSubmitting) return;

		isSubmitting = true;

		admin
			.create({
				name: name.trim(),
				need_id: needId,
				need_threshold: needThreshold,
			})
			.then(() => {
				closeDialog();
			})
			.catch((error) => {
				console.error('Failed to create behavior:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>새로운 행동 생성</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<IconHeading class="size-4" />
				</InputGroupAddon>
				<InputGroupInput placeholder="이름" bind:value={name} />
			</InputGroup>
			<ButtonGroup class="w-full">
				<ButtonGroupText>
					<IconCategory class="size-4" />
				</ButtonGroupText>
				<Select type="single" value={needId} onValueChange={onNeedChange}>
					<SelectTrigger class="w-full">
						{selectedNeedName}
					</SelectTrigger>
					<SelectContent>
						{#each needs as need (need.id)}
							<SelectItem value={need.id}>{need.name}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</ButtonGroup>
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<span class="text-xs">임계값</span>
				</InputGroupAddon>
				<InputGroupInput
					type="number"
					placeholder="0"
					step="0.1"
					min="0"
					max="1"
					bind:value={needThreshold}
				/>
			</InputGroup>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !needId}>
					{isSubmitting ? '생성 중...' : '생성하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
