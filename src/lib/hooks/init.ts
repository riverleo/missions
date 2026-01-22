import { useCurrent } from './use-current';
import { usePlayer } from './use-player';
import { useQuest } from './use-quest';
import { useChapter } from './use-chapter';
import { useTerrain } from './use-terrain';
import { useCharacter } from './use-character';
import { useBuilding } from './use-building';
import { useBehavior } from './use-behavior';
import { useItem } from './use-item';
import { useWorld } from './use-world';

/**
 * 모든 훅의 싱글톤 생성 및 초기화
 */
export function init() {
	useCurrent().init();
	usePlayer().init();
	useQuest().init();
	useChapter().init();
	useTerrain().init();
	useCharacter().init();
	useBuilding().init();
	useBehavior().init();
	useItem().init();
	useWorld().init();
}
