<script lang="ts">
	import { useCharacter } from '$lib/hooks';
	import { Panel, useNodes } from '@xyflow/svelte';
	import type { Need } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupText,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { IconHeading } from '@tabler/icons-svelte';
	import { clone } from 'radash';
	import { tick } from 'svelte';
	import { getActionString } from '$lib/utils/state-label';

	interface Props {
		need: Need | undefined;
	}

	let { need }: Props = $props();

	const { admin } = useCharacter();
	const flowNodes = useNodes();

	let isUpdating = $state(false);
	let changes = $state<Need | undefined>(undefined);
	let nameInputRef = $state<HTMLInputElement | null>(null);
	let currentNeedId = $state<string | undefined>(undefined);

	$effect(() => {
		if (need && need.id !== currentNeedId) {
			currentNeedId = need.id;
			changes = clone(need);

			tick().then(() => {
				nameInputRef?.focus();
			});
		}
	});

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!changes || isUpdating) return;

		const needId = changes.id;
		isUpdating = true;

		admin
			.updateNeed(needId, {
				name: changes.name,
				max_value: changes.max_value,
				initial_value: changes.initial_value,
				decrease_per_tick: changes.decrease_per_tick,
			})
			.then(() => {
				// 저장 성공
			})
			.catch((error: Error) => {
				console.error('Failed to update need:', error);
			})
			.finally(() => {
				isUpdating = false;
			});
	}

	function onclickCancel() {
		if (!need) return;

		flowNodes.update((ns) =>
			ns.map((n) => (n.id === `need-${need.id}` ? { ...n, selected: false } : n))
		);
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
								<IconHeading class="size-4" />
							</InputGroupAddon>
							<InputGroupInput
								bind:ref={nameInputRef}
								bind:value={changes.name}
								placeholder="욕구 이름"
							/>
						</InputGroup>
						<div class="flex gap-1">
							<InputGroup>
								<InputGroupAddon align="inline-start">
									<InputGroupText>최대</InputGroupText>
								</InputGroupAddon>
								<InputGroupInput type="number" bind:value={changes.max_value} />
							</InputGroup>
							<InputGroup>
								<InputGroupAddon align="inline-start">
									<InputGroupText>기본</InputGroupText>
								</InputGroupAddon>
								<InputGroupInput type="number" bind:value={changes.initial_value} />
							</InputGroup>
						</div>
						<InputGroup>
							<InputGroupAddon align="inline-start">
								<Tooltip>
									<TooltipTrigger>
										{#snippet child({ props })}
											<InputGroupButton {...props} variant="ghost">틱당 감소</InputGroupButton>
										{/snippet}
									</TooltipTrigger>
									<TooltipContent>게임 틱(tick)당 감소하는 욕구 수치입니다</TooltipContent>
								</Tooltip>
							</InputGroupAddon>
							<InputGroupInput type="number" step="0.01" bind:value={changes.decrease_per_tick} />
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
