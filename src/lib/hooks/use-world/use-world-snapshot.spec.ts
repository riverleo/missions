import { Fixture } from '$lib/hooks/fixture';
import {
	createOrGetWorld,
	createOrGetCharacter,
	createOrGetItem,
	createOrGetNeed,
	createOrGetScenario,
	createWorldCharacter,
	createWorldCharacterNeed,
	createWorldItem,
} from '$lib/hooks/fixture/utils';
import { useWorld } from './use-world';
import { usePlayer } from '../use-player';
import { useCurrent } from '../use-current';
import { produce } from 'immer';
import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PlayerScenario, PlayerScenarioId, ScenarioSnapshotId, WorldId } from '$lib/types';

/**
 * buildSnapshot에 필요한 useCurrent 컨텍스트(player, playerScenario)를 초기화한다.
 * createOrGetWorld()를 먼저 호출하여 fixture가 사용하는 player를 생성한 뒤,
 * 그 player로 playerScenario와 useCurrent를 설정한다.
 * (createOrGetPlayer의 set()이 store 데이터를 교체하므로, 별도 player를 만들면 ID 불일치 발생)
 */
function setupCurrentContext() {
	// createOrGetWorld → createOrGetScenario + createOrGetPlayer를 내부에서 호출
	createOrGetWorld();

	const player = Object.values(get(usePlayer().playerStore).data)[0]!;
	const scenario = createOrGetScenario();

	const playerScenario: PlayerScenario = {
		id: crypto.randomUUID() as PlayerScenarioId,
		player_id: player.id,
		scenario_id: scenario.id,
		status: 'in_progress' as const,
		current_tick: 0,
		created_at: new Date().toISOString(),
		user_id: player.user_id,
		scenario_snapshot_id: null as unknown as ScenarioSnapshotId,
	};

	usePlayer().playerScenarioStore.update((state) =>
		produce(state, (draft) => {
			draft.data[playerScenario.id] = playerScenario;
			draft.status = 'success';
		})
	);

	// useCurrent의 playerIdStore를 설정하여 derived store가 값을 갖도록 한다
	useCurrent().selectPlayer(player.id);
}

