<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import IconSword from '@tabler/icons-svelte/icons/sword';
	import IconWand from '@tabler/icons-svelte/icons/wand';
	import IconBow from '@tabler/icons-svelte/icons/bow';
	import IconShield from '@tabler/icons-svelte/icons/shield';
	import IconBook from '@tabler/icons-svelte/icons/book';

	let {
		onBack,
		onNext,
	}: {
		onBack: () => void;
		onNext: () => void;
	} = $props();

	let selectedCharacter = $state<string | null>(null);
	let characterName = $state('');

	const characters = [
		{
			id: 'warrior',
			name: '전사',
			description: '강인한 체력과 근접 전투에 특화된 캐릭터입니다. 정면 돌파를 선호합니다.',
			icon: IconSword,
			color: 'text-red-500',
		},
		{
			id: 'mage',
			name: '마법사',
			description: '강력한 마법 공격으로 적을 제압합니다. 지혜와 마나가 핵심입니다.',
			icon: IconWand,
			color: 'text-purple-500',
		},
		{
			id: 'archer',
			name: '궁수',
			description: '빠른 이동 속도와 원거리 공격이 장점입니다. 민첩성이 뛰어납니다.',
			icon: IconBow,
			color: 'text-green-500',
		},
		{
			id: 'paladin',
			name: '성기사',
			description: '방어와 지원을 겸비한 균형잡힌 캐릭터입니다. 팀플레이에 최적화되어 있습니다.',
			icon: IconShield,
			color: 'text-blue-500',
		},
		{
			id: 'scholar',
			name: '학자',
			description: '지식과 전략으로 승부합니다. 다양한 버프와 디버프를 활용합니다.',
			icon: IconBook,
			color: 'text-yellow-500',
		},
	];
</script>

<div class="mx-auto max-w-4xl space-y-6">
	<div class="space-y-2">
		<h1 class="text-2xl font-bold">당신의 캐릭터를 선택하세요</h1>
		<p class="text-muted-foreground">각 캐릭터는 고유한 능력과 플레이 스타일을 가지고 있습니다</p>
	</div>

	<!-- Character Preview -->
	<div class="flex items-center justify-center rounded-lg border-2 border-dashed p-12">
		{#if selectedCharacter}
			{@const selected = characters.find((c) => c.id === selectedCharacter)}
			{#if selected}
				{@const Icon = selected.icon}
				<div class="flex flex-col items-center gap-4">
					<div
						class="flex size-32 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5"
					>
						<Icon class="size-20 {selected.color}" />
					</div>
					<div class="text-center">
						<h2 class="text-xl font-bold">
							{characterName || selected.name}
						</h2>
						<p class="text-sm text-muted-foreground">{selected.description}</p>
					</div>
				</div>
			{/if}
		{:else}
			<div class="text-center text-muted-foreground">
				<p>아래에서 캐릭터를 선택해주세요</p>
			</div>
		{/if}
	</div>

	<!-- Character Name Input -->
	<div class="mx-auto max-w-md space-y-2">
		<Label for="character-name">캐릭터 이름</Label>
		<Input
			id="character-name"
			type="text"
			placeholder="캐릭터 이름을 입력하세요"
			bind:value={characterName}
			maxlength={20}
		/>
		<p class="text-xs text-muted-foreground">최대 20자까지 입력 가능합니다</p>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each characters as character (character.id)}
			{@const Icon = character.icon}
			<button
				type="button"
				onclick={() => (selectedCharacter = character.id)}
				class="text-left transition-all"
			>
				<Card
					class={selectedCharacter === character.id
						? 'border-primary ring-2 ring-primary ring-offset-2'
						: 'hover:border-primary/50'}
				>
					<CardHeader>
						<div class="mb-4 flex size-16 items-center justify-center rounded-lg bg-primary/10">
							<Icon class="size-8 {character.color}" />
						</div>
						<CardTitle>{character.name}</CardTitle>
						<CardDescription>{character.description}</CardDescription>
					</CardHeader>
				</Card>
			</button>
		{/each}
	</div>

	<div class="flex justify-between">
		<Button variant="outline" onclick={onBack}>뒤로</Button>
		<Button onclick={onNext}>다음</Button>
	</div>
</div>
