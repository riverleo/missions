export type JosaType = '이가' | '을를' | '은는' | '와과' | '으로로';

export function josa(word: string, type: JosaType): string {
	const lastChar = word.charAt(word.length - 1);
	const code = lastChar.charCodeAt(0) - 0xac00;

	let particle: string;

	if (code < 0 || code > 11171) {
		// 한글이 아닌 경우 기본값 반환
		if (type === '이가') particle = '가';
		else if (type === '을를') particle = '를';
		else if (type === '은는') particle = '는';
		else if (type === '와과') particle = '과';
		else if (type === '으로로') particle = '으로';
		else particle = '';
	} else {
		const finalConsonant = code % 28;
		const hasFinalConsonant = finalConsonant !== 0;

		if (type === '이가') {
			particle = hasFinalConsonant ? '이' : '가';
		} else if (type === '을를') {
			particle = hasFinalConsonant ? '을' : '를';
		} else if (type === '은는') {
			particle = hasFinalConsonant ? '은' : '는';
		} else if (type === '와과') {
			particle = hasFinalConsonant ? '과' : '와';
		} else if (type === '으로로') {
			// ㄹ 받침(8)이거나 받침이 없으면 '로', 그 외에는 '으로'
			particle = finalConsonant === 0 || finalConsonant === 8 ? '로' : '으로';
		} else {
			particle = '';
		}
	}

	return word + particle;
}
