<script lang="ts">
	import type { Character } from '$lib/types';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupButton,
		InputGroupInput,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { IconUser } from '@tabler/icons-svelte';
	import { useCharacter } from '$lib/hooks/use-character';

	interface Props {
		character: Character;
	}

	let { character }: Props = $props();

	const { admin } = useCharacter();

	let name = $state(character.name ?? '');

	async function updateName() {
		const trimmed = name.trim();
		if (trimmed === (character.name ?? '')) return;
		await admin.update(character.id, { name: trimmed || undefined });
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			updateName();
		}
	}
</script>

<div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
	<ButtonGroup></ButtonGroup>
	<InputGroup class="h-10">
		<InputGroupAddon>
			<InputGroupText>
				<IconUser class="size-4" />
			</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput bind:value={name} placeholder="캐릭터 이름" {onkeydown} />
		<InputGroupAddon align="inline-end">
			<InputGroupButton onclick={updateName} variant="secondary" class="h-7">저장</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>
</div>
