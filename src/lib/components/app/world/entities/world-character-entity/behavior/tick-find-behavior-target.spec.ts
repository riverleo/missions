import { Fixture } from '$lib/hooks/fixture';
import { createOrGetBehaviorPriority, createOrGetNeedBehavior } from '$lib/hooks/fixture/utils';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';
import { useBehavior, useCharacter } from '$lib/hooks';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import type { WorldCharacterNeed } from '$lib/types';

const FIRST_TICK = 10;
const SECOND_TICK = 20;
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

	it('행동 대상 목록이 우선 순위에 따라 틱마다 갱신된다.', () => {
		// 1) 첫 틱에서 현재 월드 상태 기준 행동 목록을 계산한다.
		entity.tick(FIRST_TICK);
		const behaviorIds = [...entity.behavior.behaviorIds];

		const need = useCharacter().getNeed(worldCharacterNeed.need_id);
		// 2) 기존 후보보다 높은 우선순위의 욕구 행동을 추가한다.
		const nextBehavior = BehaviorIdUtils.behavior.to(
			createOrGetNeedBehavior(need, { need_threshold: worldCharacterNeed.value })
		);
		createOrGetBehaviorPriority(nextBehavior, { priority: 1000 });

		entity.tick(SECOND_TICK);

		// 3) 다음 틱의 행동 목록에서 높은 우선 순위의 행동이 맨 앞으로 나온다.
		expect(entity.behavior.behaviorIds).toEqual([nextBehavior.id, ...behaviorIds]);
	});

	describe('진행 중인 행동 대상이 있는 경우', () => {
		beforeEach(() => {
			const firstBehavior = useBehavior().getAllBehaviorsByPriority(entity.behavior)[0]!;
			const rootBehaviorAction = useBehavior().getRootBehaviorAction(firstBehavior);
			const behaviorTargetId = BehaviorIdUtils.create(rootBehaviorAction);

			// 진행 중인 행동 대상을 설정한다.
			entity.behavior.behaviorTargetId = behaviorTargetId;

			// 진행 중인 행동 대상이 없어야 한다.
			expect(entity.behavior.behaviorTargetId).toBeDefined();
		});

		it('아무것도 하지 않고 계속 진행한다.', () => {
			const setBehaviorTargetSpy = vi.spyOn(entity.behavior, 'setBehaviorTarget');

			entity.tick(FIRST_TICK);

			expect(setBehaviorTargetSpy).not.toHaveBeenCalled();
		});
	});

	describe('진행 중인 행동 대상이 없는 경우', () => {
		beforeEach(() => {
			// 진행 중인 행동 대상이 없어야 한다.
			expect(entity.behavior.behaviorTargetId).toBeUndefined();
		});

		it('우선 순위에 의해 정렬된 행동 대상 목록의 첫번째 행동 대상이 선택된다.', () => {
			const firstBehavior = useBehavior().getAllBehaviorsByPriority(entity.behavior)[0]!;
			const rootBehaviorAction = useBehavior().getRootBehaviorAction(firstBehavior);
			const expectedBehaviorTargetId = BehaviorIdUtils.create(rootBehaviorAction);
			const setBehaviorTargetSpy = vi.spyOn(entity.behavior, 'setBehaviorTarget');

			// 우선순위 1순위 행동의 루트 액션이 행동 대상으로 설정되어야 한다.
			entity.tick(FIRST_TICK);

			expect(setBehaviorTargetSpy).toHaveBeenCalledWith(expectedBehaviorTargetId, FIRST_TICK);
		});

		it('행동 목록이 비어있는 경우, 중단 후 처음으로 돌아간다.', () => {
			const tickFindBehaviorTargetSpy = vi.spyOn(entity.behavior, 'tickFindBehaviorTarget');
			const behaviors = useBehavior().getAllBehaviorsByPriority(entity.behavior);

			// 현재 캐릭터의 욕구가 행동 대상 목록에 존재한다.
			expect(behaviors.filter((c) => c.behaviorType === 'need').map((c) => c.need_id)).toContain(
				worldCharacterNeed.need_id
			);

			// 욕구값을 높여 행동 트리거 조건을 의도적으로 깨뜨린다.
			worldCharacterNeed.value = HIGH_NEED_VALUE;

			// 행동 대상 목록이 비어졌다.
			expect(useBehavior().getAllBehaviorsByPriority(entity.behavior)).toHaveLength(0);

			entity.tick(FIRST_TICK);

			// 로직이 중단되었다.
			expect(tickFindBehaviorTargetSpy.mock.results[0]?.value).toBe(true);
			expect(entity.behavior.behaviorTargetId).toBeUndefined();
		});

		it('행동 대상이 선택될 때 전달된 틱을 시작 틱으로 설정한다.', () => {
			const setBehaviorTargetSpy = vi.spyOn(entity.behavior, 'setBehaviorTarget');
			// 행동 대상 설정 시점의 전달 tick이 시작 틱 인자로 전달되어야 한다.
			entity.tick(FIRST_TICK);

			expect(setBehaviorTargetSpy).toHaveBeenCalledWith(expect.any(String), FIRST_TICK);
		});
	});
});
