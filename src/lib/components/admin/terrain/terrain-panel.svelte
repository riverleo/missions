<script lang="ts">
	import type { Terrain } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconUpload, IconLoader2, IconBug, IconBugOff } from '@tabler/icons-svelte';
	import { useServerPayload } from '$lib/hooks/use-server-payload.svelte';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { uploadGameAsset } from '$lib/utils/storage';

	interface Props {
		terrain: Terrain;
		debug: boolean;
		ontoggleDebug: () => void;
	}

	let { terrain, debug, ontoggleDebug }: Props = $props();

	const { supabase } = useServerPayload();
	const { admin } = useTerrain();

	let fileInput: HTMLInputElement;
	let isUploading = $state(false);

	function onclickUpload() {
		fileInput.click();
	}

	async function onfilechange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || isUploading) return;

		isUploading = true;

		try {
			const filename = await uploadGameAsset(supabase, 'terrain', terrain, file);
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

<div class="absolute bottom-4 left-1/2 -translate-x-1/2">
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
					<Button {...props} onclick={ontoggleDebug} size="icon-lg" variant="outline">
						{#if debug}
							<IconBug />
						{:else}
							<IconBugOff />
						{/if}
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>{debug ? '디버그 모드 끄기' : '디버그 모드 켜기'}</TooltipContent>
		</Tooltip>
	</ButtonGroup>
</div>
<input
	bind:this={fileInput}
	type="file"
	class="hidden"
	onchange={onfilechange}
/>
