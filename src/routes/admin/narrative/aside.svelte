<script lang="ts">
	import type { Narrative } from '$lib/components/app/narrative/store';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import {
		Empty,
		EmptyHeader,
		EmptyTitle,
		EmptyDescription,
		EmptyContent,
	} from '$lib/components/ui/empty';
	import {
		AlertDialog,
		AlertDialogTrigger,
		AlertDialogContent,
		AlertDialogHeader,
		AlertDialogTitle,
		AlertDialogFooter,
		AlertDialogAction,
		AlertDialogCancel,
	} from '$lib/components/ui/alert-dialog';
	import IconPlus from '@tabler/icons-svelte/icons/plus';
	import IconTrash from '@tabler/icons-svelte/icons/trash';
	import IconEdit from '@tabler/icons-svelte/icons/edit';
	import IconCheck from '@tabler/icons-svelte/icons/check';
	import IconX from '@tabler/icons-svelte/icons/x';

	interface DialogRoot {
		id: string;
		name: string;
		narratives: Record<string, Narrative>;
	}

	interface Props {
		dialogRoots: DialogRoot[];
		selectedRootId: string | null;
		onChange?: (roots: DialogRoot[], selectedId: string | null) => void;
	}

	let { dialogRoots = $bindable([]), selectedRootId = $bindable(null), onChange }: Props = $props();

	let newRootName = $state('');
	let isCreateDialogOpen = $state(false);
	let deleteDialogOpenId = $state<string | null>(null);
	let editingRootId = $state<string | null>(null);
	let editingValue = $state('');
	let createInputRef: HTMLInputElement | null = $state(null);

	$effect(() => {
		if (isCreateDialogOpen && createInputRef) {
			setTimeout(() => createInputRef?.focus(), 0);
		}
	});

	function notifyChange() {
		onChange?.(dialogRoots, selectedRootId);
	}

	function handleSelect(id: string) {
		selectedRootId = id;
		notifyChange();
	}

	function handleCreate() {
		if (!newRootName.trim()) return;

		const newRoot: DialogRoot = {
			id: crypto.randomUUID(),
			name: newRootName.trim(),
			narratives: {},
		};

		dialogRoots = [...dialogRoots, newRoot];
		selectedRootId = newRoot.id;
		newRootName = '';
		isCreateDialogOpen = false;
		notifyChange();
	}

	function startEdit(id: string, name: string) {
		editingRootId = id;
		editingValue = name;
	}

	function cancelEdit() {
		editingRootId = null;
		editingValue = '';
	}

	function saveEdit() {
		if (!editingRootId || !editingValue.trim()) {
			cancelEdit();
			return;
		}

		dialogRoots = dialogRoots.map((root) =>
			root.id === editingRootId ? { ...root, name: editingValue.trim() } : root
		);
		editingRootId = null;
		editingValue = '';
		notifyChange();
	}

	function handleDelete(id: string) {
		dialogRoots = dialogRoots.filter((root) => root.id !== id);
		if (selectedRootId === id) {
			selectedRootId = dialogRoots.length > 0 ? dialogRoots[0].id : null;
		}
		deleteDialogOpenId = null;
		notifyChange();
	}
</script>

<div class="flex w-64 flex-col border-r">
	<div class="flex items-center justify-between border-b p-4">
		<h2 class="font-semibold">다이얼로그</h2>
		<AlertDialog bind:open={isCreateDialogOpen}>
			<AlertDialogTrigger>
				{#snippet child({ props })}
					<Button {...props} size="icon" variant="ghost">
						<IconPlus class="size-4" />
					</Button>
				{/snippet}
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>새 다이얼로그 생성</AlertDialogTitle>
				</AlertDialogHeader>
				<Input
					bind:ref={createInputRef}
					bind:value={newRootName}
					placeholder="다이얼로그 이름"
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							handleCreate();
							isCreateDialogOpen = false;
						}
					}}
				/>
				<AlertDialogFooter>
					<AlertDialogCancel>취소</AlertDialogCancel>
					<AlertDialogAction onclick={handleCreate}>생성</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	</div>

	<ScrollArea class="flex-1">
		<div class="flex flex-col gap-1 p-2">
			{#each dialogRoots as root (root.id)}
				<div class="flex items-center gap-1">
					{#if editingRootId === root.id}
						<Input
							bind:value={editingValue}
							class="flex-1"
							onkeydown={(e) => {
								if (e.key === 'Enter') saveEdit();
								if (e.key === 'Escape') cancelEdit();
							}}
							autofocus
						/>
						<div class="flex">
							<Button size="icon" variant="ghost" class="size-8" onclick={saveEdit}>
								<IconCheck class="size-4" />
							</Button>
							<Button size="icon" variant="ghost" class="size-8" onclick={cancelEdit}>
								<IconX class="size-4" />
							</Button>
						</div>
					{:else}
						<Button
							variant="ghost"
							class="flex-1 justify-start truncate"
							onclick={() => handleSelect(root.id)}
						>
							{root.name}
						</Button>
						<div class="flex">
							<Button
								size="icon"
								variant="ghost"
								class="size-8"
								onclick={() => startEdit(root.id, root.name)}
								title="이름 변경"
							>
								<IconEdit class="size-4" />
							</Button>
							<AlertDialog open={deleteDialogOpenId === root.id}>
								<AlertDialogTrigger>
									{#snippet child({ props })}
										<Button
											{...props}
											size="icon"
											variant="ghost"
											class="size-8"
											onclick={() => (deleteDialogOpenId = root.id)}
											title="삭제"
										>
											<IconTrash class="size-4" />
										</Button>
									{/snippet}
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel onclick={() => (deleteDialogOpenId = null)}>
											취소
										</AlertDialogCancel>
										<AlertDialogAction onclick={() => handleDelete(root.id)}>
											삭제
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</ScrollArea>
</div>
