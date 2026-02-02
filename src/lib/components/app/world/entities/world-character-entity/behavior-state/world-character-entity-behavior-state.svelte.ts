import Matter from 'matter-js';
import type { EntityId, BehaviorTargetId, InteractionTargetId, BehaviorAction } from '$lib/types';
import type { Vector } from '$lib/types/vector';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import type { WorldCharacterEntityDirection } from '../index';
import type { BeforeUpdateEvent } from '../../../context';
import { useBehavior } from '$lib/hooks/use-behavior';
import { useWorld } from '$lib/hooks/use-world';
import searchTargetAndSetPath from './search-target';
import executeGoAction from './actions/execute-go';
import executeInteractAction from './actions/execute-interact';
import executeFulfillAction from './actions/execute-fulfill';
import executeIdleAction from './actions/execute-idle';
import checkActionCompletion from './completion/check-completion';
import transitionToNextAction from './completion/transition';
import selectNewBehavior from './selection/select-behavior';

const { Body } = Matter;

/**
 * 현재 실행 중인 행동의 상태를 나타냅니다.
 * 캐릭터가 어떤 행동을 실행 중인지, 어떤 타겟을 대상으로 하는지,
 * 언제 시작했는지 등의 정보를 저장하고 관리합니다.
 */
export class WorldCharacterEntityBehaviorState {
	private worldCharacterEntity: WorldCharacterEntity;

	/** 이동 경로 */
	path = $state<Vector[]>([]);
	/** 캐릭터 방향 */
	direction = $state<WorldCharacterEntityDirection>('right');
	/** 현재 타겟 엔티티 ID */
	entityId = $state<EntityId | undefined>(undefined);
	/** 현재 행동 타겟 ID */
	behaviorTargetId = $state<BehaviorTargetId | undefined>(undefined);
	/** 행동 타겟 시작 틱 */
	behaviorTargetStartTick = $state<number | undefined>(undefined);
	/** 현재 인터랙션 타겟 ID */
	interactionTargetId = $state<InteractionTargetId | undefined>(undefined);
	/** 인터랙션 시작 틱 */
	interactionStartTick = $state<number | undefined>(undefined);

	constructor(worldCharacterEntity: WorldCharacterEntity) {
		this.worldCharacterEntity = worldCharacterEntity;
	}

	/**
	 * 모든 상태를 초기화합니다.
	 */
	clear(): void {
		this.path = [];
		this.direction = 'right';
		this.entityId = undefined;
		this.behaviorTargetId = undefined;
		this.behaviorTargetStartTick = undefined;
		this.interactionTargetId = undefined;
		this.interactionStartTick = undefined;
	}

	/**
	 * 경로를 따라 이동
	 */
	update(event: BeforeUpdateEvent): void {
		if (this.path.length === 0) {
			// path가 없으면 dynamic으로 전환 (중력 적용)
			Body.setStatic(this.worldCharacterEntity.body, false);
			return;
		}

		// path가 있으면 static으로 전환 (path 기반 이동)
		Body.setStatic(this.worldCharacterEntity.body, true);

		const targetPoint = this.path[0];
		if (!targetPoint) {
			return;
		}

		const currentVector = this.worldCharacterEntity.body.position;
		const delta = event.delta;
		const deltaSeconds = delta / 1000;

		// 목표 지점까지의 거리 계산
		const dx = targetPoint.x - currentVector.x;
		const dy = targetPoint.y - currentVector.y;

		// 이동 방향 업데이트
		if (dx > 0) {
			this.direction = 'right';
		} else if (dx < 0) {
			this.direction = 'left';
		}

		// 도착 판정 거리
		const arrivalThreshold = 5;

		if (Math.abs(dx) < arrivalThreshold && Math.abs(dy) < arrivalThreshold) {
			this.path = this.path.slice(1);
			return;
		}

		// 속도 설정
		const speed = 200;

		let newX = currentVector.x;
		let newY = currentVector.y;

		// X축 우선 이동
		if (Math.abs(dx) > arrivalThreshold) {
			const moveDistance = speed * deltaSeconds;
			if (Math.abs(dx) <= moveDistance) {
				newX = targetPoint.x;
			} else {
				newX = currentVector.x + Math.sign(dx) * moveDistance;
			}
			// X축 이동 중에는 Y축 고정
			newY = currentVector.y;
		}
		// X축 이동이 완료되면 Y축 이동
		else if (Math.abs(dy) > arrivalThreshold) {
			newX = targetPoint.x;

			const moveDistance = speed * deltaSeconds;
			if (Math.abs(dy) <= moveDistance) {
				newY = targetPoint.y;
			} else {
				newY = currentVector.y + Math.sign(dy) * moveDistance;
			}
		}

		Body.setPosition(this.worldCharacterEntity.body, { x: newX, y: newY });
	}

