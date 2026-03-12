import type { User } from '@supabase/supabase-js';
import type { UserId, UserRole } from '$lib/types';

type FrontPageAuthSnapshot = {
	user?: User;
	role?: Pick<UserRole, 'type'>;
};

type FrontPageAuthRefresh = () => Promise<FrontPageAuthSnapshot>;

export type FrontPageViewState =
	| 'signed_out'
	| 'anonymous'
	| 'signed_in_without_admin'
	| 'signed_in_admin';

export interface FrontPageSummary {
	viewState: FrontPageViewState;
	description: string;
	canEnterAdmin: boolean;
	shouldShowLoginForm: boolean;
	shouldShowAnonymousAction: boolean;
}

export interface FrontPageActionFeedback {
	isSuccess: boolean;
	message: string;
}

interface FrontPagePasswordLoginInput {
	identity: string;
	password: string;
	signInWithPassword: (credentials: {
		email: string;
		password: string;
	}) => Promise<{ error: Error | null }>;
	refreshAuthState: FrontPageAuthRefresh;
}

interface FrontPageAnonymousLoginInput {
	signInAnonymously: () => Promise<{
		data: {
			user: Pick<User, 'id'> | null;
		};
		error: Error | null;
	}>;
	createPlayer: (player: { user_id: UserId; name: string }) => Promise<unknown>;
	refreshAuthState: FrontPageAuthRefresh;
}

export function getFrontPageSummary(
	user: Pick<User, 'is_anonymous'> | undefined,
	role: Pick<UserRole, 'type'> | undefined
): FrontPageSummary {
	if (!user) {
		return {
			viewState: 'signed_out',
			description: '로그인 정보가 없습니다. 관리자 로그인 또는 익명 유저 생성을 선택해 주세요.',
			canEnterAdmin: false,
			shouldShowLoginForm: true,
			shouldShowAnonymousAction: true,
		};
	}

	if (role?.type === 'admin') {
		return {
			viewState: 'signed_in_admin',
			description: '관리자 권한이 확인되었습니다. /admin으로 이동할 수 있습니다.',
			canEnterAdmin: true,
			shouldShowLoginForm: false,
			shouldShowAnonymousAction: false,
		};
	}

	if (user.is_anonymous) {
		return {
			viewState: 'anonymous',
			description: '익명 유저입니다. 관리자 페이지에 들어가려면 아이디와 비밀번호로 로그인하세요.',
			canEnterAdmin: false,
			shouldShowLoginForm: true,
			shouldShowAnonymousAction: false,
		};
	}

	return {
		viewState: 'signed_in_without_admin',
		description:
			'로그인되었지만 관리자 권한이 없습니다. /admin 접근은 admin 역할 사용자만 가능합니다.',
		canEnterAdmin: false,
		shouldShowLoginForm: true,
		shouldShowAnonymousAction: false,
	};
}

export async function signInFrontPageWithPassword({
	identity,
	password,
	signInWithPassword,
	refreshAuthState,
}: FrontPagePasswordLoginInput): Promise<FrontPageActionFeedback> {
	// 입력값을 먼저 검증하고, 성공 시 세션과 역할을 다시 동기화한다.
	const normalizedIdentity = identity.trim();
	if (normalizedIdentity.length === 0 || password.length === 0) {
		return {
			isSuccess: false,
			message: '아이디와 비밀번호를 모두 입력해 주세요.',
		};
	}

	const { error } = await signInWithPassword({
		email: normalizedIdentity,
		password,
	});

	if (error) {
		return {
			isSuccess: false,
			message: '로그인에 실패했습니다. 아이디와 비밀번호를 확인해 주세요.',
		};
	}

	const snapshot = await refreshAuthState();
	if (!snapshot.user) {
		return {
			isSuccess: false,
			message: '로그인 후 세션 확인에 실패했습니다. 다시 시도해 주세요.',
		};
	}

	if (snapshot.role?.type !== 'admin') {
		return {
			isSuccess: true,
			message: '로그인되었지만 관리자 권한이 없습니다.',
		};
	}

	return {
		isSuccess: true,
		message: '관리자 로그인에 성공했습니다. /admin으로 이동할 수 있습니다.',
	};
}

export async function createFrontPageAnonymousUser({
	signInAnonymously,
	createPlayer,
	refreshAuthState,
}: FrontPageAnonymousLoginInput): Promise<FrontPageActionFeedback> {
	// 익명 세션을 만든 뒤 플레이어를 생성하고, 현재 인증 상태를 다시 불러온다.
	const { data, error } = await signInAnonymously();
	if (error) {
		return {
			isSuccess: false,
			message: '익명 유저 생성에 실패했습니다.',
		};
	}

	if (data.user) {
		await createPlayer({
			user_id: data.user.id as UserId,
			name: '모험가',
		});
	}

	await refreshAuthState();

	return {
		isSuccess: true,
		message: '익명 유저를 생성했습니다.',
	};
}
