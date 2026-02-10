import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { BehaviorAction, EntitySourceId, ItemId } from '$lib/types';
import { vectorUtils } from '$lib/utils/vector';
import type { Entity } from '../../entity.svelte';

// Mock hooks
vi.mock('$lib/hooks', () => ({
	useBehavior: vi.fn(),
	useWorld: vi.fn(),
	useInteraction: vi.fn(),
}));

// Mock EntityIdUtils
vi.mock('$lib/utils/entity-id', () => ({
	EntityIdUtils: {
		instanceId: vi.fn((id: any) => id),
	},
}));

// Mock constants
vi.mock('$lib/constants', () => ({
	TARGET_ARRIVAL_DISTANCE: 50,
}));

// Mock vectorUtils.sortByDistance
vi.mock('$lib/utils/vector', async () => {
	const actual = await vi.importActual<typeof import('$lib/utils/vector')>('$lib/utils/vector');
	return {
		...actual,
		vectorUtils: {
			...actual.vectorUtils,
			sortByDistance: vi.fn((source: any, entities: any[]) => {
				return entities.slice().sort((a, b) => {
					const distA = Math.sqrt(
						Math.pow(a.body.position.x - source.body.position.x, 2) +
							Math.pow(a.body.position.y - source.body.position.y, 2)
					);
					const distB = Math.sqrt(
						Math.pow(b.body.position.x - source.body.position.x, 2) +
							Math.pow(b.body.position.y - source.body.position.y, 2)
					);
					return distA - distB;
				});
			}),
		},
	};
});

