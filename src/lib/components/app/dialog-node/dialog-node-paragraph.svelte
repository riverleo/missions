<script lang="ts">
	interface Props {
		text: string;
	}

	let { text }: Props = $props();

	// 텍스트를 문자 배열로 변환 (공백 포함)
	const chars = $derived(text.split(''));
</script>

{#key text}
	<p class="inline-flex flex-wrap justify-center text-4xl font-bold">
		{#each chars as char, index (index)}
			{#if char === ' '}
				<span class="inline-block w-4"></span>
			{:else}
				<span class="inline-block" style="animation-delay: {index * 15}ms;">
					{char}
				</span>
			{/if}
		{/each}
	</p>
{/key}

<style>
	span {
		animation: split-flap-in 100ms cubic-bezier(0.2, 0, 0.1, 1) both;
		transform-origin: center;
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
</style>
