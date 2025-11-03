<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { toggleMode } from 'mode-watcher';
	import DndExample from '$lib/components/dnd-example.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { House, Settings, Users, FileText } from 'lucide-svelte';
</script>

<Sidebar.Provider>
	<div class="flex min-h-screen w-full">
		<Sidebar.Root>
			<Sidebar.Header>
				<div class="flex items-center gap-2 px-4 py-2">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
					>
						M
					</div>
					<div class="flex flex-col">
						<span class="text-sm font-semibold">Missions</span>
						<span class="text-xs text-muted-foreground">Your workspace</span>
					</div>
				</div>
			</Sidebar.Header>

			<Sidebar.Content>
				<Sidebar.Group>
					<Sidebar.GroupLabel>메뉴</Sidebar.GroupLabel>
					<Sidebar.GroupContent>
						<Sidebar.Menu>
							<Sidebar.MenuItem>
								<Sidebar.MenuButton>
									<House class="h-4 w-4" />
									<span>홈</span>
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
							<Sidebar.MenuItem>
								<Sidebar.MenuButton>
									<FileText class="h-4 w-4" />
									<span>문서</span>
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
							<Sidebar.MenuItem>
								<Sidebar.MenuButton>
									<Users class="h-4 w-4" />
									<span>팀</span>
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
							<Sidebar.MenuItem>
								<Sidebar.MenuButton>
									<Settings class="h-4 w-4" />
									<span>설정</span>
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						</Sidebar.Menu>
					</Sidebar.GroupContent>
				</Sidebar.Group>
			</Sidebar.Content>

			<Sidebar.Footer>
				<div class="p-4">
					<Button class="w-full" variant="outline" onclick={toggleMode}>다크 모드 토글</Button>
				</div>
			</Sidebar.Footer>
		</Sidebar.Root>

		<main class="flex-1">
			<header class="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
				<Sidebar.Trigger />
				<h1 class="text-lg font-semibold">대시보드</h1>
			</header>

			<div class="flex flex-col gap-4 p-8">
				<h1 class="text-4xl font-bold">Welcome to SvelteKit</h1>
				<p>
					Visit <a href="https://svelte.dev/docs/kit" class="text-primary underline"
						>svelte.dev/docs/kit</a
					> to read the documentation
				</p>

				<div class="gap-4">
					<Button variant="outline">Button</Button>
				</div>

				<div class="mt-8 border-t pt-8">
					<DndExample />
				</div>
			</div>
		</main>
	</div>
</Sidebar.Provider>
