<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
	} from '$lib/components/ui/card';
	import IconRocket from '@tabler/icons-svelte/icons/rocket';
	import IconShieldCheck from '@tabler/icons-svelte/icons/shield-check';
	import IconBolt from '@tabler/icons-svelte/icons/bolt';
	import IconArrowRight from '@tabler/icons-svelte/icons/arrow-right';
	import { localizeHref } from '$lib/paraglide/runtime';

	const features = [
		{
			icon: IconRocket,
			title: 'Fast Development',
			description: 'Build modern web applications with SvelteKit and the latest web technologies.',
		},
		{
			icon: IconShieldCheck,
			title: 'Type Safe',
			description:
				'Full TypeScript support with end-to-end type safety for your entire application.',
		},
		{
			icon: IconBolt,
			title: 'High Performance',
			description: 'Optimized bundle size and lightning-fast runtime performance out of the box.',
		},
	];
</script>

<!-- Hero Section -->
<div class="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
	<div class="mx-auto max-w-3xl space-y-6">
		<h1 class="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
			우주 최초 롤플레잉 투두 리스트
			<span class="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
				당신의 인생, 당장 진행시켜
			</span>
		</h1>
		<p class="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
			우리의 제품을 사용하는 즉시 당신의 인생은 성공한 것이나 다름 없을 겁니다! 망설이지 말고 지금
			바로 시작하세요.
		</p>
		<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
			<Button size="lg" class="gap-2" href={localizeHref('/signin')}>
				Get Started
				<IconArrowRight class="size-4" />
			</Button>
			<Button size="lg" variant="outline">Learn More</Button>
		</div>
	</div>
</div>

<!-- Features Section -->
<div class="mx-auto max-w-6xl px-4 py-16">
	<div class="mb-12 text-center">
		<h2 class="text-3xl font-bold tracking-tight sm:text-4xl">Why Choose Us?</h2>
		<p class="mt-4 text-lg text-muted-foreground">
			Everything you need to build production-ready applications
		</p>
	</div>

	<div class="grid gap-6 md:grid-cols-3">
		{#each features as feature}
			<Card>
				<CardHeader>
					<div class="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
						<svelte:component this={feature.icon} class="size-6 text-primary" />
					</div>
					<CardTitle>{feature.title}</CardTitle>
					<CardDescription>{feature.description}</CardDescription>
				</CardHeader>
			</Card>
		{/each}
	</div>
</div>

<!-- CTA Section -->
<div class="mx-auto max-w-4xl px-4 py-16">
	<Card class="border-2">
		<CardContent class="flex flex-col items-center gap-6 p-8 text-center sm:p-12">
			<div class="space-y-4">
				<h3 class="text-2xl font-bold sm:text-3xl">Ready to get started?</h3>
				<p class="text-muted-foreground">
					Join thousands of developers building the next generation of web applications.
				</p>
			</div>
			<Button size="lg" class="gap-2" href={localizeHref('/signin')}>
				Start Building Now
				<IconArrowRight class="size-4" />
			</Button>
		</CardContent>
	</Card>
</div>
