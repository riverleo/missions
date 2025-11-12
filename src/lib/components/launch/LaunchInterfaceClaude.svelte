<script lang="ts">
	import { Progress } from '$lib/components/ui/progress';

	interface TelemetryData {
		altitude: number;
		velocity: number;
		downrange: number;
		apogee: number;
		perigee: number;
		missionTime: string;
		stage: string;
		nextEvent: string;
		nextEventTime: string;
	}

	interface MissionEvent {
		name: string;
		time: string;
		completed: boolean;
		active: boolean;
	}

	let telemetry = $state<TelemetryData>({
		altitude: 0,
		velocity: 0,
		downrange: 0,
		apogee: 0,
		perigee: 0,
		missionTime: 'T+00:00:00',
		stage: 'PRE-LAUNCH',
		nextEvent: 'LIFTOFF',
		nextEventTime: 'T+00:00:00',
	});

	let missionEvents = $state<MissionEvent[]>([
		{ name: 'LIFTOFF', time: 'T+00:00:00', completed: false, active: true },
		{ name: 'MAX Q', time: 'T+01:12', completed: false, active: false },
		{ name: 'MECO', time: 'T+02:30', completed: false, active: false },
		{ name: 'STAGE SEPARATION', time: 'T+02:33', completed: false, active: false },
		{ name: 'SES', time: 'T+02:41', completed: false, active: false },
		{ name: 'FAIRING DEPLOYMENT', time: 'T+03:27', completed: false, active: false },
		{ name: 'SECO', time: 'T+08:46', completed: false, active: false },
	]);

	let missionProgress = $state(0);
	let isLaunched = $state(false);

	// Simulate launch telemetry
	function simulateLaunch() {
		if (isLaunched) return;
		isLaunched = true;

		let elapsed = 0;
		const interval = setInterval(() => {
			elapsed += 0.1;

			// Update telemetry
			telemetry.altitude = Math.min(Math.pow(elapsed * 2, 2), 400);
			telemetry.velocity = Math.min(elapsed * 200, 7800);
			telemetry.downrange = Math.min(elapsed * 50, 2000);
			telemetry.apogee = Math.min(Math.pow(elapsed * 1.8, 2) + 50, 450);
			telemetry.perigee = elapsed > 300 ? Math.min((elapsed - 300) * 2, 400) : 0;
			const minutes = Math.floor(elapsed / 60);
			const seconds = Math.floor(elapsed % 60);
			const milliseconds = Math.floor((elapsed % 1) * 100);
			telemetry.missionTime = `T+${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(milliseconds).padStart(2, '0')}`;

			// Update mission progress
			missionProgress = Math.min((elapsed / 526) * 100, 100);

			// Update mission events
			const elapsedSeconds = elapsed;
			missionEvents.forEach((event, index) => {
				const eventTimeSeconds = parseEventTime(event.time);
				if (elapsedSeconds >= eventTimeSeconds) {
					event.completed = true;
					event.active = false;
					if (index < missionEvents.length - 1) {
						missionEvents[index + 1].active = true;
					}
				}
			});

			// Update stage
			if (elapsed < 150) {
				telemetry.stage = 'FIRST STAGE';
			} else if (elapsed < 526) {
				telemetry.stage = 'SECOND STAGE';
			} else {
				telemetry.stage = 'ORBIT';
				clearInterval(interval);
			}

			// Update next event
			const nextEvent = missionEvents.find((e) => !e.completed);
			if (nextEvent) {
				telemetry.nextEvent = nextEvent.name;
				telemetry.nextEventTime = nextEvent.time;
			}

			if (elapsed >= 526) {
				clearInterval(interval);
			}
		}, 100);
	}

	function parseEventTime(time: string): number {
		const match = time.match(/T\+(\d+):(\d+)/);
		if (match) {
			return parseInt(match[1]) * 60 + parseInt(match[2]);
		}
		return 0;
	}
</script>

<div
	class="fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-background/80 backdrop-blur-xl dark:border-gray-800"
