<script lang="ts">
	import { Empty, EmptyContent, EmptyTitle, EmptyDescription } from '$lib/components/ui/empty';
</script>

<div class="flex h-full items-center justify-center">
	<Empty>
		<EmptyContent>
			<EmptyTitle>컨디션을 선택하세요</EmptyTitle>
			<EmptyDescription>
				왼쪽 목록에서 컨디션을 선택하거나 새로운 컨디션을 만들어주세요.
			</EmptyDescription>
		</EmptyContent>
	</Empty>
</div>
