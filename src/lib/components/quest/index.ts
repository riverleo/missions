import Root from './new-quest.svelte';
import Trigger from './new-quest-trigger.svelte';
import Content from './new-quest-content.svelte';

export type NewQuestContext = {
	open: boolean;
};

export {
	Root,
	Trigger,
	Content,
	//
	Root as NewQuest,
	Trigger as NewQuestTrigger,
	Content as NewQuestContent,
};
