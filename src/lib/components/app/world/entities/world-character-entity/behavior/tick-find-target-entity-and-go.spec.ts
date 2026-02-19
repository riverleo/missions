import { Fixture } from '$lib/hooks/fixture';
import {
	createCharacterInteraction,
	createNeedFulfillment,
	createWorldItem,
} from '$lib/hooks/fixture/utils';
import { useBehavior, useCharacter, useInteraction, useItem, useWorld } from '$lib/hooks';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { vectorUtils } from '$lib/utils/vector';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import { WorldItemEntity } from '../../world-item-entity';
import type createForTickFindTargetEntityAndGo from '$lib/hooks/fixture/world-character-entity/create-for-tick-find-target-entity-and-go';

const FIRST_TICK = 10;

describe('tickFindTargetEntityAndGo(tick: number)', () => {
	let noBehaviorEntity: WorldCharacterEntity;
	let idleEntity: WorldCharacterEntity;
	let holdingEntity: WorldCharacterEntity;
	let nonHoldingEntity: WorldCharacterEntity;
	let searchNoCandidateEntity: WorldCharacterEntity;
	let heldItemEntity: WorldItemEntity;
	let droppedItemEntity: WorldItemEntity;

	beforeEach(() => {
		const fixture: ReturnType<typeof createForTickFindTargetEntityAndGo> =
			Fixture.worldCharacterEntity.createForTickFindTargetEntityAndGo();
		noBehaviorEntity = fixture.noBehaviorEntity;
		idleEntity = fixture.idleEntity;
		holdingEntity = fixture.holdingEntity;
		nonHoldingEntity = fixture.nonHoldingEntity;
		searchNoCandidateEntity = fixture.searchNoCandidateEntity;
		heldItemEntity = fixture.heldItemEntity;
		droppedItemEntity = fixture.droppedItemEntity;
	});

	afterEach(() => {
		Fixture.reset();
	});

	it('현재 행동 대상이 없으면 대상 탐색을 하지 않고 계속 진행한다.', () => {
		// 1) 대상 탐색 단계가 호출되는지 관찰한다.
		const tickFindTargetEntityAndGoSpy = vi.spyOn(
			noBehaviorEntity.behavior,
			'tickFindTargetEntityAndGo'
		);

		// 2) 행동 대상이 없는지 확인한다.
		expect(noBehaviorEntity.behavior.behaviorTargetId).toBeUndefined();

		// 3) 캐릭터 틱을 진행한다.
		noBehaviorEntity.tick(FIRST_TICK);

		// 4) 행동 대상이 없으면 대상 탐색 단계로 진입하지 않는다.
		expect(tickFindTargetEntityAndGoSpy).not.toHaveBeenCalled();
	});

	it('행동 대상이 대기 타입인 경우 대상 탐색을 하지 않고 계속 진행한다.', () => {
		// 1) 대상 탐색 단계 반환값을 확인하기 위해 spy를 설정한다.
		const tickFindTargetEntityAndGoSpy = vi.spyOn(idleEntity.behavior, 'tickFindTargetEntityAndGo');

		// 2) 캐릭터 틱을 진행하면 행동 선택 단계에서 행동 대상이 지정된다.
		idleEntity.tick(FIRST_TICK);

		// 3) 대기 타입이면 대상을 찾지 않고 다음 단계로 계속 진행한다.
		expect(tickFindTargetEntityAndGoSpy).toHaveBeenCalledWith(FIRST_TICK);
		expect(tickFindTargetEntityAndGoSpy.mock.results[0]?.value).toBe(false);
	});

	it('목표 엔티티를 캐릭터가 들고 있는 경우 경로를 초기화하고 계속 진행한다.', () => {
		// 1) 소지 아이템 엔티티와 기존 경로를 준비한다.
		holdingEntity.behavior.path = [vectorUtils.createVector(120, 100)];

		// 2) 캐릭터 틱을 진행하면 대상 탐색에서 소지 아이템이 목표로 선정된다.
		holdingEntity.tick(FIRST_TICK);

		// 3) 소지 아이템이 목표로 선택되면 경로가 비워진다.
		expect(holdingEntity.behavior.targetEntityId).toBe(heldItemEntity.id);
		expect(holdingEntity.behavior.path).toEqual([]);
	});

	it('목표 엔티티를 캐릭터가 들고 있지 않은 경우 경로를 최신화하여 목표 엔티티로 이동한다.', () => {
		// 1) 대상 아이템을 도착 거리 밖으로 두고 경로탐색 결과를 고정한다.
		const nextPath = [vectorUtils.createVector(140, 100), vectorUtils.createVector(180, 100)];
		const findPathSpy = vi
			.spyOn(nonHoldingEntity.worldContext.pathfinder, 'findPath')
			.mockReturnValue(nextPath);

		// 2) 1틱: 실제 탐색 흐름에서 목표 엔티티가 지정된다.
		nonHoldingEntity.tick(FIRST_TICK);
		expect(nonHoldingEntity.behavior.targetEntityId).toBe(droppedItemEntity.id);

		// 3) 2틱: 이미 지정된 목표 엔티티 기준으로 경로를 최신화한다.
		nonHoldingEntity.tick(FIRST_TICK + 1);

		// 4) 소지하지 않은 대상이면 경로 탐색이 수행된다.
		expect(findPathSpy).toHaveBeenCalled();
		expect(nonHoldingEntity.behavior.path).toEqual(nextPath);
	});

	it('목표 엔티티 후보가 없거나 후보 중 타깃을 확정하지 못하면 계속 진행한다.', () => {
		// 1) 대상 탐색 단계의 반환값을 관찰한다.
		const tickFindTargetEntityAndGoSpy = vi.spyOn(
			searchNoCandidateEntity.behavior,
			'tickFindTargetEntityAndGo'
		);

		// 2) 캐릭터 틱을 진행한다.
		searchNoCandidateEntity.tick(FIRST_TICK);

		// 3) 후보가 없으면 타깃을 설정하지 않고 계속 진행한다.
		expect(tickFindTargetEntityAndGoSpy).toHaveBeenCalledWith(FIRST_TICK);
		expect(tickFindTargetEntityAndGoSpy.mock.results[0]?.value).toBe(false);
		expect(searchNoCandidateEntity.behavior.targetEntityId).toBeUndefined();
	});

	it('타깃 선택 방식에 따라 목표 엔티티 후보를 올바르게 필터링한다.', () => {
		// 1) explicit 대상 선택용 행동 액션을 준비한다.
		const firstBehavior = useBehavior().getFirstBehaviorByPriority(nonHoldingEntity);
		const rootBehaviorAction = useBehavior().getRootBehaviorAction(firstBehavior);
		const droppedItemInteraction = useInteraction()
			.getAllItemInteractions()
			.find((interaction) => interaction.item_id === droppedItemEntity.sourceId)!;
		rootBehaviorAction.target_selection_method = 'explicit';
		rootBehaviorAction.item_interaction_id = droppedItemInteraction.id;

		// 2) 더 가까운 다른 아이템을 추가하더라도 explicit 대상은 유지되어야 한다.
		const anotherItem = useItem()
			.getAllItems()
			.find((item) => item.id !== droppedItemEntity.sourceId)!;
		const anotherWorldItem = createWorldItem(anotherItem, { x: 105, y: 100 });
		const anotherItemEntity = new WorldItemEntity(
			nonHoldingEntity.worldContext,
			nonHoldingEntity.worldId,
			anotherWorldItem.id
		);
		anotherItemEntity.addToWorld();

		// 3) 캐릭터 틱을 진행한다.
		nonHoldingEntity.tick(FIRST_TICK);

		// 4) explicit으로 지정된 source의 엔티티가 타깃으로 선택된다.
		expect(nonHoldingEntity.behavior.targetEntityId).toBe(droppedItemEntity.id);
	});

	it('자기 자신은 목표 엔티티가 될 수 없다.', () => {
		// 1) 자기 자신을 대상으로 하는 character 상호작용 회복 데이터를 구성한다.
		const need = useCharacter().getNeed(Object.values(searchNoCandidateEntity.needs)[0]!.need_id);
		const selfCharacter = useCharacter().getCharacter(searchNoCandidateEntity.sourceId);
		const selfInteraction = createCharacterInteraction(selfCharacter, { type: 'fulfill' });
		createNeedFulfillment(need, {
			fulfillment_type: 'character',
			character_interaction_id: selfInteraction.id,
			increase_per_tick: 999,
		});

		// 2) 캐릭터 틱을 진행한다.
		searchNoCandidateEntity.tick(FIRST_TICK);

		// 3) 자기 자신은 후보에서 제외되어 타깃으로 선택되지 않는다.
		expect(searchNoCandidateEntity.behavior.targetEntityId).toBeUndefined();
	});

	it('다른 캐릭터의 목표 엔티티는 목표 엔티티 후보에서 제외한다.', () => {
		// 1) 같은 worldContext의 다른 캐릭터가 이미 해당 아이템을 목표로 예약한 상태를 만든다.
		const reservingCharacterEntityId =
			`character-reserving-${holdingEntity.instanceId}` as typeof nonHoldingEntity.id;
		nonHoldingEntity.worldContext.entities[reservingCharacterEntityId] = {
			id: reservingCharacterEntityId,
			behavior: {
				targetEntityId: droppedItemEntity.id,
			},
		} as never;

		// 2) 캐릭터 틱을 진행한다.
		nonHoldingEntity.tick(FIRST_TICK);

		// 3) 예약된 아이템은 후보에서 제외되어 타깃이 비어 있어야 한다.
		expect(nonHoldingEntity.behavior.targetEntityId).toBeUndefined();
	});

	it('다른 캐릭터 아이디가 기록된 아이템은 목표 엔티티 후보에서 제외한다.', () => {
		// 1) 아이템이 다른 캐릭터 소유 상태임을 기록한다.
		useWorld().updateWorldItem(droppedItemEntity.instanceId, {
			world_character_id: holdingEntity.instanceId,
		});

		// 2) 캐릭터 틱을 진행한다.
		nonHoldingEntity.tick(FIRST_TICK);

		// 3) 다른 캐릭터 소유 아이템은 후보에서 제외되어 타깃이 비어 있어야 한다.
		expect(nonHoldingEntity.behavior.targetEntityId).toBeUndefined();
	});

	it('목표 엔티티에 대한 핵심 상호작용을 상호작용 큐에 추가한다.', () => {
		// 1) 캐릭터 틱을 진행해 소지 아이템을 타깃으로 선택한다.
		holdingEntity.tick(FIRST_TICK);

		// 2) 소지 아이템 상호작용의 루트 액션 ID와 큐의 core ID를 비교한다.
		const heldInteraction = useInteraction()
			.getAllItemInteractions()
			.find((interaction) => interaction.item_id === heldItemEntity.sourceId)!;
		const rootAction = useInteraction().getRootInteractionAction(heldInteraction);

		expect(holdingEntity.behavior.interactionQueue.coreInteractionTargetId).toBe(
			InteractionIdUtils.create(rootAction)
		);
	});

	it('캐릭터와 가장 가까운 엔티티 중 목표 엔티티 후보가 있다면 해당 엔티티를 목표로 설정한다.', () => {
		// 1) 동일 source의 더 가까운/더 먼 후보 엔티티를 추가한다.
		const droppedItem = useItem().getItem(droppedItemEntity.sourceId);
		const nearWorldItem = createWorldItem(droppedItem, { x: 110, y: 100 });
		const nearItemEntity = new WorldItemEntity(
			nonHoldingEntity.worldContext,
			nonHoldingEntity.worldId,
			nearWorldItem.id
		);
		nearItemEntity.addToWorld();

		const farWorldItem = createWorldItem(droppedItem, { x: 500, y: 500 });
		const farItemEntity = new WorldItemEntity(
			nonHoldingEntity.worldContext,
			nonHoldingEntity.worldId,
			farWorldItem.id
		);
		farItemEntity.addToWorld();

		// 2) 캐릭터 틱을 진행한다.
		nonHoldingEntity.tick(FIRST_TICK);

		// 3) 가장 가까운 nearItemEntity가 타깃으로 선택된다.
		expect(nonHoldingEntity.behavior.targetEntityId).toBe(nearItemEntity.id);
	});
});
