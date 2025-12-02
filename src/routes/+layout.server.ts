import type { User } from '@supabase/supabase-js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	const { user } = await locals.safeGetUser();

	return {
		user: user as User | undefined,
		cookies: cookies.getAll(),
	};
};
