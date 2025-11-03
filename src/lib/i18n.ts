import { getLocale } from '$lib/paraglide/runtime.js';

// 국가 매핑 (언어 → 기본 국가)
const DEFAULT_COUNTRIES: Record<string, string> = {
	ko: 'kr',
	en: 'us',
	ja: 'jp',
	zh: 'cn'
};

/**
 * 현재 로케일에 맞게 URL을 로컬라이즈합니다.
 * @param href - 로컬라이즈할 경로 (예: '/home', '/about')
 * @returns 로컬라이즈된 URL (예: '/ko/kr/home')
 */
export function localizeHref(href: string): string {
	const locale = getLocale();
	const country = DEFAULT_COUNTRIES[locale] || 'kr';

	// 이미 로컬라이즈된 URL인지 확인
	if (href.match(/^\/[a-z]{2}\/[a-z]{2}\//)) {
		return href;
	}

	// 절대 경로가 아니면 그대로 반환
	if (!href.startsWith('/')) {
		return href;
	}

	// 루트 경로 처리
	if (href === '/') {
		return `/${locale}/${country}`;
	}

	// 일반 경로 로컬라이즈
	return `/${locale}/${country}${href}`;
}

/**
 * 특정 언어로 URL을 로컬라이즈합니다.
 * @param href - 로컬라이즈할 경로
 * @param targetLocale - 대상 언어
 * @returns 로컬라이즈된 URL
 */
export function localizeHrefTo(href: string, targetLocale: string): string {
	const country = DEFAULT_COUNTRIES[targetLocale] || 'kr';

	// 이미 로컬라이즈된 URL에서 언어/국가 부분 교체
	if (href.match(/^\/[a-z]{2}\/[a-z]{2}(\/.*)?$/)) {
		return href.replace(/^\/[a-z]{2}\/[a-z]{2}/, `/${targetLocale}/${country}`);
	}

	// 절대 경로가 아니면 그대로 반환
	if (!href.startsWith('/')) {
		return href;
	}

	// 루트 경로 처리
	if (href === '/') {
		return `/${targetLocale}/${country}`;
	}

	// 일반 경로 로컬라이즈
	return `/${targetLocale}/${country}${href}`;
}

/**
 * 현재 경로에서 언어/국가를 추출합니다.
 * @param pathname - 현재 경로 (예: '/ko/kr/home')
 * @returns { language, country, path }
 */
export function parseLocalizedPath(pathname: string) {
	const match = pathname.match(/^\/([a-z]{2})\/([a-z]{2})(\/.*)?$/);
	if (!match) {
		return { language: 'ko', country: 'kr', path: pathname };
	}

	return {
		language: match[1],
		country: match[2],
		path: match[3] || '/'
	};
}