describe('tickFindTargetEntityAndGo(this: WorldCharacterEntityBehavior)', () => {
	let behavior: WorldCharacterEntityBehavior;
	let mockWorldCharacterEntity: Partial<WorldCharacterEntity>;
	let mockGetBehaviorAction: ReturnType<typeof vi.fn>;
	let mockSearchEntitySources: ReturnType<typeof vi.fn>;
	let mockGetEntitySourceId: ReturnType<typeof vi.fn>;
	let mockGetWorldItem: ReturnType<typeof vi.fn>;
	let mockUpdateWorldItem: ReturnType<typeof vi.fn>;
	let mockPathfinder: any;

	beforeEach(async () => {
		mockPathfinder = {
			findPath: vi.fn().mockReturnValue([]),
		};

		mockWorldCharacterEntity = {
			id: 'character-1' as any,
			instanceId: 'world-character-1' as any,
			x: 100,
			y: 100,
			body: {
				position: vectorUtils.createVector(100, 100),
			} as any,
			worldContext: {
				entities: {},
				pathfinder: mockPathfinder,
			} as any,
			heldItemIds: [],
		};

		behavior = new WorldCharacterEntityBehavior(mockWorldCharacterEntity as WorldCharacterEntity);

		mockGetBehaviorAction = vi.fn();
		mockSearchEntitySources = vi.fn();
		mockGetEntitySourceId = vi.fn();
		mockGetWorldItem = vi.fn();
		mockUpdateWorldItem = vi.fn();

		const { useBehavior, useWorld } = await import('$lib/hooks');
		vi.mocked(useBehavior).mockReturnValue({
			getBehaviorAction: mockGetBehaviorAction,
			searchEntitySources: mockSearchEntitySources,
		} as any);
		vi.mocked(useWorld).mockReturnValue({
			getEntitySourceId: mockGetEntitySourceId,
			getWorldItem: mockGetWorldItem,
			updateWorldItem: mockUpdateWorldItem,
		} as any);
	});

	it('현재 행동 타깃이 없으면 계속 진행한다', () => {
		behavior.behaviorTargetId = undefined;

		const result = behavior.tickFindTargetEntityAndGo(0);

		expect(result).toBe(false);
		expect(mockGetBehaviorAction).not.toHaveBeenCalled();
	});

	it('행동 타입이 대기인 경우 타깃 엔티티를 탐색하지 않고 계속 진행한다', () => {
		behavior.behaviorTargetId = 'behavior-target-1' as any;
		const mockBehaviorAction = {
			id: 'action-1',
			type: 'idle',
		} as any;
		mockGetBehaviorAction.mockReturnValue(mockBehaviorAction);

		const result = behavior.tickFindTargetEntityAndGo(0);

		expect(result).toBe(false);
	});

	it('현재 타깃 엔티티가 들고 있는 아이템인 경우 경로를 초기화하고 계속 진행한다', () => {
		behavior.behaviorTargetId = 'behavior-target-1' as any;
		behavior.targetEntityId = 'held-item-1' as any;
		mockWorldCharacterEntity.heldItemIds = ['held-item-1' as any];
		const mockBehaviorAction = {
			id: 'action-1',
			type: 'system-item-pick',
		} as any;
		mockGetBehaviorAction.mockReturnValue(mockBehaviorAction);

		const mockEntity: Entity = {
			id: 'held-item-1' as any,
			x: 100,
			y: 100,
			body: { position: vectorUtils.createVector(100, 100) },
		} as Entity;
		mockWorldCharacterEntity.worldContext!.entities = {
			['held-item-1' as any]: mockEntity,
		};
		behavior.path = [vectorUtils.createVector(120, 100)];

		const result = behavior.tickFindTargetEntityAndGo(0);

		expect(behavior.path).toEqual([]);
		expect(result).toBe(false);
	});

	it('현재 타깃 엔티티가 들고 있는 아이템이 아닌 경우 경로를 최신화하고 계속 진행한다', () => {
		behavior.behaviorTargetId = 'behavior-target-1' as any;
		behavior.targetEntityId = 'entity-1' as any;
		const mockBehaviorAction = {
			id: 'action-1',
			type: 'system-item-pick',
		} as any;
		mockGetBehaviorAction.mockReturnValue(mockBehaviorAction);

		const mockEntity: Entity = {
			id: 'entity-1' as any,
			x: 200,
			y: 100,
			body: { position: vectorUtils.createVector(200, 100) },
		} as Entity;
		mockWorldCharacterEntity.worldContext!.entities = {
			['entity-1' as any]: mockEntity,
		};
		const mockPath = [vectorUtils.createVector(150, 100)];
		mockPathfinder.findPath.mockReturnValue(mockPath);

		const result = behavior.tickFindTargetEntityAndGo(0);

		expect(mockPathfinder.findPath).toHaveBeenCalled();
		expect(behavior.path).toEqual(mockPath);
		expect(result).toBe(false);
	});

	it('타깃 선택 방식이 명시적인 경우 지정된 상호작용 액션을 기반으로 대상 후보를 필터링한다', () => {
		behavior.behaviorTargetId = 'behavior-target-1' as any;
		const entitySourceId = 'source-1' as EntitySourceId;
		const mockBehaviorAction = {
			id: 'action-1',
			type: 'system-item-pick',
			target_selection_method: 'explicit',
		} as any;
		mockGetBehaviorAction.mockReturnValue(mockBehaviorAction);
		mockGetEntitySourceId.mockReturnValue(entitySourceId);
		mockGetWorldItem.mockReturnValue({ world_character_id: null });

		const mockEntity: Entity = {
			id: 'entity-1' as any,
			sourceId: entitySourceId,
			x: 150,
			y: 100,
			body: { position: vectorUtils.createVector(150, 100) },
		} as Entity;
		mockWorldCharacterEntity.worldContext!.entities = {
			['character-1' as any]: mockWorldCharacterEntity as any,
			['entity-1' as any]: mockEntity,
		};

		const result = behavior.tickFindTargetEntityAndGo(0);

		expect(behavior.targetEntityId).toBe('entity-1');
		expect(mockUpdateWorldItem).toHaveBeenCalled();
		expect(result).toBe(false);
	});

	it('타깃 선택 방식이 검색인 경우 검색(searchEntitySources)으로 대상 후보를 필터링한다', () => {
		behavior.behaviorTargetId = 'behavior-target-1' as any;
		const entitySourceId1 = 'source-1' as EntitySourceId;
		const entitySourceId2 = 'source-2' as EntitySourceId;
		const mockBehaviorAction = {
			id: 'action-1',
			type: 'system-item-pick',
			target_selection_method: 'search',
		} as any;
		mockGetBehaviorAction.mockReturnValue(mockBehaviorAction);
		mockSearchEntitySources.mockReturnValue([{ id: entitySourceId1 }, { id: entitySourceId2 }]);
		mockGetWorldItem.mockReturnValue({ world_character_id: null });

		const mockEntity1: Entity = {
			id: 'entity-1' as any,
			sourceId: entitySourceId1,
			x: 150,
			y: 100,
			body: { position: vectorUtils.createVector(150, 100) },
		} as Entity;
		const mockEntity2: Entity = {
			id: 'entity-2' as any,
			sourceId: entitySourceId2,
			x: 120,
			y: 100,
			body: { position: vectorUtils.createVector(120, 100) },
		} as Entity;
		mockWorldCharacterEntity.worldContext!.entities = {
			['character-1' as any]: mockWorldCharacterEntity as any,
			['entity-1' as any]: mockEntity1,
			['entity-2' as any]: mockEntity2,
		};

		const result = behavior.tickFindTargetEntityAndGo(0);

		expect(behavior.targetEntityId).toBe('entity-2');
		expect(mockUpdateWorldItem).toHaveBeenCalled();
		expect(result).toBe(false);
	});

	it('아무런 대상 후보도 찾지 못한 경우 계속 진행한다', () => {
		behavior.behaviorTargetId = 'behavior-target-1' as any;
		const mockBehaviorAction = {
			id: 'action-1',
			type: 'system-item-pick',
			target_selection_method: 'search',
		} as any;
		mockGetBehaviorAction.mockReturnValue(mockBehaviorAction);
		mockSearchEntitySources.mockReturnValue([]);
		mockWorldCharacterEntity.worldContext!.entities = {
			['character-1' as any]: mockWorldCharacterEntity as any,
		};

		const result = behavior.tickFindTargetEntityAndGo(0);

		expect(result).toBe(false);
	});

	describe('들고 있는 아이템 중 대상 후보가 있는 경우', () => {
		it('대상 후보와 일치하는 첫번째 아이템을 타깃 엔티티로 설정한다', () => {
			behavior.behaviorTargetId = 'behavior-target-1' as any;
			const entitySourceId = 'item-source-1' as EntitySourceId;
			mockWorldCharacterEntity.heldItemIds = ['held-item-1' as any];
			const mockBehaviorAction = {
				id: 'action-1',
				type: 'system-item-pick',
				target_selection_method: 'explicit',
			} as any;
			mockGetBehaviorAction.mockReturnValue(mockBehaviorAction);
			mockGetEntitySourceId.mockReturnValue(entitySourceId);
			mockGetWorldItem.mockReturnValue({ id: '1', item_id: entitySourceId });

			const result = behavior.tickFindTargetEntityAndGo(0);

			expect(behavior.targetEntityId).toBe('held-item-1');
			expect(behavior.path).toEqual([]);
			expect(result).toBe(false);
		});

		it('아이템의 월드 캐릭터 아이디를 현재 캐릭터로 설정한다', () => {
			behavior.behaviorTargetId = 'behavior-target-1' as any;
			const entitySourceId = 'item-source-1' as EntitySourceId;
			mockWorldCharacterEntity.heldItemIds = ['held-item-1' as any];
			const mockBehaviorAction = {
				id: 'action-1',
				type: 'system-item-pick',
				target_selection_method: 'explicit',
			} as any;
			mockGetBehaviorAction.mockReturnValue(mockBehaviorAction);
			mockGetEntitySourceId.mockReturnValue(entitySourceId);
			mockGetWorldItem.mockReturnValue({ id: '1', item_id: entitySourceId });

			behavior.tickFindTargetEntityAndGo(0);

			expect(mockUpdateWorldItem).toHaveBeenCalledWith('1', {
				world_character_id: 'world-character-1',
			});
		});
	});

	describe('들고 있는 아이템 중 대상 후보가 없는 경우', () => {
		it('캐릭터와 가장 가까운 엔티티 중 대상 후보와 일치하는 엔티티를 타깃 엔티티로 설정한다', () => {
			behavior.behaviorTargetId = 'behavior-target-1' as any;
			const entitySourceId = 'source-1' as EntitySourceId;
			const mockBehaviorAction = {
				id: 'action-1',
				type: 'system-item-pick',
				target_selection_method: 'search',
			} as any;
			mockGetBehaviorAction.mockReturnValue(mockBehaviorAction);
			mockSearchEntitySources.mockReturnValue([{ id: entitySourceId }]);
			mockGetWorldItem.mockReturnValue({ id: '1', world_character_id: null });

			const mockEntity1: Entity = {
				id: 'entity-1' as any,
				sourceId: entitySourceId,
				x: 200,
				y: 100,
				body: { position: vectorUtils.createVector(200, 100) },
			} as Entity;
			const mockEntity2: Entity = {
				id: 'entity-2' as any,
				sourceId: entitySourceId,
				x: 120,
				y: 100,
				body: { position: vectorUtils.createVector(120, 100) },
			} as Entity;
			mockWorldCharacterEntity.worldContext!.entities = {
				['character-1' as any]: mockWorldCharacterEntity as any,
				['entity-1' as any]: mockEntity1,
				['entity-2' as any]: mockEntity2,
			};

			const result = behavior.tickFindTargetEntityAndGo(0);

			expect(behavior.targetEntityId).toBe('entity-2');
			expect(result).toBe(false);
		});

		it('스토어에서 월드 아이템의 캐릭터 아이디를 현재 캐릭터로 설정한다', () => {
			behavior.behaviorTargetId = 'behavior-target-1' as any;
			const entitySourceId = 'source-1' as EntitySourceId;
			const mockBehaviorAction = {
				id: 'action-1',
				type: 'system-item-pick',
				target_selection_method: 'search',
			} as any;
			mockGetBehaviorAction.mockReturnValue(mockBehaviorAction);
			mockSearchEntitySources.mockReturnValue([{ id: entitySourceId }]);
			mockGetWorldItem.mockReturnValue({ id: '1', world_character_id: null });

			const mockEntity: Entity = {
				id: 'entity-1' as any,
				sourceId: entitySourceId,
				x: 150,
				y: 100,
				body: { position: vectorUtils.createVector(150, 100) },
			} as Entity;
			mockWorldCharacterEntity.worldContext!.entities = {
				['character-1' as any]: mockWorldCharacterEntity as any,
				['entity-1' as any]: mockEntity,
			};

			behavior.tickFindTargetEntityAndGo(0);

			expect(mockUpdateWorldItem).toHaveBeenCalledWith('1', {
				world_character_id: 'world-character-1',
			});
		});

		it('월드 캐릭터 아이디가 설정된 아이템은 캐릭터의 타깃 엔티티가 될 수 없다', () => {
			behavior.behaviorTargetId = 'behavior-target-1' as any;
			const entitySourceId = 'source-1' as EntitySourceId;
			const mockBehaviorAction = {
				id: 'action-1',
				type: 'system-item-pick',
				target_selection_method: 'search',
			} as any;
			mockGetBehaviorAction.mockReturnValue(mockBehaviorAction);
			mockSearchEntitySources.mockReturnValue([{ id: entitySourceId }]);

			// entity-1은 이미 캐릭터 ID가 있음 (제외되어야 함)
			// entity-2는 캐릭터 ID가 없음 (선택되어야 함)
			mockGetWorldItem
				.mockReturnValueOnce({ id: '1', world_character_id: 'other-character' })
				.mockReturnValueOnce({ id: '2', world_character_id: null });

			const mockEntity1: Entity = {
				id: 'entity-1' as any,
				sourceId: entitySourceId,
				x: 110,
				y: 100,
				body: { position: vectorUtils.createVector(110, 100) },
			} as Entity;
			const mockEntity2: Entity = {
				id: 'entity-2' as any,
				sourceId: entitySourceId,
				x: 150,
				y: 100,
				body: { position: vectorUtils.createVector(150, 100) },
			} as Entity;
			mockWorldCharacterEntity.worldContext!.entities = {
				['character-1' as any]: mockWorldCharacterEntity as any,
				['entity-1' as any]: mockEntity1,
				['entity-2' as any]: mockEntity2,
			};

			const result = behavior.tickFindTargetEntityAndGo(0);

			expect(behavior.targetEntityId).toBe('entity-2');
			expect(result).toBe(false);
		});
	});

	it('현재 행동에 대한 타깃 엔티티를 찾지 못한 경우 계속 진행한다', () => {
		behavior.behaviorTargetId = 'behavior-target-1' as any;
		const mockBehaviorAction = {
			id: 'action-1',
			type: 'system-item-pick',
			target_selection_method: 'search',
		} as any;
		mockGetBehaviorAction.mockReturnValue(mockBehaviorAction);
		mockSearchEntitySources.mockReturnValue([{ id: 'source-1' }]);
		mockWorldCharacterEntity.worldContext!.entities = {
			['character-1' as any]: mockWorldCharacterEntity as any,
		};

		const result = behavior.tickFindTargetEntityAndGo(0);

		expect(result).toBe(false);
	});
});
