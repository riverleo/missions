import type { LayoutLoad } from './$types';
import { error } from '@sveltejs/kit';

// 지원하는 언어 목록
const SUPPORTED_LANGUAGES = ['ko', 'en', 'ja', 'zh'];

// 지원하는 국가 목록
const SUPPORTED_COUNTRIES = ['kr', 'us', 'jp', 'cn'];

export const load: LayoutLoad = ({ params }) => {
	const { language, country } = params;

	// 언어 검증
	if (!SUPPORTED_LANGUAGES.includes(language)) {
		throw error(404, `Unsupported language: ${language}`);
	}

	// 국가 검증
	if (!SUPPORTED_COUNTRIES.includes(country)) {
		throw error(404, `Unsupported country: ${country}`);
	}

	return {
		language,
		country,
		locale: `${language}-${country.toUpperCase()}`
	};
};
