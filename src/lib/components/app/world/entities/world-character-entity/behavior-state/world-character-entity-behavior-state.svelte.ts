import type { EntityId, BehaviorTargetId, InteractionTargetId } from '$lib/types';
import type { Vector } from '$lib/types/vector';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import type { WorldCharacterEntityDirection } from '../index';
import type { BeforeUpdateEvent } from '../../../context';
import update from './update';
import tick from './tick';

/**
 * 현재 실행 중인 행동의 상태를 나타냅니다.
 * 캐릭터가 어떤 행동을 실행 중인지, 어떤 타겟을 대상으로 하는지,
 * 언제 시작했는지 등의 정보를 저장하고 관리합니다.
 */
export class WorldCharacterEntityBehaviorState {
	worldCharacterEntity: WorldCharacterEntity;

	/** 이동 경로 */
	path = $state<Vector[]>([]);
	/** 캐릭터 방향 */
	direction = $state<WorldCharacterEntityDirection>('right');
	/** 현재 타겟 엔티티 ID */
	targetEntityId = $state<EntityId | undefined>();
	/** 현재 행동 타겟 ID */
	behaviorTargetId = $state<BehaviorTargetId | undefined>();
	/** 행동 타겟 시작 틱 */
	behaviorTargetStartTick = $state<number | undefined>();
	/** 현재 인터랙션 타겟 ID */
	interactionTargetId = $state<InteractionTargetId | undefined>();
	/** 인터랙션 시작 틱 */
	interactionStartTick = $state<number | undefined>();

	/**
	 * 경로를 따라 이동
	 */
	update: (event: BeforeUpdateEvent) => void;

	/**
	 * 캐릭터의 행동을 tick마다 처리합니다.
	 */
	tick: (tickNumber: number) => void;

	constructor(worldCharacterEntity: WorldCharacterEntity) {
		this.worldCharacterEntity = worldCharacterEntity;
		this.update = update.bind(this);
		this.tick = tick.bind(this);
	}

	/**
	 * 모든 상태를 초기화합니다.
	 */
	clear(): void {
		this.path = [];
		this.direction = 'right';
		this.targetEntityId = undefined;
		this.behaviorTargetId = undefined;
		this.behaviorTargetStartTick = undefined;
		this.interactionTargetId = undefined;
		this.interactionStartTick = undefined;
	}
}
