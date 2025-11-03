import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	// 기본 언어/국가로 리다이렉트
	throw redirect(307, '/ko/kr');
};
