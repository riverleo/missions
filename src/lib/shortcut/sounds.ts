let audioContext: AudioContext | null = null;

function getAudioContext() {
	if (!audioContext) {
		audioContext = new AudioContext();
	}
	return audioContext;
}

type SoundType = 'warp';

const configs: Record<
	SoundType,
	{
		frequency: { start: number; end: number };
		gain: { start: number; end: number };
		duration: number;
	}
> = {
	warp: {
		frequency: { start: 200, end: 1200 },
		gain: { start: 0.2, end: 0.01 },
		duration: 0.12,
	},
};

function play(type: SoundType) {
	try {
		const ctx = getAudioContext();
		const config = configs[type];

		const oscillator = ctx.createOscillator();
		const gainNode = ctx.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(ctx.destination);

		oscillator.frequency.setValueAtTime(config.frequency.start, ctx.currentTime);
		oscillator.frequency.exponentialRampToValueAtTime(
			config.frequency.end,
			ctx.currentTime + config.duration
		);

		gainNode.gain.setValueAtTime(config.gain.start, ctx.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(config.gain.end, ctx.currentTime + config.duration);

		oscillator.start(ctx.currentTime);
		oscillator.stop(ctx.currentTime + config.duration);
	} catch (error) {
		console.warn('Failed to play shortcut sound:', error);
	}
}

const sounds = {
	play: play,
};

export default sounds;
