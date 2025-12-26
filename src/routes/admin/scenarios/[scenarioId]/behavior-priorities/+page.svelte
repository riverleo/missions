<script lang="ts">
	import { Empty, EmptyContent, EmptyTitle, EmptyDescription } from '$lib/components/ui/empty';
</script>

<div class="flex h-full items-center justify-center">
	<Empty>
		<EmptyContent>
			<EmptyTitle>우선순위를 선택하세요</EmptyTitle>
			<EmptyDescription>
				왼쪽 목록에서 우선순위를 선택하거나 새로운 우선순위를 만들어주세요.
			</EmptyDescription>
		</EmptyContent>
	</Empty>
</div>
