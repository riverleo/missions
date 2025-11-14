import Root from './new-quest.svelte';
import Trigger from './new-quest-trigger.svelte';
import Content from './new-quest-content.svelte';
import type { Writable } from 'svelte/store';

export type NewQuestContext = Writable<{
	open: boolean;
}>;

export {
	Root,
	Trigger,
	Content,
	//
	Root as NewQuest,
	Trigger as NewQuestTrigger,
	Content as NewQuestContent,
};
