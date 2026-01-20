import { useCurrent } from './use-current';
import { usePlayer } from './use-player';
import { useQuest } from './use-quest';
import { useChapter } from './use-chapter';
import { useTerrain } from './use-terrain';
import { useCharacter } from './use-character';
import { useCharacterBody } from './use-character-body';
import { useBuilding } from './use-building';
import { useNeed } from './use-need';
import { useNeedBehavior } from './use-need-behavior';
import { useConditionBehavior } from './use-condition-behavior';
import { useCondition } from './use-condition';
import { useItem } from './use-item';
import { useBehaviorPriority } from './use-behavior-priority';
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
	useCharacterBody().init();
	useBuilding().init();
	useNeed().init();
	useNeedBehavior().init();
	useConditionBehavior().init();
	useCondition().init();
	useItem().init();
	useBehaviorPriority().init();
	useWorld().init();
}
