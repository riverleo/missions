import { describe, expect, it, vi } from 'vitest';
import { load } from './+layout.server';

function createSupabaseResult(result: { data: { type: string } | null; error: Error | null }) {
	return {
		from: vi.fn().mockReturnValue({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					maybeSingle: vi.fn().mockResolvedValue(result),
				}),
			}),
		}),
	};
}

describe('load({ locals })', () => {
	it('로그인하지 않은 경우 /로 리다이렉트한다.', async () => {
		await expect(
			load({
				locals: {
					safeGetUser: vi.fn().mockResolvedValue({ user: undefined }),
					supabase: createSupabaseResult({ data: null, error: null }),
				},
			} as never)
		).rejects.toMatchObject({
			status: 303,
			location: '/',
		});
	});

	it('관리자 권한이 없으면 /로 리다이렉트한다.', async () => {
		await expect(
			load({
				locals: {
					safeGetUser: vi.fn().mockResolvedValue({ user: { id: 'user-1' } }),
					supabase: createSupabaseResult({ data: null, error: null }),
				},
			} as never)
		).rejects.toMatchObject({
			status: 303,
			location: '/',
		});
	});

	it('user_roles 조회 에러가 발생하면 /로 리다이렉트한다.', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

		await expect(
			load({
				locals: {
					safeGetUser: vi.fn().mockResolvedValue({ user: { id: 'user-1' } }),
					supabase: createSupabaseResult({
						data: null,
						error: new Error('query failed'),
					}),
				},
			} as never)
		).rejects.toMatchObject({
			status: 303,
			location: '/',
		});

		expect(consoleError).toHaveBeenCalled();
		consoleError.mockRestore();
	});

	it('관리자 권한이면 통과한다.', async () => {
		await expect(
			load({
				locals: {
					safeGetUser: vi.fn().mockResolvedValue({ user: { id: 'user-1' } }),
					supabase: createSupabaseResult({
						data: { type: 'admin' },
						error: null,
					}),
				},
			} as never)
		).resolves.toBeUndefined();
	});
});
