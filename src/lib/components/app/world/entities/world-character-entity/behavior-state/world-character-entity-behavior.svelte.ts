import type { EntityId, BehaviorTargetId, InteractionTargetId, Behavior } from '$lib/types';
import type { Vector } from '$lib/types/vector';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import type { WorldCharacterEntityDirection } from '../index';
import type { BeforeUpdateEvent } from '../../../context';
import update from './update';
import updateMove from './update-move';
import updateDirection from './update-direction';
import tick from './tick';
import tickInitialize from './tick-initialize';
import tickIdle from './tick-idle';
import tickFindAndGo from './tick-find-and-go';
import tickActionSystemPre from './tick-action-system-pre';
import tickActionFulfillItemUse from './tick-action-fulfill-item-use';
import tickActionSystemPost from './tick-action-system-post';
import tickCompletion from './tick-completion';

/**
 * 현재 실행 중인 행동의 상태를 나타냅니다.
 * 캐릭터가 어떤 행동을 실행 중인지, 어떤 타겟을 대상으로 하는지,
 * 언제 시작했는지 등의 정보를 저장하고 관리합니다.
 */
export class WorldCharacterEntityBehavior {
	worldCharacterEntity: WorldCharacterEntity;

	path = $state<Vector[]>([]);
	direction = $state<WorldCharacterEntityDirection>('right');
	targetEntityId = $state<EntityId | undefined>();
	behaviorTargetId = $state<BehaviorTargetId | undefined>();
	behaviorTargetStartTick = $state<number | undefined>();
	interactionTargetId = $state<InteractionTargetId | undefined>();
	interactionTargetStartTick = $state<number | undefined>();
	behaviors = $state<Behavior[]>([]);

	update: (event: BeforeUpdateEvent) => void;
	updateMove: (event: BeforeUpdateEvent) => void;
	updateDirection: () => void;
	tick: (tickNumber: number) => void;
	tickInitialize: (tick: number) => boolean;
	tickIdle: (tick: number) => boolean;
	tickFindAndGo: (tick: number) => boolean;
	tickActionSystemPre: (tick: number) => boolean;
	tickActionFulfillItemUse: (tick: number) => boolean;
	tickActionSystemPost: (tick: number) => boolean;
	tickCompletion: (tick: number) => void;

	constructor(worldCharacterEntity: WorldCharacterEntity) {
		this.worldCharacterEntity = worldCharacterEntity;
		this.update = update.bind(this);
		this.updateMove = updateMove.bind(this);
		this.updateDirection = updateDirection.bind(this);
		this.tick = tick.bind(this);
		this.tickInitialize = tickInitialize.bind(this);
		this.tickIdle = tickIdle.bind(this);
		this.tickFindAndGo = tickFindAndGo.bind(this);
		this.tickActionSystemPre = tickActionSystemPre.bind(this);
		this.tickActionFulfillItemUse = tickActionFulfillItemUse.bind(this);
		this.tickActionSystemPost = tickActionSystemPost.bind(this);
		this.tickCompletion = tickCompletion.bind(this);
	}

	/**
	 * 타겟 엔티티와 경로를 초기화합니다.
	 */
	clearTargetEntity(): void {
		this.path = [];
		this.direction = 'right';
		this.targetEntityId = undefined;
	}

	/**
	 * 모든 상태를 초기화합니다.
	 */
	clear(): void {
		this.clearTargetEntity();
		this.behaviors = [];
		this.behaviorTargetId = undefined;
		this.behaviorTargetStartTick = undefined;
		this.interactionTargetId = undefined;
		this.interactionTargetStartTick = undefined;
	}
}
