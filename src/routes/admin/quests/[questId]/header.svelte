<script lang="ts">
	import { Button } from '$lib/components/ui/button';
</script>

<header class="h-16 border-b px-6 flex items-center justify-between">
	<h1 class="text-xl font-semibold">퀘스트 이름</h1>
	<div class="flex gap-2">
		<Button variant="outline">수정</Button>
		<Button variant="destructive">삭제</Button>
	</div>
</header>
