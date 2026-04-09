<script lang="ts">
	import { useCharacter } from '$lib/hooks';
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
	import { getCharacterBodyStateString } from '$lib/utils/label';

	interface Props {
		character: Character;
	}

	let { character }: Props = $props();

	const { admin } = useCharacter();

	const bodyStateTypes: CharacterBodyStateType[] = ['idle', 'walk', 'run', 'jump', 'pick'];

	const uiStore = admin.characterUiStore;
	const previewBodyStateType = $derived($uiStore.previewBodyStateType);
	const selectedBodyStateLabel = $derived(getCharacterBodyStateString(previewBodyStateType));

	let faceScale = $state(character.face_scale.toString());

	// character prop 변경 시 상태 동기화
	$effect(() => {
		faceScale = character.face_scale.toString();
	});

	async function updateFaceScale() {
		const newFaceScale = parseFloat(faceScale) || 1.0;
		if (newFaceScale === character.face_scale) return;
		await admin.updateCharacter(character.id, { face_scale: newFaceScale });
	}

	function onkeydownFaceScale(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			updateFaceScale();
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
						{getCharacterBodyStateString(stateType)}
					</SelectItem>
				{/each}
			</SelectContent>
		</Select>
	</ButtonGroup>
	<InputGroup>
		<InputGroupAddon align="inline-start">
			<InputGroupText>페이스 스케일</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput
			bind:value={faceScale}
			type="number"
			step="0.01"
			min="0"
			onkeydown={onkeydownFaceScale}
		/>
		<InputGroupAddon align="inline-end">
			<InputGroupText>배</InputGroupText>
		</InputGroupAddon>
		<InputGroupAddon align="inline-end">
			<InputGroupButton onclick={updateFaceScale} variant="ghost">저장</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>
</div>
