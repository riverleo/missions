import type {
	Narrative,
	NarrativeDiceRoll,
	NarrativeDiceRollId,
	NarrativeId,
	NarrativeNode,
	NarrativeNodeChoice,
	NarrativeNodeChoiceId,
	NarrativeNodeId,
	PlayerRolledDice,
	RecordFetchState,
} from '$lib/types';
import type { Writable } from 'svelte/store';

// Types
export type DialogState =
	| { type: 'create' }
	| { type: 'update' | 'delete'; narrativeId: NarrativeId }
	| undefined;

export interface AdminStoreState {
	dialog: DialogState;
}
export type NarrativeStore = Writable<RecordFetchState<NarrativeId, Narrative>>;
export type NarrativeNodeStore = Writable<RecordFetchState<NarrativeNodeId, NarrativeNode>>;
export type NarrativeDiceRollStore = Writable<
	RecordFetchState<NarrativeDiceRollId, NarrativeDiceRoll>
>;
export type NarrativeNodeChoiceStore = Writable<
	RecordFetchState<NarrativeNodeChoiceId, NarrativeNodeChoice>
>;

export interface PlayStoreState {
	narrativeNode?: NarrativeNode; // 값이 있을 경우 대화 화면(`NarrativeNodePlay`) 표시
	narrativeDiceRoll?: NarrativeDiceRoll; // 값이 있을 경우 주사위 굴림 화면(`NarrativeDiceRollPlay`) 표시
	playerRolledDice?: PlayerRolledDice; // 값이 있을 경우 주사위 굴림 화면(`NarrativeDiceRollPlay`)에 결과 표시
}
export type PlayStore = Writable<PlayStoreState>;