	/**
	 * 캐릭터의 행동을 tick마다 처리합니다.
	 */
	tick(tick: number): void {
		const { getBehaviorAction } = useBehavior();

		// 현재 행동 액션이 없으면 새로운 행동 선택
		if (!this.behaviorTargetId) {
			selectNewBehavior(this.worldCharacterEntity, tick);
			return;
		}

		// 현재 행동 액션 가져오기
		const behaviorAction = getBehaviorAction(this.behaviorTargetId);

		if (!behaviorAction) {
			// 액션을 찾을 수 없으면 행동 종료
			this.behaviorTargetId = undefined;
			return;
		}

		// 1. 액션 시작 시점: target_selection_method에 따라 타겟 클리어 여부 결정
		if (this.behaviorTargetStartTick === tick) {
			if (
				behaviorAction.type === 'go' ||
				behaviorAction.type === 'interact' ||
				behaviorAction.type === 'fulfill'
			) {
				// search: 무조건 새로 탐색
				if (behaviorAction.target_selection_method === 'search') {
					this.entityId = undefined;
					this.path = [];
				}
				// explicit: interaction의 엔티티 템플릿이 현재 타겟과 다르면 클리어
				else if (behaviorAction.target_selection_method === 'explicit') {
					if (this.entityId) {
						const shouldClearTarget = this.checkIfTargetMismatch(behaviorAction);
						if (shouldClearTarget) {
							this.entityId = undefined;
							this.path = [];
						}
					}
				}
				// search_or_continue: 타겟 유지
			}
		}

		// 2. Search: 타겟이 없으면 대상 탐색 및 경로 설정
		if (
			(behaviorAction.type === 'go' ||
				behaviorAction.type === 'interact' ||
				behaviorAction.type === 'fulfill') &&
			this.path.length === 0 &&
			!this.entityId
		) {
			searchTargetAndSetPath(this.worldCharacterEntity, behaviorAction);
			return; // 경로 설정 후 다음 tick에서 실행
		}

		// 3. 행동 실행
		if (behaviorAction.type === 'go') {
			executeGoAction(this.worldCharacterEntity, behaviorAction);
		} else if (behaviorAction.type === 'interact') {
			executeInteractAction(this.worldCharacterEntity, behaviorAction, tick);
		} else if (behaviorAction.type === 'fulfill') {
			executeFulfillAction(this.worldCharacterEntity, behaviorAction, tick);
		} else if (behaviorAction.type === 'idle') {
			executeIdleAction(this.worldCharacterEntity, behaviorAction);
		}

		// 4. Do until behavior_completion_type: 완료 조건 확인
		const isCompleted = checkActionCompletion(this.worldCharacterEntity, behaviorAction, tick);
		if (isCompleted) {
			transitionToNextAction(this.worldCharacterEntity, behaviorAction, tick);
		}
	}

	/**
	 * explicit 타겟 선택 시 현재 타겟이 interaction의 대상과 다른지 확인
	 */
	private checkIfTargetMismatch(behaviorAction: BehaviorAction): boolean {
		if (!this.entityId) return false;

		const { getEntityInstance, getEntityTemplateCandidateId, getInteraction } = useWorld();

		// 현재 타겟의 엔티티 타입과 템플릿 ID
		const entityInstance = getEntityInstance(this.entityId);
		if (!entityInstance) return false;

		const targetTemplateId = getEntityTemplateCandidateId(entityInstance);
		const entityType = entityInstance.entityType;

		// action의 interaction 가져오기
		const interaction = getInteraction(behaviorAction);
		if (!interaction) {
			// interaction이 없으면 search 모드이므로 타겟 유지
			return false;
		}

		// 타입이 다르면 클리어
		if (entityType !== interaction.interactionType) return true;

		// 특정 엔티티 지정 시 템플릿 ID 확인
		if (interaction.interactionType === 'building') {
			if (interaction.building_id && interaction.building_id !== targetTemplateId) {
				return true;
			}
		} else if (interaction.interactionType === 'item') {
			if (interaction.item_id && interaction.item_id !== targetTemplateId) {
				return true;
			}
		} else if (interaction.interactionType === 'character') {
			if (interaction.target_character_id && interaction.target_character_id !== targetTemplateId) {
				return true;
			}
		}

		// 기본 인터랙션(NULL)이면 모든 해당 타입 엔티티가 대상이므로 유지
		return false;
	}
}
