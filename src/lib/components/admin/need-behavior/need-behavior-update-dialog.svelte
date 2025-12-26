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
	import { IconChevronDown } from '@tabler/icons-svelte';
	import { useNeedBehavior } from '$lib/hooks/use-need-behavior';
	import { useNeed } from '$lib/hooks/use-need';
	import { useCharacter } from '$lib/hooks/use-character';
	import { alphabetical } from 'radash';
	import type { NeedId, CharacterId } from '$lib/types';

	const { needBehaviorStore, dialogStore, closeDialog, admin } = useNeedBehavior();
	const { needStore } = useNeed();
	const { store: characterStore } = useCharacter();

	const open = $derived($dialogStore?.type === 'update');
	const needBehaviorId = $derived(
		$dialogStore?.type === 'update' ? $dialogStore.needBehaviorId : undefined
	);
	const currentBehavior = $derived(
		needBehaviorId ? $needBehaviorStore.data[needBehaviorId] : undefined
	);
	const needs = $derived(alphabetical(Object.values($needStore.data), (n) => n.name));
	const characters = $derived(alphabetical(Object.values($characterStore.data), (c) => c.name));

	let name = $state('');
	let needId = $state<string | undefined>(undefined);
	let needThreshold = $state(0);
	let characterId = $state<string | undefined>(undefined);
	let isSubmitting = $state(false);

	const selectedNeed = $derived(needs.find((n) => n.id === needId));
	const selectedNeedName = $derived(selectedNeed?.name ?? '욕구 선택');
	const selectedCharacter = $derived(characters.find((c) => c.id === characterId));
	const selectedCharacterName = $derived(selectedCharacter?.name ?? '모두');

	$effect(() => {
		if (open && currentBehavior) {
			name = currentBehavior.name;
			needId = currentBehavior.need_id;
			needThreshold = currentBehavior.need_threshold;
			characterId = currentBehavior.character_id ?? undefined;
		}
	});

	function onNeedChange(value: string) {
		needId = value || undefined;
	}

	function onCharacterChange(value: string | undefined) {
		characterId = value || undefined;
	}

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!needBehaviorId || !name.trim() || !needId || isSubmitting) return;

		isSubmitting = true;

		admin
			.update(needBehaviorId, {
				name: name.trim(),
				need_id: needId as NeedId,
				need_threshold: needThreshold,
				character_id: characterId as CharacterId | undefined,
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
			<div class="flex flex-col gap-2">
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<DropdownMenu>
							<DropdownMenuTrigger>
								{#snippet child({ props })}
									<InputGroupButton {...props} variant="ghost">
										{selectedCharacterName}
										<IconChevronDown class="size-4" />
									</InputGroupButton>
								{/snippet}
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start">
								<DropdownMenuRadioGroup value={characterId ?? ''} onValueChange={onCharacterChange}>
									<DropdownMenuRadioItem value="">모두</DropdownMenuRadioItem>
									{#each characters as character (character.id)}
										<DropdownMenuRadioItem value={character.id}>
											{character.name}
										</DropdownMenuRadioItem>
									{/each}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
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
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !needId || !name.trim()}>
					{isSubmitting ? '수정 중...' : '수정하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
