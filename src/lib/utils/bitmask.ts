/**
 * Quarter-Tile의 bitmask 계산
 * 4개 셀의 존재 여부를 4비트로 표현
 *
 * @param current 현재 셀 존재 여부 (bit 0)
 * @param adj1 인접 셀 1 존재 여부 (bit 1)
 * @param adj2 인접 셀 2 존재 여부 (bit 2)
 * @param adj3 인접 셀 3 존재 여부 (bit 3)
 * @returns 0-15 범위의 bitmask (짝수 인덱스는 blank)
 */
export function calculate(
	current: boolean,
	adj1: boolean,
	adj2: boolean,
	adj3: boolean
): number {
	return (current ? 1 : 0) | (adj1 ? 2 : 0) | (adj2 ? 4 : 0) | (adj3 ? 8 : 0);
}
