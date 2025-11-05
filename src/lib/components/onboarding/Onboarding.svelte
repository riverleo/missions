<script lang="ts">
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import WorldExclamationIcon from '@tabler/icons-svelte/icons/world-exclamation';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';

	let step = $state(0);

	let missions = $state([
		{
			title: '아직 제품을 출시하기 전입니다.',
			description: '아직 구체적인 계획은 없지만 무언가 만들고 싶은 열망이 있습니다',
			value: 'launching',
		},
		{
			title: '제품을 시장에 내놓았고 충성도 있는 고객을 모았습니다.',
			description: '로드맵을 작성하고 실행 가능한 계획을 세웠습니다',
			value: 'penentrate',
		},
		{
			title: '우리의 제품은 경쟁 제품과 큰 격차를 갖고 있습니다.',
			description: '간단한 프로토타입을 만들어 아이디어를 검증하고 있습니다',
			value: 'gap',
		},
		{
			title: '우리의 제품은 시장의 표준입니다.',
			description: '최소 기능 제품을 출시하고 실제 사용자 피드백을 받고 있습니다',
			value: 'standard',
		},
	]);
</script>

{#if step === 0}
	<Empty.Root>
		<Empty.Header>
			<Empty.Media variant="icon">
				<WorldExclamationIcon />
			</Empty.Media>
			<Empty.Title>세상을 놀라게 할 준비가 되셨습니까?</Empty.Title>
			<Empty.Description>
				여기에 뭔가 설득력 있는 문장을 넣어서 읽는 사람을 감동시키자.
			</Empty.Description>
		</Empty.Header>
		<Empty.Content>
			<Button variant="outline" size="sm" onclick={() => (step = 1)}>
				클릭해서 세상 놀라게 하기
			</Button>
		</Empty.Content>
	</Empty.Root>
{:else if step === 1}
	<div class="mx-auto max-w-2xl space-y-6">
		<h1 class="text-2xl font-bold">당신의 미션은 지금 어느 단계 입니까?</h1>

		<RadioGroup.Root>
			{#each missions as mission (mission.value)}
				<div class="flex items-start gap-3">
					<RadioGroup.Item id={mission.value} value={mission.value} />
					<Label for={mission.value}>{mission.title}</Label>
				</div>
			{/each}
		</RadioGroup.Root>

		<div class="flex justify-end gap-2">
			<Button variant="outline" onclick={() => (step = 0)}>뒤로</Button>
			<Button>다음</Button>
		</div>
	</div>
{/if}
