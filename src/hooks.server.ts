import type { Handle } from '@sveltejs/kit';
import { getLocale } from '$lib/paraglide/runtime.js';

export const handle: Handle = async ({ event, resolve }) => {
	// URL에서 언어 추출
	const matches = event.url.pathname.match(/^\/([a-z]{2})\/([a-z]{2})/);
	const urlLanguage = matches ? matches[1] : 'ko';

	// 응답 생성 시 %lang% 플레이스홀더를 현재 언어로 교체
	return resolve(event, {
		transformPageChunk: ({ html }) => {
			return html.replace('%lang%', urlLanguage);
		}
	});
};
