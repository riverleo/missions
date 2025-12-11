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
		AlertDialogTrigger,
	} from '$lib/components/ui/alert-dialog';
	import { IconTrash } from '@tabler/icons-svelte';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import { goto } from '$app/navigation';

	const { narrativeId }: { narrativeId: string } = $props();
	const { admin } = useNarrative();

	function onclick() {
		admin
			.remove(narrativeId)
			.then(() => {
				goto('/admin/narratives');
			})
			.catch((error) => {
				console.error('Failed to delete narrative:', error);
			});
	}
</script>

<AlertDialog>
	<AlertDialogTrigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon">
				<IconTrash class="h-4 w-4" />
				<span class="sr-only">Delete</span>
			</Button>
		{/snippet}
	</AlertDialogTrigger>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>대화 또는 효과를 삭제하시겠습니까?</AlertDialogTitle>
			<AlertDialogDescription>
				이 작업은 되돌릴 수 없습니다. 대화 또는 효과와 관련된 모든 데이터가 삭제됩니다.
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel>취소</AlertDialogCancel>
			<AlertDialogAction {onclick}>삭제</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
