import type {
	EntityId,
	BehaviorTargetId,
	InteractionTargetId,
	Behavior,
	Vector,
	SystemInteractionType,
} from '$lib/types';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import type { WorldCharacterEntityDirection } from '../index';
import update from './update';
import updateMove from './update-move';
import updateDirection from './update-direction';
import tick from './tick';
import tickFindBehaviorTarget from './tick-find-behavior-target';
import tickWaitIfIdle from './tick-wait-if-idle';
import tickFindTargetAndGo from './tick-find-target-and-go';
import tickActionIfSystemItemPick from './tick-action-if-system-item-pick';
import tickActionIfOnceItemUse from './tick-action-if-once-item-use';
import tickNextOrClear from './tick-next-or-clear';

/**
 * 현재 실행 중인 행동의 상태를 나타냅니다.
 * 캐릭터가 어떤 행동을 실행 중인지, 어떤 타겟을 대상으로 하는지,
 * 언제 시작했는지 등의 정보를 저장하고 관리합니다.
 */
export class WorldCharacterEntityBehavior {
	worldCharacterEntity: WorldCharacterEntity;

	// tick-find-behavior-target.ts
	behaviors = $state<Behavior[]>([]);
	behaviorTargetId = $state<BehaviorTargetId | undefined>();
	behaviorTargetStartTick = $state<number | undefined>();

	// tick-find-target-and-go.ts
	path = $state<Vector[]>([]);
	targetEntityId = $state<EntityId | undefined>();

	// tick-find-interaction-actions.ts
	systemInteractionTargetIds = $state<InteractionTargetId[]>();
	systemInteractionTargetStartTick = $state<number | undefined>();
	interactionTargetId = $state<InteractionTargetId | undefined>();
	interactionTargetStartTick = $state<number | undefined>();

	direction = $state<WorldCharacterEntityDirection>('right');

	update = update;
	updateMove = updateMove;
	updateDirection = updateDirection;
	tick = tick;
	tickFindBehaviorTarget = tickFindBehaviorTarget;
	tickWaitIfIdle = tickWaitIfIdle;
	tickFindAndGo = tickFindTargetAndGo;
	tickActionIfSystemItemPick = tickActionIfSystemItemPick;
	tickActionIfOnceItemUse = tickActionIfOnceItemUse;
	tickNextOrClear = tickNextOrClear;

	constructor(worldCharacterEntity: WorldCharacterEntity) {
		this.worldCharacterEntity = worldCharacterEntity;
	}

	/**
	 * 타겟 엔티티와 경로를 초기화합니다.
	 */
	clearTargetEntity(): void {
		this.path = [];
		this.targetEntityId = undefined;
	}

	/**
	 * 인터렉션 타겟과 시작 틱을 초기화합니다.
	 */
	clearInteractionTarget(): void {
		this.interactionTargetId = undefined;
		this.interactionTargetStartTick = undefined;
	}

	/**
	 * 행동 타겟을 설정합니다.
	 */
	setBehaviorTarget(behaviorTargetId: BehaviorTargetId, tick: number): void {
		this.behaviorTargetId = behaviorTargetId;
		this.behaviorTargetStartTick = tick;
	}

	/**
	 * 인터렉션 타겟을 설정합니다.
	 */
	setInteractionTarget(interactionTargetId: InteractionTargetId, tick: number): void {
		this.interactionTargetId = interactionTargetId;
		this.interactionTargetStartTick = tick;
	}

	/**
	 * 모든 상태를 초기화합니다.
	 */
	clear(): void {
		this.clearTargetEntity();
		this.clearInteractionTarget();
		this.behaviorTargetId = undefined;
		this.behaviorTargetStartTick = undefined;
	}
}
