<script lang="ts">
	import type { Terrain } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupButton,
		InputGroupInput,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import {
		IconUpload,
		IconLoader2,
		IconBug,
		IconBugOff,
		IconHeading,
		IconMapPin,
		IconMapPinOff,
	} from '@tabler/icons-svelte';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { uploadGameAsset } from '$lib/utils/storage.svelte';

	interface Props {
		terrain: Terrain;
	}

	let { terrain }: Props = $props();

	const { admin } = useTerrain();
	const uiStore = admin.uiStore;

	let fileInput: HTMLInputElement;
	let isUploading = $state(false);
	let title = $state(terrain.title ?? '');

	const hasStartMarker = $derived(terrain.start_x != null && terrain.start_y != null);

	async function onclickStartMarker() {
		if (hasStartMarker) {
			await admin.update(terrain.id, { start_x: null, start_y: null });
		} else {
			admin.setSettingStartMarker(!$uiStore.isSettingStartMarker);
		}
	}

	async function updateTitle() {
		const trimmed = title.trim();
		if (trimmed === (terrain.title ?? '')) return;
		await admin.update(terrain.id, { title: trimmed || undefined });
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			updateTitle();
		}
	}

	function onclickUpload() {
		fileInput.click();
	}

	async function onfilechange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || isUploading) return;

		isUploading = true;

		try {
			const filename = await uploadGameAsset('terrain', terrain, file);
			if (filename) {
				await admin.update(terrain.id, { game_asset: filename });
			}
		} catch (error) {
			console.error('Failed to upload terrain file:', error);
		} finally {
			isUploading = false;
			input.value = '';
		}
	}
</script>

<div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
	<ButtonGroup>
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						onclick={onclickUpload}
						size="icon-lg"
						variant="outline"
						disabled={isUploading}
					>
						{#if isUploading}
							<IconLoader2 class="animate-spin" />
						{:else}
							<IconUpload />
						{/if}
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>지형 파일 업로드</TooltipContent>
		</Tooltip>
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						onclick={() => admin.setDebug(!$uiStore.debug)}
						size="icon-lg"
						variant="outline"
					>
						{#if $uiStore.debug}
							<IconBugOff />
						{:else}
							<IconBug />
						{/if}
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>
				{$uiStore.debug ? '디버그 모드 끄기' : '디버그 모드 켜기'}
			</TooltipContent>
		</Tooltip>
	</ButtonGroup>
	<ButtonGroup>
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						onclick={onclickStartMarker}
						size="icon-lg"
						variant={$uiStore.isSettingStartMarker || hasStartMarker ? 'default' : 'outline'}
					>
						{#if hasStartMarker}
							<IconMapPinOff />
						{:else}
							<IconMapPin />
						{/if}
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>
				{#if hasStartMarker}
					시작 위치 제거
				{:else if $uiStore.isSettingStartMarker}
					시작 위치 설정 중...
				{:else}
					시작 위치 설정
				{/if}
			</TooltipContent>
		</Tooltip>
	</ButtonGroup>
	<InputGroup class="h-10">
		<InputGroupAddon>
			<InputGroupText>
				<IconHeading class="size-4" />
			</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput bind:value={title} placeholder="지형 이름" {onkeydown} />
		<InputGroupAddon align="inline-end">
			<InputGroupButton onclick={updateTitle} variant="secondary" class="h-7">
				저장
			</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>
</div>
<input bind:this={fileInput} type="file" class="hidden" onchange={onfilechange} />
