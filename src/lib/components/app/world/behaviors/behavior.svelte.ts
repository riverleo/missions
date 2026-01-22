import type { BeforeUpdateEvent } from '../context';
import type { BehaviorId, WorldCharacterId } from '$lib/types';

export abstract class Behavior {
	readonly id: BehaviorId;
	abstract readonly type: string;
	readonly worldCharacterId: WorldCharacterId;

	constructor(id: BehaviorId, worldCharacterId: WorldCharacterId) {
		this.id = id;
		this.worldCharacterId = worldCharacterId;
	}

	// 행동의 우선도 계산 (0-100, 높을수록 우선)
	abstract getPriority(): number;

	// 매 프레임마다 호출되는 업데이트 로직
	abstract update(event: BeforeUpdateEvent): void;

	// 틱마다 호출되는 라이프사이클 (1초마다)
	abstract tick(tick: number): void;

	// 행동 시작 시 호출
	abstract onStart(): void;

	// 행동 종료 시 호출
	abstract onEnd(): void;
}
