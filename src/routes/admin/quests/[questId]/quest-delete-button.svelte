<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle,
		AlertDialogTrigger
	} from '$lib/components/ui/alert-dialog';
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import { goto } from '$app/navigation';

	const { questId }: { questId: string } = $props();
	const { admin } = useQuest();

	function onclick() {
		admin.remove(questId)
			.then(() => {
				goto('/admin/quests');
			})
			.catch((error) => {
				console.error('Failed to delete quest:', error);
			});
	}
</script>

<AlertDialog>
	<AlertDialogTrigger>
		{#snippet child({ props })}
			<Button {...props} variant="destructive">삭제</Button>
		{/snippet}
	</AlertDialogTrigger>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>퀘스트를 삭제하시겠습니까?</AlertDialogTitle>
			<AlertDialogDescription>
				이 작업은 되돌릴 수 없습니다. 퀘스트와 관련된 모든 데이터가 삭제됩니다.
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel>취소</AlertDialogCancel>
			<AlertDialogAction {onclick}>삭제</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
