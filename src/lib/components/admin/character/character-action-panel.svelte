<script lang="ts">
	import type { Character, CharacterBodyStateType } from '$lib/types';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { useCharacter } from '$lib/hooks/use-character';
	import { getCharacterBodyStateLabel } from '$lib/utils/state-label';

	interface Props {
		character: Character;
	}

	let { character }: Props = $props();

	const { admin } = useCharacter();

	const bodyStateTypes: CharacterBodyStateType[] = ['idle', 'walk', 'jump', 'eating', 'sleeping'];

	const uiStore = admin.uiStore;
	const previewBodyStateType = $derived($uiStore.previewBodyStateType);
	const selectedBodyStateLabel = $derived(getCharacterBodyStateLabel(previewBodyStateType));

	function onBodyStateChange(value: string | undefined) {
		if (value) {
			admin.setPreviewBodyStateType(value as CharacterBodyStateType);
		}
	}
</script>

<div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
	<ButtonGroup>
		<ButtonGroupText class="whitespace-nowrap">바디</ButtonGroupText>
		<Select type="single" value={previewBodyStateType} onValueChange={onBodyStateChange}>
			<SelectTrigger class="min-w-32">
				{selectedBodyStateLabel}
			</SelectTrigger>
			<SelectContent>
				{#each bodyStateTypes as stateType (stateType)}
					<SelectItem value={stateType}>
						{getCharacterBodyStateLabel(stateType)}
					</SelectItem>
				{/each}
			</SelectContent>
		</Select>
	</ButtonGroup>
</div>