>
	<!-- Main Telemetry Bar -->
	<div class="px-8 py-5">
		<div class="flex items-stretch gap-6">
			<!-- Left Section: Telemetry Grid -->
			<div class="grid flex-1 grid-cols-5 gap-4">
				<!-- Altitude -->
				<div class="space-y-0.5">
					<div
						class="text-[9px] font-bold tracking-widest text-gray-400 uppercase dark:text-gray-500"
					>
						Altitude
					</div>
					<div class="flex items-baseline gap-1.5">
						<span
							class="text-3xl leading-none font-bold text-gray-900 tabular-nums dark:text-white"
						>
							{telemetry.altitude.toFixed(1)}
						</span>
						<span class="mb-0.5 text-xs font-semibold text-gray-400 dark:text-gray-500">km</span>
					</div>
				</div>

				<!-- Velocity -->
				<div class="space-y-0.5">
					<div
						class="text-[9px] font-bold tracking-widest text-gray-400 uppercase dark:text-gray-500"
					>
						Velocity
					</div>
					<div class="flex items-baseline gap-1.5">
						<span
							class="text-3xl leading-none font-bold text-gray-900 tabular-nums dark:text-white"
						>
							{telemetry.velocity.toFixed(0)}
						</span>
						<span class="mb-0.5 text-xs font-semibold text-gray-400 dark:text-gray-500">m/s</span>
					</div>
				</div>

				<!-- Downrange -->
				<div class="space-y-0.5">
					<div
						class="text-[9px] font-bold tracking-widest text-gray-400 uppercase dark:text-gray-500"
					>
						Downrange
					</div>
					<div class="flex items-baseline gap-1.5">
						<span
							class="text-3xl leading-none font-bold text-gray-900 tabular-nums dark:text-white"
						>
							{telemetry.downrange.toFixed(0)}
						</span>
						<span class="mb-0.5 text-xs font-semibold text-gray-400 dark:text-gray-500">km</span>
					</div>
				</div>

				<!-- Apogee -->
				<div class="space-y-0.5">
					<div
						class="text-[9px] font-bold tracking-widest text-gray-400 uppercase dark:text-gray-500"
					>
						Apogee
					</div>
					<div class="flex items-baseline gap-1.5">
						<span
							class="text-3xl leading-none font-bold text-gray-900 tabular-nums dark:text-white"
						>
							{telemetry.apogee.toFixed(0)}
						</span>
						<span class="mb-0.5 text-xs font-semibold text-gray-400 dark:text-gray-500">km</span>
					</div>
				</div>

				<!-- Perigee -->
				<div class="space-y-0.5">
					<div
						class="text-[9px] font-bold tracking-widest text-gray-400 uppercase dark:text-gray-500"
					>
						Perigee
					</div>
					<div class="flex items-baseline gap-1.5">
						<span
							class="text-3xl leading-none font-bold text-gray-900 tabular-nums dark:text-white"
						>
							{telemetry.perigee.toFixed(0)}
						</span>
						<span class="mb-0.5 text-xs font-semibold text-gray-400 dark:text-gray-500">km</span>
					</div>
				</div>
			</div>

			<!-- Divider -->
			<div class="w-px bg-gray-200 dark:bg-gray-800"></div>

			<!-- Center Section: Mission Time & Stage -->
			<div class="flex flex-col items-center justify-center gap-2 px-8">
				<div
					class="text-5xl leading-none font-bold tracking-tighter text-gray-900 tabular-nums dark:text-white"
				>
					{telemetry.missionTime}
				</div>
				<div
					class="border border-gray-900 px-3 py-1 text-[10px] font-bold tracking-widest text-gray-900 uppercase dark:border-white dark:text-white"
				>
					{telemetry.stage}
				</div>
			</div>

			<!-- Divider -->
			<div class="w-px bg-gray-200 dark:bg-gray-800"></div>

			<!-- Right Section: Next Event & Launch Button -->
			<div class="flex items-center gap-6 px-4">
				<div class="space-y-0.5">
					<div
						class="text-[9px] font-bold tracking-widest text-gray-400 uppercase dark:text-gray-500"
					>
						Next Event
					</div>
					<div class="text-lg leading-tight font-bold text-gray-900 dark:text-white">
						{telemetry.nextEvent}
					</div>
					<div class="text-xs font-semibold text-gray-500 dark:text-gray-400">
						{telemetry.nextEventTime}
					</div>
				</div>

				<!-- Launch Button -->
				<div class="flex-shrink-0">
					{#if !isLaunched}
						<button
							onclick={simulateLaunch}
							class="border-2 border-gray-900 px-6 py-2.5 text-sm font-bold tracking-wider text-gray-900 uppercase transition-all hover:bg-gray-900 hover:text-white active:scale-95 dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
						>
							Launch
						</button>
					{:else}
						<div
							class="flex items-center gap-2 border-2 border-green-500 px-6 py-2.5 text-sm font-bold tracking-wider text-green-500 uppercase"
						>
							<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"></div>
							Live
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Progress Bar -->
		<div class="mt-4">
			<Progress
				value={missionProgress}
				class="h-1 bg-gray-200 dark:bg-gray-900 [&>div]:bg-gray-900 dark:[&>div]:bg-white"
			/>
		</div>
	</div>

	<!-- Mission Timeline -->
	<div class="border-t border-gray-200 px-8 py-4 dark:border-gray-800">
		<div class="flex items-center justify-between gap-2">
			{#each missionEvents as event}
				<div class="flex flex-1 flex-col items-center gap-1.5">
					<div
						class="h-3 w-3 rounded-full border-2 transition-all {event.completed
							? 'border-green-500 bg-green-500'
							: event.active
								? 'animate-pulse border-gray-900 bg-gray-900 dark:border-white dark:bg-white'
								: 'border-gray-300 dark:border-gray-700'}"
					></div>
					<div
						class="text-center text-[9px] leading-tight font-bold tracking-wider uppercase {event.completed
							? 'text-green-600 dark:text-green-400'
							: event.active
								? 'text-gray-900 dark:text-white'
								: 'text-gray-400 dark:text-gray-600'}"
					>
						{event.name}
					</div>
					<div
						class="text-[8px] font-semibold tabular-nums {event.completed
							? 'text-green-500'
							: event.active
								? 'text-gray-600 dark:text-gray-400'
								: 'text-gray-400 dark:text-gray-600'}"
					>
						{event.time}
					</div>
				</div>
				{#if event !== missionEvents[missionEvents.length - 1]}
					<div
						class="-mx-1 h-[1.5px] flex-1 transition-all {event.completed
							? 'bg-green-500'
							: 'bg-gray-300 dark:bg-gray-800'}"
					></div>
				{/if}
			{/each}
		</div>
	</div>
</div>
