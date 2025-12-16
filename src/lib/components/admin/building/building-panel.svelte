<script lang="ts">
	import type { Building } from '$lib/types';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupButton,
		InputGroupInput,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { IconBuilding } from '@tabler/icons-svelte';
	import { useBuilding } from '$lib/hooks/use-building';

	interface Props {
		building: Building;
	}

	let { building }: Props = $props();

	const { admin } = useBuilding();

	let name = $state(building.name ?? '');

	async function updateName() {
		const trimmed = name.trim();
		if (trimmed === (building.name ?? '')) return;
		await admin.update(building.id, { name: trimmed || undefined });
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
				<IconBuilding class="size-4" />
			</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput bind:value={name} placeholder="건물 이름" {onkeydown} />
		<InputGroupAddon align="inline-end">
			<InputGroupButton onclick={updateName} variant="secondary" class="h-7">저장</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>
</div>
