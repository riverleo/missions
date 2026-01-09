import type { LoopMode } from '$lib/types';
import type { AtlasMetadata } from '$lib/types/atlas';
import { atlases, DEFAULT_FPS, type SpriteAnimation } from './index';

const DEFAULT_FRAME_COUNT = 1; // fallback when metadata is missing

export class SpriteAnimator {
	private atlasName: string;
	private metadata: AtlasMetadata | undefined = undefined;
	private atlasUrl: string | undefined = undefined;
	private animations = new Map<string, SpriteAnimation>();
	private frameTimer: NodeJS.Timeout | undefined = undefined;
	private direction: 1 | -1 = 1;

	currentAnimation = $state<string | undefined>(undefined);
	currentFrame = $state(0);

	private constructor(atlasName: string) {
		this.atlasName = atlasName;
	}

	static async create(atlasName: string) {
		const animator = new SpriteAnimator(atlasName);
		await animator.load();
		return animator;
	}

	private async load() {
		try {
			// atlases에서 메타데이터 찾기
			this.metadata = atlases[this.atlasName];
			if (!this.metadata) {
				console.warn(`Atlas "${this.atlasName}" not found in atlases.json`);
				return;
			}

			// 이미지만 동적 로드
			const atlasModule = await import(`$lib/assets/atlas/generated/${this.atlasName}.png`);
			this.atlasUrl = atlasModule.default;
		} catch (error) {
			console.error(`Failed to load atlas for ${this.atlasName}:`, error);
		}
	}

	init({ name, from, to, fps }: SpriteAnimation) {
		this.animations.set(name, { name, from, to, fps });
	}

	play({
		name,
		loop = 'loop',
		onLoop,
		onComplete,
	}: {
		name: string;
		loop?: LoopMode;
		onLoop?: () => void;
		onComplete?: () => void;
	}) {
		const animation = this.animations.get(name);
		if (!animation) {
			console.warn(`Animation "${name}" not found`);
			return;
		}

		// 이전 애니메이션 정지
		this.stop();

		this.currentAnimation = name;
		this.direction = 1; // 항상 정방향으로 시작

		// from과 to가 같으면 정적 이미지 (타이머 불필요)
		const { from, to } = this.range;
		this.currentFrame = from;
		if (from === to) {
			return;
		}

		// 프레임 업데이트 시작
		this.startFrameUpdate(animation, loop, onLoop, onComplete);
	}

	private startFrameUpdate(
		animation: SpriteAnimation,
		loop: LoopMode,
		onLoop?: () => void,
		onComplete?: () => void
	) {
		const fps = animation.fps ?? DEFAULT_FPS;
		const frameDelay = 1000 / fps;
		const step = this.metadata?.type === 'tileset' ? this.metadata.step : 1;
		const { from, to } = this.range;

		const updateFrame = () => {
			// 다음 프레임으로 이동 (tileset은 step만큼, sprite는 1씩)
			this.currentFrame += this.direction * step;

			// 루프 처리
			if (loop === 'loop') {
				if (this.currentFrame > to) {
					this.currentFrame = from;
					onLoop?.();
				}
			} else if (loop === 'once') {
				if (this.currentFrame > to) {
					this.currentFrame = to;
					this.stop();
					onComplete?.();
					return;
				}
			} else if (loop === 'ping-pong') {
				if (this.currentFrame > to) {
					this.currentFrame = to - step;
					this.direction = -1;
				} else if (this.currentFrame < from) {
					this.currentFrame = from + step;
					this.direction = 1;
					onLoop?.();
				}
			} else if (loop === 'ping-pong-once') {
				if (this.direction === 1 && this.currentFrame > to) {
					this.currentFrame = to - step;
					this.direction = -1;
				} else if (this.direction === -1 && this.currentFrame < from) {
					this.currentFrame = from;
					this.stop();
					onComplete?.();
					return;
				}
			}

			this.frameTimer = setTimeout(updateFrame, frameDelay);
		};

		this.frameTimer = setTimeout(updateFrame, frameDelay);
	}

	stop() {
		if (this.frameTimer) {
			clearTimeout(this.frameTimer);
			this.frameTimer = undefined;
		}
	}

	getMetadata() {
		return this.metadata;
	}

	getAtlasUrl() {
		return this.atlasUrl;
	}

	private get range(): { from: number; to: number } {
		if (!this.currentAnimation) throw new Error('No animation set');

		const animation = this.animations.get(this.currentAnimation);
		if (!animation) throw new Error(`Animation "${this.currentAnimation}" not found`);

		const from = animation.from ? animation.from - 1 : 0;
		let to: number;

		if (this.metadata?.type === 'tileset') {
			const step = this.metadata.step;
			const animationFrameCount = this.metadata.columns / step;
			to = from + (animationFrameCount - 1) * step;
		} else {
			to = animation.to ? animation.to - 1 : (this.metadata?.frameCount ?? DEFAULT_FRAME_COUNT) - 1;
		}

		return { from, to };
	}
}
