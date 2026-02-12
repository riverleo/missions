import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BuildingId, CharacterId, ItemId, ScenarioId } from '$lib/types';

type InsertCall = {
	table: string;
	payload: Record<string, unknown>;
};

function createSupabaseMock() {
	let sequence = 0;
	const insertCalls: InsertCall[] = [];

	function buildRow(table: string, payload: Record<string, unknown>): Record<string, unknown> {
		sequence += 1;

		switch (table) {
			case 'building_interactions':
				return {
					id: `building-interaction-${sequence}`,
					...payload,
				};
			case 'building_interaction_actions':
				return {
					id: `building-interaction-action-${sequence}`,
					next_building_interaction_action_id: null,
					...payload,
				};
			case 'item_interactions':
				return {
					id: `item-interaction-${sequence}`,
					...payload,
				};
			case 'item_interaction_actions':
				return {
					id: `item-interaction-action-${sequence}`,
					next_item_interaction_action_id: null,
					...payload,
				};
			case 'character_interactions':
				return {
					id: `character-interaction-${sequence}`,
					...payload,
				};
			case 'character_interaction_actions':
				return {
					id: `character-interaction-action-${sequence}`,
					next_character_interaction_action_id: null,
					...payload,
				};
			default:
				return {
					id: `row-${sequence}`,
					...payload,
				};
		}
	}

	const supabase = {
		from(table: string) {
			return {
				insert(payload: Record<string, unknown>) {
					insertCalls.push({ table, payload });
					return {
						select() {
							return {
								async single() {
									return {
										data: buildRow(table, payload),
										error: null,
									};
								},
							};
						},
					};
				},
				update() {
					return {
						async eq() {
							return { error: null };
						},
					};
				},
				delete() {
					return {
						async eq() {
							return { error: null };
						},
					};
				},
			};
		},
	};

	return { supabase, insertCalls };
}

function getLastInsertPayload(
	insertCalls: InsertCall[],
	table: string
): Record<string, unknown> | undefined {
	const calls = insertCalls.filter((call) => call.table === table);
	return calls.at(-1)?.payload;
}

describe('createBuildingInteraction(scenarioId: ScenarioId, interaction: BuildingInteractionInsert)', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('건물 상호작용에서 새 아이템 생성 시 기본 상호작용 액션이 자동으로 추가된다.', async () => {
		const { supabase, insertCalls } = createSupabaseMock();

		vi.doMock('./use-app.svelte', () => ({
			useApp: () => ({ supabase }),
		}));

		const { useInteraction } = await import('./use-interaction');
		const interactionStore = useInteraction();

		const scenarioId = 'scenario-1' as ScenarioId;
		const interaction = await interactionStore.admin.createBuildingInteraction(scenarioId, {
			building_id: 'building-1' as BuildingId,
			type: 'once',
			once_interaction_type: 'building_use',
			fulfill_interaction_type: null,
			system_interaction_type: null,
			character_id: null,
		});

		const actionPayload = getLastInsertPayload(insertCalls, 'building_interaction_actions');
		expect(actionPayload).toBeDefined();
		expect(actionPayload?.root).toBe(true);

		const actions = interactionStore.getAllBuildingInteractionActions(interaction.id);
		expect(actions).toHaveLength(1);
		expect(actions[0]?.root).toBe(true);
	});
});

