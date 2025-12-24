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
	import { IconChevronDown, IconHeading } from '@tabler/icons-svelte';
	import { useNeedBehavior } from '$lib/hooks/use-need-behavior';
	import { useNeed } from '$lib/hooks/use-need';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { alphabetical } from 'radash';
	import type { NeedId, ScenarioId } from '$lib/types';

	const { dialogStore, closeDialog, admin } = useNeedBehavior();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const { needStore } = useNeed();

	const open = $derived($dialogStore?.type === 'create');
	const needs = $derived(alphabetical(Object.values($needStore.data), (n) => n.name));

	let name = $state('');
	let needId = $state<string | undefined>(undefined);
	let needThreshold = $state(0);
	let isSubmitting = $state(false);

	const selectedNeed = $derived(needs.find((n) => n.id === needId));
	const selectedNeedName = $derived(selectedNeed?.name ?? '욕구 선택');

	$effect(() => {
		if (open) {
			name = '';
			needId = undefined;
			needThreshold = 0;
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
		if (!name.trim() || !needId || isSubmitting) return;

		isSubmitting = true;

		admin
			.create({
				name: name.trim(),
				need_id: needId as NeedId,
				need_threshold: needThreshold,
			})
			.then((behavior) => {
				closeDialog();
				goto(`/admin/scenarios/${scenarioId}/need-behaviors/${behavior.id}`);
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
					<IconHeading />
				</InputGroupAddon>
				<InputGroupInput placeholder="이름" bind:value={name} />
			</InputGroup>
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
				<InputGroupInput
					type="number"
					placeholder="0"
					step="1"
					min="0"
					max={selectedNeed?.max_value ?? 100}
					bind:value={needThreshold}
				/>
				<InputGroupAddon align="inline-end">
					<InputGroupText>/ {selectedNeed?.max_value ?? 100} 이하</InputGroupText>
				</InputGroupAddon>
			</InputGroup>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !needId}>
					{isSubmitting ? '생성 중...' : '생성하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
