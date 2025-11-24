<script lang="ts">
	import type { DialogNode as DialogNodeType } from '$lib/components/app/dialog-node/store';
	import { Button } from '$lib/components/ui/button';
	import {
		Empty,
		EmptyHeader,
		EmptyTitle,
		EmptyDescription,
		EmptyContent,
	} from '$lib/components/ui/empty';
	import { setContext } from './context';
	import IconPlus from '@tabler/icons-svelte/icons/plus';
	import DialogNodeCard from './dialog-node-card.svelte';

	interface Props {
		dialogNodes: Record<string, DialogNodeType>;
		onChange?: () => void;
	}

	let { dialogNodes = $bindable({}), onChange }: Props = $props();

	let focusedDialogNodeId = $state<string | undefined>(undefined);

	// Create node function
	function createDialogNode(): string {
		const id = crypto.randomUUID();
		const newNode: DialogNodeType = {
			id,
			speaker: '',
			text: '',
			root: false,
			type: 'narrative',
			diceRoll: {
				difficultyClass: 10,
				silent: false,
				success: { type: 'terminate' },
				failure: { type: 'terminate' },
			},
		};

		dialogNodes = { ...dialogNodes, [id]: newNode };
		onChange?.();
		return id;
	}

	// Set context with getters/setters
	setContext({
		get dialogNodes() {
			return dialogNodes;
		},
		set dialogNodes(value) {
			dialogNodes = value;
			onChange?.();
		},
		get focusedDialogNodeId() {
			return focusedDialogNodeId;
		},
		set focusedDialogNodeId(value) {
			focusedDialogNodeId = value;
		},
		createDialogNode,
	});

	// Create new node
	function createRootDialogNode() {
		const id = crypto.randomUUID();
		const newNode: DialogNodeType = {
			id,
			speaker: '',
			text: '',
			root: true,
			type: 'narrative',
			diceRoll: {
				difficultyClass: 0,
				silent: false,
				success: { type: 'terminate' },
				failure: { type: 'terminate' },
			},
		};

		dialogNodes = { ...dialogNodes, [id]: newNode };
		onChange?.();
	}
</script>

{#if Object.keys(dialogNodes).length === 0}
	<Empty>
		<EmptyHeader>
			<EmptyTitle>다이얼로그 노드가 없습니다</EmptyTitle>
			<EmptyDescription>첫 번째 다이얼로그 노드를 생성하여 시작하세요</EmptyDescription>
		</EmptyHeader>
		<EmptyContent>
			<Button onclick={createRootDialogNode}>
				<IconPlus class="size-4" />
				첫번째 다이얼로그 만들기
			</Button>
		</EmptyContent>
	</Empty>
{:else}
	<div class="grid grid-cols-4 gap-4 p-4">
		{#each Object.values(dialogNodes) as node (node.id)}
			<DialogNodeCard nodeId={node.id} />
		{/each}
	</div>
{/if}
