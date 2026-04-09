<script lang="ts">
	import { useBuilding, useCharacter } from '$lib/hooks';
	import { Panel, useNodes } from '@xyflow/svelte';
	import type { ConditionEffect, CharacterId, NeedId } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupButton,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { clone } from 'radash';
	import { Separator } from '$lib/components/ui/separator';
	import { getActionString } from '$lib/utils/label';

	interface Props {
		effect: ConditionEffect | undefined;
	}

	let { effect: conditionEffect }: Props = $props();

	const { admin } = useBuilding();
	const { characterStore } = useCharacter();
	const { needStore } = useCharacter();
	const flowNodes = useNodes();

	const characters = $derived(Object.values($characterStore.data));
	const needs = $derived(Object.values($needStore.data));

	let isUpdating = $state(false);
	let changes = $state<ConditionEffect | undefined>(undefined);
	let currentEffectId = $state<string | undefined>(undefined);

	const selectedCharacterLabel = $derived.by(() => {
		if (!changes) return '선택...';
		if (!changes.character_id) return '전체';
		const character = characters.find((c) => c.id === changes?.character_id);
		return character?.name ?? '선택...';
	});

	const selectedNeedLabel = $derived.by(() => {
		if (!changes || !changes.need_id) return '선택...';
		const need = needs.find((n) => n.id === changes?.need_id);
		return need?.name ?? '선택...';
	});

	$effect(() => {
		if (conditionEffect && conditionEffect.id !== currentEffectId) {
			currentEffectId = conditionEffect.id;
			changes = clone(conditionEffect);
		}
	});

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!changes || isUpdating) return;

		const effectId = changes.id;
		isUpdating = true;

		admin
			.updateConditionEffect(effectId, {
				name: changes.name,
				character_id: changes.character_id,
				need_id: changes.need_id,
				min_threshold: changes.min_threshold,
				max_threshold: changes.max_threshold,
				change_per_tick: changes.change_per_tick,
			})
			.then(() => {
				// 저장 성공
			})
			.catch((error: Error) => {
				console.error('Failed to update effect:', error);
			})
			.finally(() => {
				isUpdating = false;
			});
	}

	function onclickCancel() {
		if (!conditionEffect) return;

		flowNodes.update((ns) =>
			ns.map((n) =>
				n.id === `condition-effect-${conditionEffect.id}` ? { ...n, selected: false } : n
			)
		);
	}

	function onCharacterChange(value: string | undefined) {
		if (!changes) return;
		changes.character_id = value && value !== '' ? (value as CharacterId) : null;
	}

	function onNeedChange(value: string | undefined) {
		if (!changes || !value) return;
		changes.need_id = value as NeedId;
	}
</script>

<Panel position="top-right">
	<Card class="w-80 py-4">
		<CardContent class="px-4">
			{#if changes}
				<form {onsubmit} class="space-y-4">
					<div class="space-y-2">
						<InputGroup>
							<InputGroupAddon align="inline-start">
								<InputGroupText>이름</InputGroupText>
							</InputGroupAddon>
							<InputGroupInput type="text" placeholder="효과 이름" bind:value={changes.name} />
						</InputGroup>

						<InputGroup>
							<InputGroupAddon align="inline-start">
								<Tooltip>
									<TooltipTrigger>
										{#snippet child({ props })}
											<InputGroupButton {...props} variant="ghost">범위</InputGroupButton>
										{/snippet}
									</TooltipTrigger>
									<TooltipContent side="bottom">효과가 발동하는 컨디션 범위</TooltipContent>
								</Tooltip>
							</InputGroupAddon>
							<InputGroupInput type="number" step="0.1" bind:value={changes.min_threshold} />
							<InputGroupText>~</InputGroupText>
							<InputGroupInput type="number" step="0.1" bind:value={changes.max_threshold} />
						</InputGroup>

						<Separator />

						<ButtonGroup class="w-full">
							<Select
								type="single"
								value={changes.character_id ?? ''}
								onValueChange={onCharacterChange}
							>
								<SelectTrigger class="flex-1">
									{selectedCharacterLabel}
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">전체</SelectItem>
									{#each characters as character (character.id)}
										<SelectItem value={character.id}>{character.name}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</ButtonGroup>

						<ButtonGroup class="w-full">
							<Select type="single" value={changes.need_id ?? ''} onValueChange={onNeedChange}>
								<SelectTrigger class="flex-1">
									{selectedNeedLabel}
								</SelectTrigger>
								<SelectContent>
									{#each needs as need (need.id)}
										<SelectItem value={need.id}>{need.name}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</ButtonGroup>

						<InputGroup>
							<InputGroupAddon align="inline-start">
								<Tooltip>
									<TooltipTrigger>
										{#snippet child({ props })}
											<InputGroupButton {...props} variant="ghost">틱당 변화</InputGroupButton>
										{/snippet}
									</TooltipTrigger>
									<TooltipContent side="bottom">
										컨디션이 범위 내에 있을 때
										<br />
										틱당 욕구가 변화하는 양
										<br />
										(양수: 보너스, 음수: 패널티)
									</TooltipContent>
								</Tooltip>
							</InputGroupAddon>
							<InputGroupInput type="number" step="0.1" bind:value={changes.change_per_tick} />
						</InputGroup>
					</div>
					<div class="flex justify-end gap-2">
						<Button type="button" variant="outline" onclick={onclickCancel} disabled={isUpdating}>
							취소
						</Button>
						<Button type="submit" disabled={isUpdating}>
							{isUpdating ? getActionString('saving') : getActionString('save')}
						</Button>
					</div>
				</form>
			{/if}
		</CardContent>
	</Card>
</Panel>
