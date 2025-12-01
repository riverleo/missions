<script lang="ts">
	import type { Narrative as NarrativeType } from '$lib/components/app/narrative/store';
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
	import NarrativeCard from './narrative-card.svelte';

	interface Props {
		narratives: Record<string, NarrativeType>;
		onChange?: () => void;
	}

	let { narratives = $bindable({}), onChange }: Props = $props();

	let focusedNarrativeId = $state<string | undefined>(undefined);

	// Create node function
	function createNarrative(): string {
		const id = crypto.randomUUID();
		const newNode: NarrativeType = {
			id,
			speaker: '',
			message: '',
			root: false,
			type: 'text',
			diceRoll: {
				difficultyClass: 0,
				silent: true,
				success: { type: 'terminate' },
				failure: { type: 'terminate' },
			},
		};

		narratives = { ...narratives, [id]: newNode };
		onChange?.();
		return id;
	}

	// Set context with getters/setters
	setContext({
		get narratives() {
			return narratives;
		},
		set narratives(value) {
			narratives = value;
			onChange?.();
		},
		get focusedNarrativeId() {
			return focusedNarrativeId;
		},
		set focusedNarrativeId(value) {
			focusedNarrativeId = value;
		},
		createNarrative,
	});

	// Create new node
	function createRootNarrative() {
		const id = crypto.randomUUID();
		const newNode: NarrativeType = {
			id,
			speaker: '',
			message: '',
			root: true,
			type: 'text',
			diceRoll: {
				difficultyClass: 0,
				silent: true,
				success: { type: 'terminate' },
				failure: { type: 'terminate' },
			},
		};

		narratives = { ...narratives, [id]: newNode };
		onChange?.();
	}
</script>

{#if Object.keys(narratives).length === 0}
	<Empty>
		<EmptyHeader>
			<EmptyTitle>대화가 없습니다</EmptyTitle>
			<EmptyDescription>첫번째 대화를 생성하여 시작하세요</EmptyDescription>
		</EmptyHeader>
		<EmptyContent>
			<Button onclick={createRootNarrative}>
				<IconPlus class="size-4" />
				첫번째 대화 만들기
			</Button>
		</EmptyContent>
	</Empty>
{:else}
	<div class="grid grid-cols-4 gap-4 p-4">
		{#each Object.values(narratives) as node (node.id)}
			<NarrativeCard narrativeId={node.id} />
		{/each}
	</div>
{/if}
