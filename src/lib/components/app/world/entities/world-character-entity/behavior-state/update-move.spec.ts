import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import type { BeforeUpdateEvent } from '../../../context';
import { vectorUtils } from '$lib/utils/vector';

// Mock Matter.js
vi.mock('matter-js', () => ({
	default: {
		Body: {
			setStatic: vi.fn(),
			setPosition: vi.fn(),
		},
	},
}));

import Matter from 'matter-js';
const { Body } = Matter;

describe('updateMove(this: WorldCharacterEntityBehavior, event: BeforeUpdateEvent)', () => {
	let behavior: WorldCharacterEntityBehavior;
	let mockWorldCharacterEntity: Partial<WorldCharacterEntity>;
	let mockBody: Matter.Body;

	beforeEach(() => {
		// Create mock body
		mockBody = {
			position: vectorUtils.createVector(100, 100),
			isStatic: false,
		} as any;

		// Mock WorldCharacterEntity
		mockWorldCharacterEntity = {
			id: 'character-1' as any,
			instanceId: 'world-character-1' as any,
			onBodyAnimationComplete: vi.fn(() => vi.fn()),
			body: mockBody,
		};

		// Create behavior instance
		behavior = new WorldCharacterEntityBehavior(mockWorldCharacterEntity as WorldCharacterEntity);

		// Clear mocks
		vi.clearAllMocks();
	});

	it('경로가 비어있으면 body를 dynamic으로 전환한다', () => {
		// Given: 빈 경로
		behavior.path = [];
		const event: BeforeUpdateEvent = { delta: 16, source: {} as any, timestamp: 0, name: 'beforeUpdate' };

		// When
		behavior.updateMove(event);

		// Then: setStatic(body, false) 호출됨
		expect(Body.setStatic).toHaveBeenCalledWith(mockBody, false);
	});

	it('경로가 있으면 body를 static으로 전환한다', () => {
		// Given: 경로가 있음
		behavior.path = [vectorUtils.createVector(200, 100)];
		const event: BeforeUpdateEvent = { delta: 16, source: {} as any, timestamp: 0, name: 'beforeUpdate' };

		// When
		behavior.updateMove(event);

		// Then: setStatic(body, true) 호출됨
		expect(Body.setStatic).toHaveBeenCalledWith(mockBody, true);
	});

	it('경로의 첫 번째 지점을 목표로 설정한다', () => {
		// Given: 여러 지점이 있는 경로
		behavior.path = [
			vectorUtils.createVector(150, 100),
			vectorUtils.createVector(200, 100),
			vectorUtils.createVector(250, 100),
		];
		const event: BeforeUpdateEvent = { delta: 16, source: {} as any, timestamp: 0, name: 'beforeUpdate' };

		// When
		behavior.updateMove(event);

		// Then: 첫 번째 지점(150, 100)을 향해 이동
		const calls = vi.mocked(Body.setPosition).mock.calls;
		const lastCall = calls[calls.length - 1]!;
		expect(lastCall[1].x).toBeGreaterThan(100); // 오른쪽으로 이동
	});

	it('목표까지의 거리를 계산한다', () => {
		// Given: 목표 지점까지 거리가 있음
		const targetX = 200;
		behavior.path = [vectorUtils.createVector(targetX, 100)];
		const event: BeforeUpdateEvent = { delta: 16, source: {} as any, timestamp: 0, name: 'beforeUpdate' };

		// When
		behavior.updateMove(event);

		// Then: 이동 발생 (거리 계산이 정상적으로 됨)
		expect(Body.setPosition).toHaveBeenCalled();
	});

	it('arrivalThreshold(5px) 이내면 경로에서 제거한다', () => {
		// Given: 목표 지점에 거의 도착함 (3px 차이)
		behavior.path = [
			vectorUtils.createVector(103, 103),
			vectorUtils.createVector(200, 200),
		];
		const event: BeforeUpdateEvent = { delta: 16, source: {} as any, timestamp: 0, name: 'beforeUpdate' };

		// When
		behavior.updateMove(event);

		// Then: 첫 번째 지점이 제거됨
		expect(behavior.path.length).toBe(1);
		expect(behavior.path[0]?.x).toBe(200);
	});

	it('X축을 우선으로 이동한다', () => {
		// Given: X, Y 모두 이동이 필요한 지점
		behavior.path = [vectorUtils.createVector(200, 200)];
		const event: BeforeUpdateEvent = { delta: 16, source: {} as any, timestamp: 0, name: 'beforeUpdate' };

		// When
		behavior.updateMove(event);

		// Then: X축만 변경되고 Y는 고정
		const calls = vi.mocked(Body.setPosition).mock.calls;
		const lastCall = calls[calls.length - 1]!;
		expect(lastCall[1].x).toBeGreaterThan(100); // X 이동
		expect(lastCall[1].y).toBe(100); // Y 고정
	});

	it('X축 이동 중에는 Y축을 고정한다', () => {
		// Given: X축 이동이 필요함
		behavior.path = [vectorUtils.createVector(150, 200)];
		const event: BeforeUpdateEvent = { delta: 16, source: {} as any, timestamp: 0, name: 'beforeUpdate' };

		// When
		behavior.updateMove(event);

		// Then: Y축은 현재 위치 유지
		const calls = vi.mocked(Body.setPosition).mock.calls;
		const lastCall = calls[calls.length - 1]!;
		expect(lastCall[1].y).toBe(100);
	});

	it('X축 완료 후 Y축으로 이동한다', () => {
		// Given: X축 이동이 완료된 상태 (arrivalThreshold 이내)
		mockBody.position = vectorUtils.createVector(200, 100);
		behavior.path = [vectorUtils.createVector(200, 200)];
		const event: BeforeUpdateEvent = { delta: 16, source: {} as any, timestamp: 0, name: 'beforeUpdate' };

		// When
		behavior.updateMove(event);

		// Then: Y축으로 이동
		const calls = vi.mocked(Body.setPosition).mock.calls;
		const lastCall = calls[calls.length - 1]!;
		expect(lastCall[1].x).toBe(200); // X 고정
		expect(lastCall[1].y).toBeGreaterThan(100); // Y 이동
	});

	it('speed(200) * deltaSeconds 만큼 이동한다', () => {
		// Given: delta = 100ms (0.1초)
		behavior.path = [vectorUtils.createVector(200, 100)];
		const event: BeforeUpdateEvent = { delta: 100, source: {} as any, timestamp: 0, name: 'beforeUpdate' };

		// When
		behavior.updateMove(event);

		// Then: 100 + (200 * 0.1) = 120
		const calls = vi.mocked(Body.setPosition).mock.calls;
		const lastCall = calls[calls.length - 1]!;
		expect(lastCall[1].x).toBe(120);
	});

	it('목표 지점 오버슈팅을 방지한다', () => {
		// Given: 이동 거리가 남은 거리보다 큼 (10px 남았는데 20px 이동)
		behavior.path = [vectorUtils.createVector(110, 100)];
		const event: BeforeUpdateEvent = { delta: 100, source: {} as any, timestamp: 0, name: 'beforeUpdate' }; // 0.1초 = 20px 이동

		// When
		behavior.updateMove(event);

		// Then: 목표 지점에 정확히 위치
		const calls = vi.mocked(Body.setPosition).mock.calls;
		const lastCall = calls[calls.length - 1]!;
		expect(lastCall[1].x).toBe(110); // 오버슈팅 없이 정확히 110
	});
});