describe('WorldSnapshot 라운드트립', () => {
	beforeEach(() => {
		Fixture.reset();
		setupCurrentContext();
	});

	afterEach(() => {
		Fixture.reset();
	});

	it('빈 월드의 스냅샷을 빌드하면 빈 엔티티 레코드를 반환한다.', () => {
		const world = createOrGetWorld();
		const { buildSnapshot } = useWorld();

		const snapshot = buildSnapshot(world.id);

		const worldData = snapshot.worlds[world.id];
		expect(worldData).toBeDefined();
		expect(Object.keys(worldData!.worldCharacters)).toHaveLength(0);
		expect(Object.keys(worldData!.worldBuildings)).toHaveLength(0);
		expect(Object.keys(worldData!.worldItems)).toHaveLength(0);
		expect(Object.keys(worldData!.worldCharacterNeeds)).toHaveLength(0);
		expect(Object.keys(worldData!.worldBuildingConditions)).toHaveLength(0);
		expect(worldData!.worldTileMap).toBeUndefined();
	});

	it('캐릭터, 아이템, 욕구가 포함된 월드 스냅샷을 JSON 직렬화/역직렬화하면 데이터가 보존된다.', () => {
		const world = createOrGetWorld();
		const character = createOrGetCharacter();
		const item = createOrGetItem();
		const need = createOrGetNeed();

		const worldCharacter = createWorldCharacter(character, { x: 150, y: 200 });
		const worldItem = createWorldItem(item, { x: 300, y: 400, rotation: 45 });
		const worldCharacterNeed = createWorldCharacterNeed(worldCharacter, need, { value: 75 });

		const { buildSnapshot } = useWorld();
		const snapshot = buildSnapshot(world.id);

		// JSON 직렬화 → 역직렬화 (실제 localStorage/DB 저장 시뮬레이션)
		const json = JSON.stringify(snapshot);
		const restored = JSON.parse(json);

		// 월드 메타데이터 검증
		expect(restored.worlds[world.id].id).toBe(world.id);
		expect(restored.worlds[world.id].name).toBe(world.name);

		// 캐릭터 데이터 검증
		const restoredChar = restored.worlds[world.id].worldCharacters[worldCharacter.id];
		expect(restoredChar).toBeDefined();
		expect(restoredChar.x).toBe(150);
		expect(restoredChar.y).toBe(200);
		expect(restoredChar.character_id).toBe(character.id);

		// 아이템 데이터 검증
		const restoredItem = restored.worlds[world.id].worldItems[worldItem.id];
		expect(restoredItem).toBeDefined();
		expect(restoredItem.x).toBe(300);
		expect(restoredItem.y).toBe(400);
		expect(restoredItem.rotation).toBe(45);
		expect(restoredItem.item_id).toBe(item.id);

		// 욕구 데이터 검증
		const restoredNeed = restored.worlds[world.id].worldCharacterNeeds[worldCharacterNeed.id];
		expect(restoredNeed).toBeDefined();
		expect(restoredNeed.value).toBe(75);
		expect(restoredNeed.need_id).toBe(need.id);
	});

	it('스냅샷을 worldStore에 복원하면 원래 상태와 동일하다.', () => {
		const world = createOrGetWorld();
		const character = createOrGetCharacter();
		const item = createOrGetItem();
		const need = createOrGetNeed();

		const worldCharacter = createWorldCharacter(character, { x: 100, y: 200 });
		const worldItem = createWorldItem(item, { x: 50, y: 60 });
		const worldCharacterNeed = createWorldCharacterNeed(worldCharacter, need, { value: 42 });

		const { buildSnapshot, worldStore } = useWorld();

		// 1) 스냅샷 빌드
		const snapshot = buildSnapshot(world.id);

		// 2) JSON 라운드트립
		const json = JSON.stringify(snapshot);
		const restored = JSON.parse(json);

		// 3) worldStore를 리셋 후 복원된 스냅샷으로 설정
		worldStore.set({
			status: 'success',
			data: restored.worlds,
			error: undefined,
		});

		// 4) 복원된 스토어에서 데이터를 조회하여 원래 값과 비교
		const { getWorld, getWorldCharacter, getWorldItem, getWorldCharacterNeed } = useWorld();

		const restoredWorld = getWorld(world.id);
		expect(restoredWorld.id).toBe(world.id);
		expect(restoredWorld.name).toBe(world.name);

		const restoredChar = getWorldCharacter(worldCharacter.id);
		expect(restoredChar.x).toBe(100);
		expect(restoredChar.y).toBe(200);

		const restoredItem = getWorldItem(worldItem.id);
		expect(restoredItem.x).toBe(50);
		expect(restoredItem.y).toBe(60);

		const restoredNeed = getWorldCharacterNeed(worldCharacterNeed.id);
		expect(restoredNeed.value).toBe(42);
	});

	it('존재하지 않는 월드 ID로 스냅샷을 빌드하면 빈 worlds를 반환한다.', () => {
		createOrGetWorld();
		const { buildSnapshot } = useWorld();

		const snapshot = buildSnapshot('non-existent' as WorldId);

		expect(Object.keys(snapshot.worlds)).toHaveLength(0);
	});

	it('스냅샷에 snapshot 필드가 포함되지 않는다 (재귀 방지).', () => {
		const world = createOrGetWorld();
		const { buildSnapshot } = useWorld();

		const snapshot = buildSnapshot(world.id);
		const json = JSON.stringify(snapshot);
		const parsed = JSON.parse(json);

		// WorldData는 Omit<World, 'snapshot'>을 extend하므로 snapshot 필드가 없어야 한다
		expect(parsed.worlds[world.id]).not.toHaveProperty('snapshot');
	});

	it('엔티티 변경 후 빌드한 스냅샷에 변경 사항이 반영된다.', () => {
		const world = createOrGetWorld();
		const character = createOrGetCharacter();

		const worldCharacter = createWorldCharacter(character, { x: 0, y: 0 });

		const { buildSnapshot, worldStore } = useWorld();

		// 캐릭터 위치 변경 (틱에서 발생하는 변경 시뮬레이션)
		worldStore.update((state) =>
			produce(state, (draft) => {
				const wc = draft.data[world.id]?.worldCharacters[worldCharacter.id];
				if (wc) {
					wc.x = 999;
					wc.y = 888;
				}
			})
		);

		// 변경 후 스냅샷
		const snapshot = buildSnapshot(world.id);
		const snapshotChar = snapshot.worlds[world.id]?.worldCharacters[worldCharacter.id];
		expect(snapshotChar?.x).toBe(999);
		expect(snapshotChar?.y).toBe(888);
	});
});
