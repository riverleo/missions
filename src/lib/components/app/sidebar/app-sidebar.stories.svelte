<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Sidebar from './app-sidebar.svelte';

	const { Story } = defineMeta({
		title: 'Components/AppSidebar',
		component: Sidebar,
		tags: ['autodocs'],
		argTypes: {
			open: {
				control: { type: 'boolean' },
				description: 'Whether the sidebar is open or collapsed',
			},
		},
	});
</script>

<script>
	let open = $state(false);
</script>

<Story name="Default">
	{#snippet children()}
		<div class="space-y-4">
			<h2 class="text-2xl font-bold">Missions에 오신 것을 환영합니다</h2>
			<p class="text-muted-foreground">
				메인 컨텐츠 영역입니다. 사이드바를 통해 탐색과 빠른 액션을 수행할 수 있습니다.
			</p>
			<div class="grid gap-4">
				<div class="rounded-lg border p-4">
					<h3 class="mb-2 font-semibold">카드 1</h3>
					<p class="text-sm text-muted-foreground">메인 영역의 예시 컨텐츠입니다.</p>
				</div>
				<div class="rounded-lg border p-4">
					<h3 class="mb-2 font-semibold">카드 2</h3>
					<p class="text-sm text-muted-foreground">추가 예시 컨텐츠입니다.</p>
				</div>
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Sidebar Open" args={{ open }}>
	{#snippet children()}
		<div class="space-y-4">
			<h2 class="text-2xl font-bold">사이드바 열림</h2>
			<p class="text-muted-foreground">
				사이드바가 확장되어 전체 네비게이션 레이블과 옵션을 보여줍니다.
			</p>
		</div>
	{/snippet}
</Story>

<Story name="Sidebar Collapsed" args={{ open: false }}>
	{#snippet children()}
		<div class="space-y-4">
			<h2 class="text-2xl font-bold">사이드바 접힘</h2>
			<p class="text-muted-foreground">
				사이드바가 공간 절약을 위해 접혀있습니다. 호버하거나 클릭하여 펼칠 수 있습니다.
			</p>
		</div>
	{/snippet}
</Story>

<Story name="With Long Content">
	{#snippet children()}
		<div class="space-y-4">
			<h2 class="text-2xl font-bold">긴 컨텐츠 예시</h2>
			{#each Array(10) as _, i}
				<div class="rounded-lg border p-4">
					<h3 class="mb-2 font-semibold">섹션 {i + 1}</h3>
					<p class="text-sm text-muted-foreground">
						스크롤 가능한 컨텐츠와 함께 사이드바가 어떻게 작동하는지 보여줍니다. 사이드바는 고정되어
						있고 컨텐츠가 스크롤됩니다.
					</p>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>
