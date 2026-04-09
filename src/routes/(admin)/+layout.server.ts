import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetUser();

	// 로그인하지 않은 경우
	if (!user) {
		throw redirect(303, '/');
	}

	// user_roles 조회 (0개=일반유저, 1개=정상, 2개 이상=데이터 꼬임 감지)
	const { data, error } = await locals.supabase
		.from('user_roles')
		.select('type')
		.eq('user_id', user.id)
		.maybeSingle();

	if (error) {
		console.error('user_roles query error:', error);
		throw redirect(303, '/');
	}

	// admin이 아닌 경우 (역할 없음 포함)
	if (!data || data.type !== 'admin') {
		throw redirect(303, '/');
	}
};
