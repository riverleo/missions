<script lang="ts">
	import { useNarrative } from '$lib/hooks/use-narrative';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Kbd } from '$lib/components/ui/kbd';
	import { bindStackEvent, type StackId } from '$lib/shortcut/store';
	import { isEnterOrSpace } from '$lib/shortcut/utils';

	const stackId: StackId = 'narrative';

	const { play } = useNarrative();
	const playStore = play.store;

	// 텍스트를 문자 배열로 변환 (공백 포함)
	const messageCharacters = $derived($playStore.narrativeNode?.title?.split('') ?? []);

	$effect(() => {
		return bindStackEvent({
			id: stackId,
			onkeyup: (event: KeyboardEvent) => {
				if ($playStore.narrativeNode?.type !== 'text') return;

				if (isEnterOrSpace(event)) {
					play.next();
				}
			},
		});
	});
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

<div class="mt-10 flex flex-col items-center gap-8 px-8">
	<Button
		variant="ghost"
		data-shortcut-key="Space Enter"
		data-shortcut-effect="bounce"
		data-shortcut-stack={stackId}
		onclick={() => play.next()}
	>
		다음
		<Kbd>Space</Kbd>
	</Button>
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
</style>
