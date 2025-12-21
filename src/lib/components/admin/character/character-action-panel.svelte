<script lang="ts">
	import type { Character } from '$lib/types';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupButton,
		InputGroupInput,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { IconHeading } from '@tabler/icons-svelte';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useCharacterBody } from '$lib/hooks/use-character-body';

	interface Props {
		character: Character;
	}

	let { character }: Props = $props();

	const { admin } = useCharacter();
	const { store: bodyStore } = useCharacterBody();

	const bodies = $derived(Object.values($bodyStore.data));

	let name = $state(character.name ?? '');

	const selectedBodyLabel = $derived(
		character.body_id
			? (bodies.find((b) => b.id === character.body_id)?.name ?? '몸통 선택')
			: '몸통 선택'
	);

	async function updateName() {
		const trimmed = name.trim();
		if (trimmed === (character.name ?? '')) return;
		await admin.update(character.id, { name: trimmed || undefined });
	}

	async function onBodyChange(value: string | undefined) {
		if (!value || value === character.body_id) return;
		await admin.update(character.id, { body_id: value });
	}

	function onkeydownName(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			updateName();
		}
	}
</script>

<div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
	<InputGroup>
		<InputGroupAddon>
			<InputGroupText>
				<IconHeading class="size-4" />
			</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput bind:value={name} placeholder="캐릭터 이름" onkeydown={onkeydownName} />
		<InputGroupAddon align="inline-end">
			<InputGroupButton onclick={updateName} variant="ghost">저장</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>
	<ButtonGroup>
		<ButtonGroupText class="whitespace-nowrap">몸통</ButtonGroupText>
		<Select type="single" value={character.body_id} onValueChange={onBodyChange}>
			<SelectTrigger class="min-w-40">
				{selectedBodyLabel}
			</SelectTrigger>
			<SelectContent>
				{#each bodies as body (body.id)}
					<SelectItem value={body.id}>
						{body.name || `이름없음 (${body.id.split('-')[0]})`}
					</SelectItem>
				{/each}
			</SelectContent>
		</Select>
	</ButtonGroup>
</div>
