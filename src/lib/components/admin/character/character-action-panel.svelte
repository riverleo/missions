<script lang="ts">
	import type { Character, CharacterBodyStateType } from '$lib/types';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupInput,
		InputGroupText,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import { useCharacter } from '$lib/hooks/use-character';
	import { getCharacterBodyStateLabel } from '$lib/utils/state-label';

	interface Props {
		character: Character;
	}

	let { character }: Props = $props();

	const { admin } = useCharacter();

	const bodyStateTypes: CharacterBodyStateType[] = ['idle', 'walk', 'run', 'jump'];

	const uiStore = admin.uiStore;
	const previewBodyStateType = $derived($uiStore.previewBodyStateType);
	const selectedBodyStateLabel = $derived(getCharacterBodyStateLabel(previewBodyStateType));

	let scale = $state(character.scale.toString());

	// character prop 변경 시 상태 동기화
	$effect(() => {
		scale = character.scale.toString();
	});

	async function updateScale() {
		const newScale = parseFloat(scale) || 1.0;
		if (newScale === character.scale) return;
		await admin.update(character.id, { scale: newScale });
	}

	function onkeydownScale(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			updateScale();
		}
	}

	function onBodyStateChange(value: string | undefined) {
		if (value) {
			admin.setPreviewBodyStateType(value as CharacterBodyStateType);
		}
	}
</script>

<div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
	<ButtonGroup>
		<ButtonGroupText class="whitespace-nowrap">바디 상태</ButtonGroupText>
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
	<InputGroup>
		<InputGroupAddon align="inline-start">
			<InputGroupText>스케일</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput
			bind:value={scale}
			type="number"
			step="0.01"
			min="0"
			onkeydown={onkeydownScale}
		/>
		<InputGroupAddon align="inline-end">
			<InputGroupText>배</InputGroupText>
		</InputGroupAddon>
		<InputGroupAddon align="inline-end">
			<InputGroupButton onclick={updateScale} variant="ghost">저장</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>
</div>
