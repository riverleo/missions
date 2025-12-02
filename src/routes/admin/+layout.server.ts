import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetUser();

	// 로그인하지 않은 경우
	if (!user) {
		throw redirect(303, '/');
	}

	// user_roles 조회
	const { data, error } = await locals.supabase.from('user_roles').select('type').single();

	// admin이 아닌 경우
	if (error || data?.type !== 'admin') {
		throw redirect(303, '/');
	}
};
