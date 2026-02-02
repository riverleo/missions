import Matter from 'matter-js';
import { produce } from 'immer';
import type {
	WorldBuildingId,
	Building,
	WorldId,
	WorldBuildingCondition,
	ConditionId,
} from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { CATEGORY_BUILDING, CATEGORY_TILE, CELL_SIZE } from '$lib/constants';
import { useWorld } from '$lib/hooks/use-world';
import { useBuilding } from '$lib/hooks/use-building';
import { Entity } from '../entity.svelte';
import type { BeforeUpdateEvent, WorldContext } from '../../context';
import { decreaseConditions } from './decrease-conditions';

export class WorldBuildingEntity extends Entity {
	readonly type = 'building' as const;
	body: Matter.Body;
	worldBuildingConditions: Record<ConditionId, WorldBuildingCondition> = $state({});

	override get instanceId(): WorldBuildingId {
		return EntityIdUtils.instanceId<WorldBuildingId>(this.id);
	}

	constructor(worldContext: WorldContext, worldId: WorldId, worldBuildingId: WorldBuildingId) {
		super(worldContext, 'building', worldId, worldBuildingId);

		// 스토어에서 데이터 조회
		const {
			worldBuildingStore,
			worldBuildingConditionStore,
			getAllWorldBuildingConditions,
			getWorldBuilding,
		} = useWorld();
		const worldBuilding = getWorldBuilding(worldBuildingId);
		const building = this.building;

		if (!worldBuilding) {
			throw new Error(`Cannot create WorldBuildingEntity: missing data for id ${worldBuildingId}`);
		}

		// conditions 초기화 (스토어와 연결을 끊기 위해 spread로 복사)
		const buildingConditions = getAllWorldBuildingConditions().filter(
			(condition) => condition.world_building_id === worldBuildingId
		);
		this.worldBuildingConditions = {};
		for (const condition of buildingConditions) {
			this.worldBuildingConditions[condition.condition_id] = { ...condition };
		}

		// 타일 기반 크기 계산
		const width = building.cell_cols * CELL_SIZE;
		const height = building.cell_rows * CELL_SIZE;

		// 좌상단 타일 인덱스를 픽셀 좌표로 변환 후 건물 전체의 중심 계산
		const leftTopX = worldBuilding.cell_x * CELL_SIZE;
		const leftTopY = worldBuilding.cell_y * CELL_SIZE;
		const x = leftTopX + width / 2;
		const y = leftTopY + height / 2;

		// 바디 생성 (collider 및 위치 상태도 함께 설정됨)
		this.body = this.createBody('rectangle', width, height, x, y, {
			isStatic: true,
			collisionFilter: {
				category: CATEGORY_BUILDING,
				mask: CATEGORY_TILE, // 타일과 겹칠 수 없음
			},
		});
	}

	get building(): Building {
		const { worldBuildingStore, getAllWorldBuildingConditions, getWorldBuilding } = useWorld();
		const { buildingStore, getBuilding } = useBuilding();

		const worldBuilding = getWorldBuilding(this.instanceId);
		if (!worldBuilding) throw new Error(`WorldBuilding not found for id ${this.instanceId}`);

		const building = getBuilding(worldBuilding.building_id);
		if (!building) throw new Error(`Building not found for id ${worldBuilding.building_id}`);

		return building;
	}

	save(): void {
		// 건물은 static이므로 위치가 변경되지 않음
		// conditions 저장
		const { worldBuildingConditionStore, getAllWorldBuildingConditions, getWorldBuilding } =
			useWorld();
		worldBuildingConditionStore.update((state) =>
			produce(state, (draft) => {
				for (const condition of Object.values(this.worldBuildingConditions)) {
					const storeCondition = draft.data[condition.id];
					if (storeCondition) {
						storeCondition.value = condition.value;
					}
				}
			})
		);
	}

	update(_: BeforeUpdateEvent): void {
		// 건물은 static이므로 update 로직 없음
	}

	tick(tick: number): void {
		decreaseConditions(this);
	}
}
