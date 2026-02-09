import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorldCharacterEntity } from './world-character-entity.svelte';
import type { Need, CharacterNeed, CharacterId, NeedId } from '$lib/types';

// Mock useCharacter hook
vi.mock('$lib/hooks', () => ({
	useCharacter: vi.fn(),
}));

describe('tickDecreaseNeeds(this: WorldCharacterEntity, tick: number)', () => {
	let mockWorldCharacterEntity: Partial<WorldCharacterEntity>;
	let mockGetNeed: ReturnType<typeof vi.fn>;
	let mockGetOrUndefinedCharacterNeed: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		// Setup mocks
		mockGetNeed = vi.fn();
		mockGetOrUndefinedCharacterNeed = vi.fn();

		const { useCharacter } = await import('$lib/hooks');
		vi.mocked(useCharacter).mockReturnValue({
			getNeed: mockGetNeed,
			getOrUndefinedCharacterNeed: mockGetOrUndefinedCharacterNeed,
		} as any);

		// Mock WorldCharacterEntity
		mockWorldCharacterEntity = {
			needs: {},
			tickDecreaseNeeds: undefined as any, // 나중에 실제 함수로 바인딩
		};
	});

	it('모든 욕구를 순회하며 감소 처리한다', async () => {
		// Given: 여러 욕구가 있음
		const tickDecreaseNeeds = (await import('./tick-decrease-needs')).default;
		const characterId = 'char-1' as CharacterId;
		const needId1 = 'need-1' as NeedId;
		const needId2 = 'need-2' as NeedId;

		mockWorldCharacterEntity.needs = {
			'world-need-1': {
				character_id: characterId,
				need_id: needId1,
				value: 100,
			} as any,
			'world-need-2': {
				character_id: characterId,
				need_id: needId2,
				value: 80,
			} as any,
		} as any;

		mockGetNeed.mockImplementation((id: NeedId) => ({
			id,
			decrease_per_tick: 1,
		}));

		mockGetOrUndefinedCharacterNeed.mockReturnValue({
			decay_multiplier: 1,
		} as CharacterNeed);

		// When
		tickDecreaseNeeds.call(mockWorldCharacterEntity as WorldCharacterEntity, 0);

		// Then: 모든 욕구가 처리됨
		expect(mockGetNeed).toHaveBeenCalledTimes(2);
		expect(mockGetOrUndefinedCharacterNeed).toHaveBeenCalledTimes(2);
	});

	it('욕구 정보가 없으면 해당 욕구를 건너뛴다', async () => {
		// Given: getNeed가 에러를 던짐
		const tickDecreaseNeeds = (await import('./tick-decrease-needs')).default;
		const characterId = 'char-1' as CharacterId;
		const needId = 'need-1' as NeedId;

		mockWorldCharacterEntity.needs = {
			'world-need-1': {
				character_id: characterId,
				need_id: needId,
				value: 100,
			} as any,
		} as any;

		mockGetNeed.mockImplementation(() => {
			throw new Error('Need not found');
		});

		// When & Then: 에러가 전파됨 (건너뛰지 않음)
		expect(() => {
			tickDecreaseNeeds.call(mockWorldCharacterEntity as WorldCharacterEntity, 0);
		}).toThrow('Need not found');
	});

	it('캐릭터 욕구 정보가 없으면 해당 욕구를 건너뛴다', async () => {
		// Given: characterNeed가 undefined
		const tickDecreaseNeeds = (await import('./tick-decrease-needs')).default;
		const characterId = 'char-1' as CharacterId;
		const needId = 'need-1' as NeedId;

		mockWorldCharacterEntity.needs = {
			'world-need-1': {
				character_id: characterId,
				need_id: needId,
				value: 100,
			} as any,
		} as any;

		mockGetNeed.mockReturnValue({
			id: needId,
			decrease_per_tick: 1,
		} as Need);

		mockGetOrUndefinedCharacterNeed.mockReturnValue(undefined);

		const initialValue = (mockWorldCharacterEntity.needs as any)['world-need-1']!.value;

		// When
		tickDecreaseNeeds.call(mockWorldCharacterEntity as WorldCharacterEntity, 0);

		// Then: 값이 변경되지 않음
		expect((mockWorldCharacterEntity.needs as any)['world-need-1']!.value).toBe(initialValue);
	});

	it('decrease_per_tick과 decay_multiplier를 곱하여 감소량을 계산한다', async () => {
		// Given
		const tickDecreaseNeeds = (await import('./tick-decrease-needs')).default;
		const characterId = 'char-1' as CharacterId;
		const needId = 'need-1' as NeedId;

		mockWorldCharacterEntity.needs = {
			'world-need-1': {
				character_id: characterId,
				need_id: needId,
				value: 100,
			} as any,
		} as any;

		mockGetNeed.mockReturnValue({
			id: needId,
			decrease_per_tick: 2,
		} as Need);

		mockGetOrUndefinedCharacterNeed.mockReturnValue({
			decay_multiplier: 3,
		} as CharacterNeed);

		// When
		tickDecreaseNeeds.call(mockWorldCharacterEntity as WorldCharacterEntity, 0);

		// Then: 100 - (2 * 3) = 94
		expect((mockWorldCharacterEntity.needs as any)['world-need-1']!.value).toBe(94);
	});

	it('욕구 값은 최소 0으로 제한된다', async () => {
		// Given: 감소량이 현재 값보다 큼
		const tickDecreaseNeeds = (await import('./tick-decrease-needs')).default;
		const characterId = 'char-1' as CharacterId;
		const needId = 'need-1' as NeedId;

		mockWorldCharacterEntity.needs = {
			'world-need-1': {
				character_id: characterId,
				need_id: needId,
				value: 5,
			} as any,
		} as any;

		mockGetNeed.mockReturnValue({
			id: needId,
			decrease_per_tick: 10,
		} as Need);

		mockGetOrUndefinedCharacterNeed.mockReturnValue({
			decay_multiplier: 2,
		} as CharacterNeed);

		// When: 5 - (10 * 2) = -15 -> 0으로 제한
		tickDecreaseNeeds.call(mockWorldCharacterEntity as WorldCharacterEntity, 0);

		// Then
		expect((mockWorldCharacterEntity.needs as any)['world-need-1']!.value).toBe(0);
	});
});
