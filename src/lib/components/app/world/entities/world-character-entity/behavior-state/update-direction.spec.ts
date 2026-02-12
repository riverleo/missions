import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import { vectorUtils } from '$lib/utils/vector';

describe('updateDirection(this: WorldCharacterEntityBehavior)', () => {
	let behavior: WorldCharacterEntityBehavior;
	let mockWorldCharacterEntity: Partial<WorldCharacterEntity>;

	beforeEach(() => {
		// Mock WorldCharacterEntity
		mockWorldCharacterEntity = {
			id: 'character-1' as any,
			instanceId: 'world-character-1' as any,
			onBodyAnimationComplete: vi.fn(() => vi.fn()),
			body: {
				position: vectorUtils.createVector(100, 100),
			} as any,
		};

		// Create behavior instance
		behavior = new WorldCharacterEntityBehavior(mockWorldCharacterEntity as WorldCharacterEntity);
	});

	it('경로가 비어있으면 아무것도 하지 않는다', () => {
		// Given: 빈 경로
		behavior.path = [];
		const initialDirection = behavior.direction;

		// When
		const result = behavior.updateDirection();

		// Then: 방향 변경 없음, undefined 반환
		expect(behavior.direction).toBe(initialDirection);
		expect(result).toBeUndefined();
	});

	it('경로에서 방향이 바뀌는 첫 지점을 기준으로 한다', () => {
		// Given: 오른쪽 → 왼쪽으로 방향이 바뀌는 경로 (x축)
		behavior.path = [
			vectorUtils.createVector(110, 100), // 시작
			vectorUtils.createVector(120, 100), // 오른쪽으로
			vectorUtils.createVector(130, 100), // 오른쪽으로 계속
			vectorUtils.createVector(120, 100), // 여기서 왼쪽으로 전환 (index 3)
			vectorUtils.createVector(110, 100), // 왼쪽으로 계속
		];

		// When
		const result1 = behavior.updateDirection();

		// Then: 첫 번째 세그먼트(오른쪽) 방향으로 설정, 방향 전환 직전 지점(index 2) 반환
		expect(behavior.direction).toBe('right');
		expect(result1).toEqual(vectorUtils.createVector(130, 100));

		// Given: 위로 이동 후 오른쪽으로 방향이 바뀌는 경로 (y축 포함)
		behavior.path = [
			vectorUtils.createVector(100, 110), // 시작
			vectorUtils.createVector(100, 120), // 위로 (y축만)
			vectorUtils.createVector(100, 130), // 위로 계속 (y축만)
			vectorUtils.createVector(110, 130), // x축 방향 시작 (오른쪽)
			vectorUtils.createVector(120, 130), // 오른쪽으로 계속
		];

		// When
		const result2 = behavior.updateDirection();

		// Then: y축 이동 후 x축 방향이 처음 결정되는 지점 반환
		expect(behavior.direction).toBe('right'); // 110 > 100이므로 right
		expect(result2).toEqual(vectorUtils.createVector(110, 130));
	});

	it('경로에서 y축으로 이동하는 경우 y축 이동이 끝나고 x축 방향이 처음 결정되는 지점을 기준으로 한다', () => {
		// Given: y축만 이동 후 x축 방향 시작
		behavior.path = [
			vectorUtils.createVector(100, 110), // 시작
			vectorUtils.createVector(100, 120), // y축만
			vectorUtils.createVector(110, 120), // x축 방향 시작 (오른쪽)
			vectorUtils.createVector(120, 120), // 오른쪽 계속
		];

		// When
		const result = behavior.updateDirection();

		// Then: x축 방향이 처음 결정되는 지점 반환
		expect(behavior.direction).toBe('right');
		expect(result).toEqual(vectorUtils.createVector(110, 120));
	});

	it('방향 전환 지점이 없으면 경로의 마지막 지점을 기준으로 한다', () => {
		// Given: 한 방향으로만 가는 경로
		behavior.path = [
			vectorUtils.createVector(110, 100),
			vectorUtils.createVector(120, 100),
			vectorUtils.createVector(130, 100),
		];

		// When
		const result = behavior.updateDirection();

		// Then: 경로 끝점 기준으로 방향 설정 (130 > 100이므로 right), 마지막 지점 반환
		expect(behavior.direction).toBe('right');
		expect(result).toEqual(vectorUtils.createVector(130, 100));
	});

	it('기준 지점과 현재 위치의 x 좌표의 차이를 비교하여 방향을 결정한다', () => {
		// Given: 현재 위치(100)보다 왼쪽(80)에 있는 경로
		behavior.path = [vectorUtils.createVector(90, 100), vectorUtils.createVector(80, 100)];

		// When
		const result1 = behavior.updateDirection();

		// Then: 왼쪽 방향, 기준 지점(80, 100) 반환
		expect(behavior.direction).toBe('left');
		expect(result1).toEqual(vectorUtils.createVector(80, 100));

		// Given: 현재 위치(100)보다 오른쪽(120)에 있는 경로
		behavior.path = [vectorUtils.createVector(110, 100), vectorUtils.createVector(120, 100)];

		// When
		const result2 = behavior.updateDirection();

		// Then: 오른쪽 방향, 기준 지점(120, 100) 반환
		expect(behavior.direction).toBe('right');
		expect(result2).toEqual(vectorUtils.createVector(120, 100));
	});

	it('차이가 threshold(5px) 이내면 방향을 변경하지 않는다', () => {
		// Given: threshold(5px) 이내의 작은 차이
		behavior.direction = 'left'; // 초기 방향
		behavior.path = [vectorUtils.createVector(103, 100)]; // 현재 위치(100)에서 3px 차이

		// When
		const result = behavior.updateDirection();

		// Then: 방향 변경 없음, 기준 지점(103, 100) 반환
		expect(behavior.direction).toBe('left');
		expect(result).toEqual(vectorUtils.createVector(103, 100));
	});
});
