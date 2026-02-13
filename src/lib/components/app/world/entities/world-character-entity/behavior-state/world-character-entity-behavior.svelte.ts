import type {
	EntityId,
	BehaviorTargetId,
	InteractionQueue,
	Behavior,
} from '$lib/types';
import type { Vector } from '$lib/types/vector';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import type { WorldCharacterEntityDirection } from '../index';
import update from './update';
import updateMove from './update-move';
import updateDirection from './update-direction';
import tick from './tick';
import tickFindBehaviorTarget from './tick-find-behavior-target';
import tickNextOrClear from './tick-next-or-clear';
import tickFindTargetEntityAndGo from './tick-find-target-entity-and-go';
import tickEnqueueInteractionQueue from './tick-enqueue-interaction-queue';
import tickDequeueInteraction from './tick-dequeue-interaction';
import tickActionSystemItemPick from './tick-action-system-item-pick';

/**
 * 현재 실행 중인 행동의 상태를 나타냅니다.
 * 캐릭터가 어떤 행동을 실행 중인지, 어떤 타겟을 대상으로 하는지,
 * 언제 시작했는지 등의 정보를 저장하고 관리합니다.
 */
export class WorldCharacterEntityBehavior {
	worldCharacterEntity: WorldCharacterEntity;

	path = $state<Vector[]>([]);
	direction = $state<WorldCharacterEntityDirection>('right');
	// 현재 행동의 실행 대상 엔티티 ID.
	// 아이템의 경우 다른 캐릭터가 동일 대상을 동시에 잡지 않도록 런타임 예약 신호로도 사용한다.
	targetEntityId = $state<EntityId | undefined>();
	behaviorTargetId = $state<BehaviorTargetId | undefined>();
	behaviorTargetStartTick = $state<number | undefined>();
	interactionQueue = $state<InteractionQueue>({
		interactionTargetIds: [],
		status: 'enqueuing',
	});
	behaviors = $state<Behavior[]>([]);

	update = update;
	updateMove = updateMove;
	updateDirection = updateDirection;
	tick = tick;
	tickFindBehaviorTarget = tickFindBehaviorTarget;
	tickNextOrClear = tickNextOrClear;
	tickFindTargetEntityAndGo = tickFindTargetEntityAndGo;
	tickEnqueueInteractionQueue = tickEnqueueInteractionQueue;
	tickDequeueInteraction = tickDequeueInteraction;
	tickActionSystemItemPick = tickActionSystemItemPick;

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
	 * 행동 타겟을 설정합니다.
	 */
	setBehaviorTarget(behaviorTargetId: BehaviorTargetId, tick: number): void {
		this.behaviorTargetId = behaviorTargetId;
		this.behaviorTargetStartTick = tick;
	}

	/**
	 * 인터렉션 큐를 설정합니다.
	 */
	setInteractionQueue(queue: InteractionQueue): void {
		this.interactionQueue = queue;
	}

	/**
	 * 인터렉션 큐를 초기화합니다.
	 */
	clearInteractionQueue(): void {
		this.interactionQueue = {
			interactionTargetIds: [],
			status: 'enqueuing',
		};
	}

	/**
	 * 모든 상태를 초기화합니다.
	 */
	clear(): void {
		this.clearTargetEntity();
		this.clearInteractionQueue();
		this.behaviorTargetId = undefined;
		this.behaviorTargetStartTick = undefined;
	}
}