describe('createItemInteraction(scenarioId: ScenarioId, interaction: ItemInteractionInsert)', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('아이템 상호작용에서 새 아이템 생성 시 기본 상호작용 액션이 자동으로 추가된다.', async () => {
		const { supabase, insertCalls } = createSupabaseMock();

		vi.doMock('./use-app.svelte', () => ({
			useApp: () => ({ supabase }),
		}));

		const { useInteraction } = await import('./use-interaction');
		const interactionStore = useInteraction();

		const scenarioId = 'scenario-1' as ScenarioId;
		const interaction = await interactionStore.admin.createItemInteraction(scenarioId, {
			item_id: 'item-1' as ItemId,
			type: 'once',
			once_interaction_type: 'item_use',
			fulfill_interaction_type: null,
			system_interaction_type: null,
			character_id: null,
		});

		const actionPayload = getLastInsertPayload(insertCalls, 'item_interaction_actions');
		expect(actionPayload).toBeDefined();
		expect(actionPayload?.root).toBe(true);

		const actions = interactionStore.getAllItemInteractionActions(interaction.id);
		expect(actions).toHaveLength(1);
		expect(actions[0]?.root).toBe(true);
	});

	it('해당 아이템의 상호작용 액션이 모두 삭제된 상태라면, 이후 새로 추가되는 첫 액션은 다시 `root = true`로 생성된다.', async () => {
		const { supabase, insertCalls } = createSupabaseMock();

		vi.doMock('./use-app.svelte', () => ({
			useApp: () => ({ supabase }),
		}));

		const { useInteraction } = await import('./use-interaction');
		const interactionStore = useInteraction();

		const scenarioId = 'scenario-1' as ScenarioId;
		const interaction = await interactionStore.admin.createItemInteraction(scenarioId, {
			item_id: 'item-1' as ItemId,
			type: 'once',
			once_interaction_type: 'item_use',
			fulfill_interaction_type: null,
			system_interaction_type: null,
			character_id: null,
		});

		const firstActions = interactionStore.getAllItemInteractionActions(interaction.id);
		await interactionStore.admin.removeItemInteractionAction(firstActions[0]!.id);
		await interactionStore.admin.createItemInteractionAction(scenarioId, interaction.id, {});

		const actionPayload = getLastInsertPayload(insertCalls, 'item_interaction_actions');
		expect(actionPayload).toBeDefined();
		expect(actionPayload?.root).toBe(true);
	});

	it('해당 아이템에서 2번째 이후로 생성되는 상호작용 액션은 `root = false`로 생성된다.', async () => {
		const { supabase, insertCalls } = createSupabaseMock();

		vi.doMock('./use-app.svelte', () => ({
			useApp: () => ({ supabase }),
		}));

		const { useInteraction } = await import('./use-interaction');
		const interactionStore = useInteraction();

		const scenarioId = 'scenario-1' as ScenarioId;
		const interaction = await interactionStore.admin.createItemInteraction(scenarioId, {
			item_id: 'item-1' as ItemId,
			type: 'once',
			once_interaction_type: 'item_use',
			fulfill_interaction_type: null,
			system_interaction_type: null,
			character_id: null,
		});

		await interactionStore.admin.createItemInteractionAction(scenarioId, interaction.id, {});

		const actionPayload = getLastInsertPayload(insertCalls, 'item_interaction_actions');
		expect(actionPayload).toBeDefined();
		expect(actionPayload?.root).toBe(false);

		const actions = interactionStore.getAllItemInteractionActions(interaction.id);
		expect(actions.filter((action) => action.root)).toHaveLength(1);
	});
});

describe('createCharacterInteraction(scenarioId: ScenarioId, interaction: CharacterInteractionInsert)', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('캐릭터 상호작용에서 새 아이템 생성 시 기본 상호작용 액션이 자동으로 추가된다.', async () => {
		const { supabase, insertCalls } = createSupabaseMock();

		vi.doMock('./use-app.svelte', () => ({
			useApp: () => ({ supabase }),
		}));

		const { useInteraction } = await import('./use-interaction');
		const interactionStore = useInteraction();

		const scenarioId = 'scenario-1' as ScenarioId;
		const interaction = await interactionStore.admin.createCharacterInteraction(scenarioId, {
			target_character_id: 'character-2' as CharacterId,
			type: 'once',
			once_interaction_type: 'item_use',
			fulfill_interaction_type: null,
			system_interaction_type: null,
			character_id: null,
		});

		const actionPayload = getLastInsertPayload(insertCalls, 'character_interaction_actions');
		expect(actionPayload).toBeDefined();
		expect(actionPayload?.root).toBe(true);

		const actions = interactionStore.getAllCharacterInteractionActions(interaction.id);
		expect(actions).toHaveLength(1);
		expect(actions[0]?.root).toBe(true);
	});
});
