<script lang="ts">
	import { currentNarrativeNode, messageComplete } from './store';

	// 텍스트를 문자 배열로 변환 (공백 포함)
	const messageCharacters = $derived($currentNarrativeNode?.message.split(''));

	// 타이핑 애니메이션 완료 시간 계산
	const typingDuration = $derived(() => {
		const charCount = messageCharacters?.length || 0;
		return charCount * 15 + 200; // delay per char + animation duration
	});

	// 타이핑 완료 타이머 (완료 후 300ms 추가 대기)
	$effect(() => {
		if ($currentNarrativeNode) {
			const timer = setTimeout(() => {
				$messageComplete = true;
			}, typingDuration() + 300);

			return () => clearTimeout(timer);
		}
	});
</script>

{#key $currentNarrativeNode?.message}
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
			{#if $currentNarrativeNode?.description}
				<p class="description inline-flex flex-wrap justify-center">
					<span class="text-lg font-light opacity-60">{$currentNarrativeNode.description}</span>
				</p>
			{/if}
		</div>
	</div>
{/key}

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
