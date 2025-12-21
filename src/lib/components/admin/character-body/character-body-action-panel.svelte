<script lang="ts">
	import type { CharacterBody } from '$lib/types';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupButton,
		InputGroupInput,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconEye, IconEyeOff, IconHeading, IconRuler2, IconX } from '@tabler/icons-svelte';
	import { useCharacterBody } from '$lib/hooks/use-character-body';

	interface Props {
		body: CharacterBody;
	}

	let { body }: Props = $props();

	const { admin } = useCharacterBody();
	const { uiStore } = admin;

	let name = $state(body.name ?? '');
	let width = $state(body.width === 0 ? '' : body.width.toString());
	let height = $state(body.height === 0 ? '' : body.height.toString());

	// body prop 변경 시 상태 동기화
	$effect(() => {
		width = body.width === 0 ? '' : body.width.toString();
	});
	$effect(() => {
		height = body.height === 0 ? '' : body.height.toString();
	});

	async function updateName() {
		const trimmed = name.trim();
		if (trimmed === (body.name ?? '')) return;
		await admin.update(body.id, { name: trimmed || undefined });
	}

	async function updateSize() {
		const newWidth = parseFloat(width) || 0;
		const newHeight = parseFloat(height) || 0;
		if (newWidth === body.width && newHeight === body.height) return;
		await admin.update(body.id, { width: newWidth, height: newHeight });
	}

	function onkeydownName(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			updateName();
		}
	}

	function onkeydownSize(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			updateSize();
		}
	}

	function toggleShowBodyPreview() {
		admin.setShowBodyPreview(!$uiStore.showBodyPreview);
	}
</script>

<div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
	<InputGroup>
		<InputGroupAddon>
			<InputGroupText>
				<IconHeading class="size-4" />
			</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput bind:value={name} placeholder="바디 이름" onkeydown={onkeydownName} />
		<InputGroupAddon align="inline-end">
			<InputGroupButton onclick={updateName} variant="ghost">저장</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>
	<InputGroup>
		<InputGroupAddon>
			<InputGroupText>
				<IconRuler2 class="size-4" />
			</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput
			bind:value={width}
			type="number"
			class="w-16"
			placeholder="넓이"
			onkeydown={onkeydownSize}
		/>
		<InputGroupText><IconX /></InputGroupText>
		<InputGroupInput
			bind:value={height}
			type="number"
			class="w-16"
			placeholder="높이"
			onkeydown={onkeydownSize}
		/>
		<InputGroupAddon align="inline-end">
			<Tooltip>
				<TooltipTrigger>
					<InputGroupButton
						onclick={toggleShowBodyPreview}
						variant={$uiStore.showBodyPreview ? 'secondary' : 'ghost'}
					>
						{#if $uiStore.showBodyPreview}
							<IconEye />
						{:else}
							<IconEyeOff />
						{/if}
					</InputGroupButton>
				</TooltipTrigger>
				<TooltipContent>크기 확인하기</TooltipContent>
			</Tooltip>
			<InputGroupButton onclick={updateSize} variant="ghost">저장</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>
</div>
