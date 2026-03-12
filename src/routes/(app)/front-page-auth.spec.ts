import { describe, expect, it, vi } from 'vitest';
import {
	createFrontPageAnonymousUser,
	getFrontPageSummary,
	signInFrontPageWithPassword,
} from './front-page-auth';

describe('getFrontPageSummary(user, role)', () => {
	it('로그인 정보가 없으면 관리자 로그인과 익명 유저 생성을 모두 노출한다.', () => {
		expect(getFrontPageSummary(undefined, undefined)).toEqual({
			viewState: 'signed_out',
			description: '로그인 정보가 없습니다. 관리자 로그인 또는 익명 유저 생성을 선택해 주세요.',
			canEnterAdmin: false,
			shouldShowLoginForm: true,
			shouldShowAnonymousAction: true,
		});
	});

	it('익명 유저면 관리자 로그인만 노출한다.', () => {
		expect(getFrontPageSummary({ is_anonymous: true }, undefined)).toEqual({
			viewState: 'anonymous',
			description: '익명 유저입니다. 관리자 페이지에 들어가려면 아이디와 비밀번호로 로그인하세요.',
			canEnterAdmin: false,
			shouldShowLoginForm: true,
			shouldShowAnonymousAction: false,
		});
	});

	it('관리자 권한이 없는 로그인 유저면 권한 없음 메시지를 보여준다.', () => {
		expect(getFrontPageSummary({ is_anonymous: false }, undefined)).toEqual({
			viewState: 'signed_in_without_admin',
			description:
				'로그인되었지만 관리자 권한이 없습니다. /admin 접근은 admin 역할 사용자만 가능합니다.',
			canEnterAdmin: false,
			shouldShowLoginForm: true,
			shouldShowAnonymousAction: false,
		});
	});

	it('관리자 유저면 /admin 진입 가능 상태를 노출한다.', () => {
		expect(getFrontPageSummary({ is_anonymous: false }, { type: 'admin' })).toEqual({
			viewState: 'signed_in_admin',
			description: '관리자 권한이 확인되었습니다. /admin으로 이동할 수 있습니다.',
			canEnterAdmin: true,
			shouldShowLoginForm: false,
			shouldShowAnonymousAction: false,
		});
	});
});

describe('signInFrontPageWithPassword(identity, password)', () => {
	it('아이디 또는 비밀번호가 비어 있으면 실패 메시지를 반환한다.', async () => {
		await expect(
			signInFrontPageWithPassword({
				identity: '',
				password: '',
				signInWithPassword: vi.fn(),
				refreshAuthState: vi.fn(),
			})
		).resolves.toEqual({
			isSuccess: false,
			message: '아이디와 비밀번호를 모두 입력해 주세요.',
		});
	});

	it('로그인 실패 시 인증 오류 메시지를 반환한다.', async () => {
		const refreshAuthState = vi.fn();

		await expect(
			signInFrontPageWithPassword({
				identity: 'admin@example.com',
				password: 'wrong-password',
				signInWithPassword: vi.fn().mockResolvedValue({ error: new Error('invalid login') }),
				refreshAuthState,
			})
		).resolves.toEqual({
			isSuccess: false,
			message: '로그인에 실패했습니다. 아이디와 비밀번호를 확인해 주세요.',
		});

		expect(refreshAuthState).not.toHaveBeenCalled();
	});

	it('로그인 후 관리자 권한이 없으면 안내 메시지를 반환한다.', async () => {
		await expect(
			signInFrontPageWithPassword({
				identity: 'member@example.com',
				password: 'password',
				signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
				refreshAuthState: vi.fn().mockResolvedValue({
					user: { id: 'user-1', is_anonymous: false },
					role: undefined,
				}),
			})
		).resolves.toEqual({
			isSuccess: true,
			message: '로그인되었지만 관리자 권한이 없습니다.',
		});
	});

	it('관리자 로그인 성공 시 /admin 진입 가능 메시지를 반환한다.', async () => {
		await expect(
			signInFrontPageWithPassword({
				identity: 'admin@example.com',
				password: 'password',
				signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
				refreshAuthState: vi.fn().mockResolvedValue({
					user: { id: 'user-1', is_anonymous: false },
					role: { type: 'admin' },
				}),
			})
		).resolves.toEqual({
			isSuccess: true,
			message: '관리자 로그인에 성공했습니다. /admin으로 이동할 수 있습니다.',
		});
	});
});

describe('createFrontPageAnonymousUser()', () => {
	it('익명 로그인 실패 시 실패 메시지를 반환한다.', async () => {
		const createPlayer = vi.fn();
		const refreshAuthState = vi.fn();

		await expect(
			createFrontPageAnonymousUser({
				signInAnonymously: vi.fn().mockResolvedValue({
					data: { user: null },
					error: new Error('anonymous login failed'),
				}),
				createPlayer,
				refreshAuthState,
			})
		).resolves.toEqual({
			isSuccess: false,
			message: '익명 유저 생성에 실패했습니다.',
		});

		expect(createPlayer).not.toHaveBeenCalled();
		expect(refreshAuthState).not.toHaveBeenCalled();
	});

	it('익명 로그인 성공 시 플레이어를 만들고 세션을 갱신한다.', async () => {
		const createPlayer = vi.fn().mockResolvedValue(undefined);
		const refreshAuthState = vi.fn().mockResolvedValue({
			user: { id: 'anonymous-user', is_anonymous: true },
			role: undefined,
		});

		await expect(
			createFrontPageAnonymousUser({
				signInAnonymously: vi.fn().mockResolvedValue({
					data: { user: { id: 'anonymous-user' } },
					error: null,
				}),
				createPlayer,
				refreshAuthState,
			})
		).resolves.toEqual({
			isSuccess: true,
			message: '익명 유저를 생성했습니다.',
		});

		expect(createPlayer).toHaveBeenCalledWith({
			user_id: 'anonymous-user',
			name: '모험가',
		});
		expect(refreshAuthState).toHaveBeenCalledTimes(1);
	});
});
