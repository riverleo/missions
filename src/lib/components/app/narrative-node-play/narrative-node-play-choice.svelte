<script lang="ts">
	import { useNarrative } from '$lib/hooks';
	import { cn } from '$lib/utils';
	import { bindStackEvent, type StackId } from '$lib/shortcut/store';
	import { isArrowUp, isArrowDown, isEnterOrSpace } from '$lib/shortcut/utils';

	const stackId: StackId = 'narrative';

	const { narrativeNodeChoiceStore, play } = useNarrative();
	const playStore = play.store;

	// 텍스트를 문자 배열로 변환 (공백 포함)
	const messageCharacters = $derived($playStore.narrativeNode?.title?.split('') ?? []);

	const narrativeNodeChoices = $derived(
		$playStore.narrativeNode
			? Object.values($narrativeNodeChoiceStore.data).filter(
					(c) => c.narrative_node_id === $playStore.narrativeNode!.id
				)
			: []
	);

	// 현재 포커스된 선택지 인덱스
	let focusedIndex = $state(0);

	// narrativeNodeChoices가 바뀌면 focusedIndex 리셋
	$effect(() => {
		if (narrativeNodeChoices.length > 0) {
			focusedIndex = 0;
		}
	});

	$effect(() =>
		bindStackEvent({
			id: stackId,
			onkeydown: (event: KeyboardEvent) => {
				if ($playStore.narrativeNode?.type !== 'choice') return;
				const length = narrativeNodeChoices.length;
				if (length === 0) return;

				if (isArrowUp(event)) {
					focusedIndex = (focusedIndex - 1 + length) % length;
				} else if (isArrowDown(event)) {
					focusedIndex = (focusedIndex + 1) % length;
				}
			},
			onkeyup: (event: KeyboardEvent) => {
				if ($playStore.narrativeNode?.type !== 'choice') return;

				if (isEnterOrSpace(event)) {
					const selectedChoice = narrativeNodeChoices[focusedIndex];
					if (selectedChoice !== undefined) {
						play.next(selectedChoice.id);
					}
				}
			},
		})
	);
</script>

{#key $playStore.narrativeNode?.title}
	<div class="relative text-white">
		<div
			class="background absolute top-4 left-0 -z-10 h-full w-full rounded-[40%] bg-black px-8 py-4 blur-lg"
		></div>
		<div class="flex flex-col items-center gap-2 px-8 py-4">
			<p class="inline-flex flex-wrap justify-center text-4xl leading-relaxed font-bold">
				{#each messageCharacters as character, index (index)}
					{#if character === ' '}
						<span class="inline-block w-3"></span>
					{:else}
						<span class="message-char inline-block" style="animation-delay: {index * 15}ms;">
							{character}
						</span>
					{/if}
				{/each}
			</p>
			{#if $playStore.narrativeNode?.description}
				<p class="description inline-flex flex-wrap justify-center">
					<span class="text-lg font-light opacity-60">
						{$playStore.narrativeNode.description}
					</span>
				</p>
			{/if}
		</div>
	</div>
{/key}

<div class="mt-10 flex flex-col items-center gap-3 px-8">
	{#each narrativeNodeChoices as narrativeNodeChoice, index (narrativeNodeChoice.id)}
		{@const focused = index === focusedIndex}
		<button
			data-shortcut-key={focused ? 'Space Enter' : undefined}
			data-shortcut-effect="bounce"
			data-shortcut-stack={stackId}
			onclick={() => play.next(narrativeNodeChoice.id)}
			class={cn('choice-button text-2xl blur-3xl', {
				'opacity-20': !focused,
			})}
			style="animation-delay: {index * 300}ms"
		>
			{narrativeNodeChoice.title}
		</button>
	{/each}
</div>

<style>
	.message-char {
		animation: split-flap-in 200ms cubic-bezier(0.2, 0, 0.1, 1) both;
		transform-origin: center;
	}

	.background,
	.description {
		animation: slide-up 400ms cubic-bezier(0.4, 0, 0.2, 1) both;
	}

	.background {
		animation-delay: 100ms;
	}

	.description {
		animation-delay: 100ms;
	}

	@keyframes split-flap-in {
		0% {
			transform: rotateX(-90deg);
		}
		30% {
			transform: rotateX(-45deg);
		}
		100% {
			transform: rotateX(0deg);
		}
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes blurIn {
		to {
			filter: blur(0);
		}
	}

	.choice-button {
		animation: blurIn 0.2s ease-out forwards;
	}
</style>
