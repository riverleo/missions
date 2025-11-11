<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import IconRocket from '@tabler/icons-svelte/icons/rocket';

	let {
		onBack,
		onComplete,
		mission = $bindable(),
	}: {
		onBack: () => void;
		onComplete: () => void;
		mission: string;
	} = $props();
</script>

<div class="mx-auto max-w-2xl space-y-6">
	<div class="space-y-2 text-center">
		<div class="mb-4 flex justify-center">
			<div class="flex size-20 items-center justify-center rounded-full bg-primary/10">
				<IconRocket class="size-10 text-primary" />
			</div>
		</div>
		<h1 class="text-2xl font-bold">당신의 미션을 적어주세요</h1>
		<p class="text-muted-foreground">
			이루고 싶은 목표, 해결하고 싶은 문제, 만들고 싶은 것을 자유롭게 적어주세요
		</p>
	</div>

	<div class="space-y-2">
		<Label for="mission">나의 미션</Label>
		<Textarea
			id="mission"
			placeholder="예: 사용자들이 쉽게 할 일을 관리하고 목표를 달성할 수 있는 RPG 스타일의 투두 앱을 만들고 싶습니다."
			bind:value={mission}
			rows={8}
			maxlength={500}
			class="resize-none"
		/>
		<p class="text-xs text-muted-foreground">{mission.length} / 500자</p>
	</div>

	<div class="rounded-lg border bg-muted/50 p-4">
		<h3 class="mb-2 font-semibold">💡 미션 작성 팁</h3>
		<ul class="space-y-1 text-sm text-muted-foreground">
			<li>• 구체적으로 작성할수록 좋습니다</li>
			<li>• 왜 이 미션이 중요한지 포함하면 도움이 됩니다</li>
			<li>• 측정 가능한 목표를 설정해보세요</li>
		</ul>
	</div>

	<div class="flex justify-between">
		<Button variant="outline" onclick={onBack}>뒤로</Button>
		<Button onclick={onComplete} class="gap-2">
			<IconRocket class="size-4" />
			시작하기
		</Button>
	</div>
</div>
