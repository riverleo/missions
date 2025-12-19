<script lang="ts">
	import { Panel, useEdges } from '@xyflow/svelte';
	import type { CharacterNeed } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { useNeed } from '$lib/hooks/use-need';
	import { useCharacter } from '$lib/hooks/use-character';
	import { clone } from 'radash';

	interface Props {
		characterNeed: CharacterNeed | undefined;
	}

	let { characterNeed }: Props = $props();

	const { admin } = useNeed();
	const { store: characterStore } = useCharacter();
	const flowEdges = useEdges();

	const characters = $derived(Object.values($characterStore.data));

	let isUpdating = $state(false);
	let changes = $state<CharacterNeed | undefined>(undefined);
	let currentCharacterNeedId = $state<string | undefined>(undefined);

	const selectedCharacterName = $derived(
		characters.find((c) => c.id === changes?.character_id)?.name ?? '선택...'
	);

	$effect(() => {
		if (characterNeed && characterNeed.id !== currentCharacterNeedId) {
			currentCharacterNeedId = characterNeed.id;
			changes = clone(characterNeed);
		}
	});

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!changes || isUpdating) return;

		const characterNeedId = changes.id;
		const edgeId = `character-need-${changes.character_id}-${changes.need_id}`;
		isUpdating = true;

		admin
			.updateCharacterNeed(characterNeedId, {
				character_id: changes.character_id,
				decay_multiplier: changes.decay_multiplier,
			})
			.then(() => {
				// 선택 해제
				flowEdges.update((es) => es.map((e) => (e.id === edgeId ? { ...e, selected: false } : e)));
			})
			.catch((error: Error) => {
				console.error('Failed to update character need:', error);
			})
			.finally(() => {
				isUpdating = false;
			});
	}

	function onclickCancel() {
		if (!characterNeed) return;

		const edgeId = `character-need-${characterNeed.character_id}-${characterNeed.need_id}`;
		flowEdges.update((es) => es.map((e) => (e.id === edgeId ? { ...e, selected: false } : e)));
	}

	function onCharacterChange(value: string | undefined) {
		if (value && changes) {
			changes.character_id = value;
		}
	}
</script>

<Panel position="top-right">
	<Card class="w-80 py-4">
		<CardContent class="px-4">
			{#if changes}
				<form {onsubmit} class="space-y-4">
					<InputGroup>
						<InputGroupAddon align="inline-start">
							<InputGroupText>시간당 감소</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput
							type="number"
							step="0.1"
							bind:value={changes.decay_multiplier}
							placeholder="감소 배율"
						/>
						<InputGroupAddon align="inline-end">
							<InputGroupText>배</InputGroupText>
						</InputGroupAddon>
					</InputGroup>
					<div class="flex justify-end gap-2">
						<Button type="button" variant="outline" onclick={onclickCancel} disabled={isUpdating}>
							취소
						</Button>
						<Button type="submit" disabled={isUpdating}>
							{isUpdating ? '저장 중...' : '저장'}
						</Button>
					</div>
				</form>
			{/if}
		</CardContent>
	</Card>
</Panel>
