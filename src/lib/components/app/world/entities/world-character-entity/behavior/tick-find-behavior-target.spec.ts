import { Fixture } from '$lib/hooks/fixture';
import { createOrGetBehaviorPriority, createOrGetNeedBehavior } from '$lib/hooks/fixture/utils';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';
import { useBehavior, useCharacter, useWorld } from '$lib/hooks';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import type { WorldCharacterNeed } from '$lib/types';

const FIRST_TICK = 10;
const SECOND_TICK = 20;
const PRESET_START_TICK = 2;
const HIGH_NEED_VALUE = 999;

describe('tickFindBehaviorTarget(tick: number)', () => {
	let entity: WorldCharacterEntity;
	let worldCharacterNeed: WorldCharacterNeed;

	beforeEach(() => {
		entity = Fixture.worldCharacterEntity.createForTickFindBehaviorTarget();
		worldCharacterNeed = Object.values(entity.needs)[0]!;
	});

	afterEach(() => {
		Fixture.reset();
	});

	it('행동 목록이 우선 순위에 따라 틱마다 갱신된다.', () => {
		// 1) 첫 틱에서 현재 월드 상태 기준 행동 목록을 계산한다.
		entity.tick(FIRST_TICK);
		const behaviorIds = [...entity.behavior.behaviorIds];

		const need = useCharacter().getNeed(worldCharacterNeed.need_id);
		// 2) 기존 후보보다 높은 우선순위의 욕구 행동을 추가한다.
		const nextBehavior = BehaviorIdUtils.behavior.to(
			createOrGetNeedBehavior(need, { need_threshold: worldCharacterNeed.value })
		);
		createOrGetBehaviorPriority(nextBehavior, { priority: 1000 });

		// 3) 다음 틱에서 행동 목록이 다시 계산되어야 한다.
		entity.tick(SECOND_TICK);

		expect(entity.behavior.behaviorIds).toEqual([nextBehavior.id, ...behaviorIds]);
	});

	describe('진행중인 행동 타깃이 있는 경우', () => {
		it('아무것도 하지 않고 계속 진행한다.', () => {
			const firstBehavior = useBehavior().getAllBehaviorsByPriority(entity.behavior)[0]!;
			const rootBehaviorAction = useBehavior().getRootBehaviorAction(firstBehavior);
			const behaviorTargetId = BehaviorIdUtils.create(rootBehaviorAction);

			// 이미 진행 중인 행동 타깃을 설정한다.
			entity.behavior.behaviorTargetId = behaviorTargetId;

			const setBehaviorTargetSpy = vi.spyOn(entity.behavior, 'setBehaviorTarget');

			entity.tick(FIRST_TICK);

			expect(setBehaviorTargetSpy).not.toHaveBeenCalled();
		});
	});

	describe('진행중인 행동 타깃이 없는 경우', () => {
		it('모든 상태를 초기화한다.', () => {
			const clearSpy = vi.spyOn(entity.behavior, 'clear');

			// 행동 타깃이 비어 있으면 새 행동 선정 전에 상태를 초기화한다.
			entity.tick(FIRST_TICK);

			expect(clearSpy).toHaveBeenCalled();
		});

		it('행동 목록의 첫번째를 새로운 행동 타깃으로 설정한다.', () => {
			const firstBehavior = useBehavior().getAllBehaviorsByPriority(entity.behavior)[0]!;
			const rootBehaviorAction = useBehavior().getRootBehaviorAction(firstBehavior);
			const expectedBehaviorTargetId = BehaviorIdUtils.create(rootBehaviorAction);
			const setBehaviorTargetSpy = vi.spyOn(entity.behavior, 'setBehaviorTarget');

			// 우선순위 1순위 행동의 루트 액션이 행동 타깃으로 설정되어야 한다.
			entity.tick(FIRST_TICK);

			expect(setBehaviorTargetSpy).toHaveBeenCalledWith(expectedBehaviorTargetId, FIRST_TICK);
		});

		it('행동 목록이 비어있는 경우, 중단 후 처음으로 돌아간다.', () => {
			// 욕구값을 높여 행동 트리거 조건을 의도적으로 깨뜨린다.
			worldCharacterNeed.value = HIGH_NEED_VALUE;

			entity.tick(FIRST_TICK);

			expect(entity.behavior.behaviorTargetId).toBeUndefined();
		});

		it('루트 액션이 설정될 때 행동 타깃 시작 틱을 현재 틱(useCurrent().getTick())으로 설정한다.', () => {
			const setBehaviorTargetSpy = vi.spyOn(entity.behavior, 'setBehaviorTarget');
			// 행동 타깃 설정 시점의 현재 틱이 시작 틱으로 전달되어야 한다.
			entity.tick(FIRST_TICK);

			expect(setBehaviorTargetSpy).toHaveBeenCalledWith(expect.any(String), FIRST_TICK);
		});

		it('새로 지정할 행동에 루트 액션이 없는 경우 에러가 발생한다.', () => {
			// 기존 행동을 비활성화해, 아래에서 만든 루트 없는 행동이 선택되도록 만든다.
			worldCharacterNeed.value = HIGH_NEED_VALUE;

			const need = useCharacter().getNeed(worldCharacterNeed.need_id);
			const needBehaviorWithoutRoot = createOrGetNeedBehavior(
				need,
				{
					character_id: entity.sourceId,
					need_threshold: HIGH_NEED_VALUE,
				},
				{ withRootAction: false }
			);

			expect(() => entity.tick(FIRST_TICK)).toThrow();
		});

		it('행동 타깃이 지정되었다면 다음 단계로 진행한다.', () => {
			const tickFindTargetEntityAndGoSpy = vi.spyOn(entity.behavior, 'tickFindTargetEntityAndGo');
			// 행동 타깃이 설정되면 즉시 다음 단계(대상 탐색)로 넘어간다.
			entity.tick(FIRST_TICK);

			expect(tickFindTargetEntityAndGoSpy).toHaveBeenCalledWith(FIRST_TICK);
		});
	});

	it('초기화는 현재 행동 타깃이 없을 때만 호출된다.', () => {
		const setBehaviorTargetSpy = vi.spyOn(entity.behavior, 'setBehaviorTarget');
		// 1회차: 행동 타깃이 없으므로 새로 설정된다.
		entity.tick(FIRST_TICK);
		expect(setBehaviorTargetSpy).toHaveBeenCalled();

		setBehaviorTargetSpy.mockClear();
		const firstBehavior = useBehavior().getAllBehaviorsByPriority(entity.behavior)[0]!;
		const rootBehaviorAction = useBehavior().getRootBehaviorAction(firstBehavior);
		// 2회차: 진행 중 행동 타깃을 미리 주입해 재선정이 일어나지 않게 만든다.
		entity.behavior.behaviorTargetId = BehaviorIdUtils.create(rootBehaviorAction);
		entity.behavior.behaviorTargetStartTick = PRESET_START_TICK;
		entity.tick(SECOND_TICK);

		expect(setBehaviorTargetSpy).not.toHaveBeenCalled();
	});

	it('새로운 행동 타깃을 찾을 수 없을 경우 중단 후 처음으로 돌아간다.', () => {
		// 모든 행동 트리거를 비활성화해 행동 후보를 없앤다.
		worldCharacterNeed.value = HIGH_NEED_VALUE;

		entity.tick(FIRST_TICK);

		expect(entity.behavior.behaviorTargetId).toBeUndefined();
	});

	it('트리거 조건이 아니면 행동 상태를 유지한다.', () => {
		const worldCharacter = useWorld().getWorldCharacter(entity.instanceId);
		const need = useCharacter().getNeed(worldCharacterNeed.need_id);

		const needBehavior = createOrGetNeedBehavior(need, {
			character_id: worldCharacter.character_id,
			need_threshold: worldCharacterNeed.value - 1,
		});
		const rootAction = useBehavior().getRootBehaviorAction(
			BehaviorIdUtils.behavior.to(needBehavior)
		);
		const behaviorTargetId = BehaviorIdUtils.create('need', needBehavior.id, rootAction.id);
		// 이미 선택된 행동 타깃이 있으면 동일 타깃을 유지해야 한다.
		entity.behavior.behaviorTargetId = behaviorTargetId;
		entity.behavior.behaviorTargetStartTick = PRESET_START_TICK;
		const setBehaviorTargetSpy = vi.spyOn(entity.behavior, 'setBehaviorTarget');

		entity.tick(SECOND_TICK);

		expect(setBehaviorTargetSpy).not.toHaveBeenCalled();
	});
});
