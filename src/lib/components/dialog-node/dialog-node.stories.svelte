<script lang="ts" context="module">
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Components/DialogNode',
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import DialogNode from './dialog-node.svelte';
	import Button from '../ui/button/button.svelte';
	import { source, open, terminate } from './store';
	import type { DialogNode as DialogNodeType } from '.';
	import DiceRoll from '../dice-roll/dice-roll.svelte';
	import { onkeydown, onkeyup, onmousedown, onmouseup, onmouseleave } from '$lib/shortcut/events';

	// 스토리용 다이얼로그 노드 데이터
	const newSource: Record<string, DialogNodeType> = {
		'intro-1': {
			id: 'intro-1',
			type: 'narrative',
			speaker: '나레이터',
			text: '낯선 마을에 도착했다. 마을 입구에는 수상한 사람이 서있다.',
			diceRoll: {
				difficultyClass: 10,
				silent: true,
				success: {
					type: 'dialogNode',
					dialogNodeId: 'intro-2',
				},
				failure: {
					type: 'dialogNode',
					dialogNodeId: 'intro-2',
				},
			},
		},
		'intro-2': {
			id: 'intro-2',
			type: 'choice',
			speaker: '여행자',
			text: '어떻게 하시겠습니까?',
			choices: [
				{
					id: 'choice-talk',
					text: '말을 건넨다',
					diceRoll: {
						difficultyClass: 12,
						silent: false,
						success: {
							type: 'dialogNode',
							dialogNodeId: 'talk-success',
						},
						failure: {
							type: 'dialogNode',
							dialogNodeId: 'talk-failure',
						},
					},
				},
				{
					id: 'choice-ignore',
					text: '무시하고 지나간다',
					diceRoll: {
						difficultyClass: 8,
						silent: false,
						success: {
							type: 'dialogNode',
							dialogNodeId: 'ignore-success',
						},
						failure: {
							type: 'dialogNode',
							dialogNodeId: 'ignore-failure',
						},
					},
				},
			],
		},
		'talk-success': {
			id: 'talk-success',
			type: 'narrative',
			speaker: '수상한 사람',
			text: '"반갑소, 여행자여. 이 마을에는 숨겨진 보물이 있다오."',
			diceRoll: {
				difficultyClass: 0,
				silent: true,
				success: {
					type: 'terminate',
				},
				failure: {
					type: 'terminate',
				},
			},
		},
		'talk-failure': {
			id: 'talk-failure',
			type: 'narrative',
			speaker: '수상한 사람',
			text: '"......" (그는 아무 말도 하지 않고 사라진다)',
			diceRoll: {
				difficultyClass: 0,
				silent: true,
				success: {
					type: 'terminate',
				},
				failure: {
					type: 'terminate',
				},
			},
		},
		'ignore-success': {
			id: 'ignore-success',
			type: 'narrative',
			speaker: '나레이터',
			text: '조용히 마을로 들어갔다. 아무 일도 일어나지 않았다.',
			diceRoll: {
				difficultyClass: 0,
				silent: true,
				success: {
					type: 'terminate',
				},
				failure: {
					type: 'terminate',
				},
			},
		},
		'ignore-failure': {
			id: 'ignore-failure',
			type: 'narrative',
			speaker: '나레이터',
			text: '무시하려 했지만, 그 사람이 당신의 어깨를 붙잡는다...',
			diceRoll: {
				difficultyClass: 0,
				silent: true,
				success: {
					type: 'terminate',
				},
				failure: {
					type: 'terminate',
				},
			},
		},
	};

	// dialogNodes 스토어에 데이터 설정
	source.set(newSource);

	function openByNodeId(nodeId: string) {
		open(nodeId);
	}
</script>

<svelte:window {onkeydown} {onkeyup} {onmousedown} {onmouseup} {onmouseleave} />

<Story name="기본 - 스토어 함수 사용">
	<div class="flex flex-col gap-2">
		<div class="flex gap-2">
			<Button onclick={() => openByNodeId('intro-1')}>인트로 시작</Button>
			<Button onclick={() => openByNodeId('intro-2')}>선택지 보기</Button>
			<Button onclick={terminate}>다이얼로그 닫기</Button>
		</div>
		<p class="text-sm text-gray-600">open() 함수와 dialogNodes 스토어 사용 예제</p>
	</div>

	<DialogNode />
	<DiceRoll />
</Story>

<Story name="스토리 플로우 - 마을 입구">
	<div class="flex flex-col gap-2">
		<Button onclick={() => openByNodeId('intro-1')}>스토리 시작</Button>
		<p class="text-sm text-gray-600">연결된 여러 노드를 탐색할 수 있는 스토리</p>
	</div>

	<DialogNode />
	<DiceRoll />
</Story>

<Story name="내러티브 타입 - 말 걸기 성공">
	<div class="flex flex-col gap-2">
		<Button onclick={() => openByNodeId('talk-success')}>다이얼로그 열기</Button>
		<Button onclick={terminate}>닫기</Button>
	</div>

	<DialogNode />
	<DiceRoll />
</Story>

<Story name="내러티브 타입 - 말 걸기 실패">
	<div class="flex flex-col gap-2">
		<Button onclick={() => openByNodeId('talk-failure')}>다이얼로그 열기</Button>
		<Button onclick={terminate}>닫기</Button>
	</div>

	<DialogNode />
	<DiceRoll />
</Story>

<Story name="선택지 타입 - 행동 선택">
	<div class="flex flex-col gap-2">
		<Button onclick={() => openByNodeId('intro-2')}>다이얼로그 열기</Button>
		<Button onclick={terminate}>닫기</Button>
	</div>

	<DialogNode />
	<DiceRoll />
</Story>

<Story name="닫힌 상태">
	<DialogNode />
	<DiceRoll />
</Story>
