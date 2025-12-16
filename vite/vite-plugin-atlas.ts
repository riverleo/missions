import { execSync } from 'child_process';
import { watch } from 'fs';
import { readdir, writeFile } from 'fs/promises';
import { join } from 'path';
import type { Plugin } from 'vite';
import { debounce } from 'radash';

interface ImageSize {
	width: number;
	height: number;
}

interface AtlasMetadata {
	name: string;
	frameWidth: number;
	frameHeight: number;
	columns: number;
	rows: number;
	frameCount: number;
}

const SOURCES_DIR = './src/lib/assets/atlas/sources';
const GENERATED_DIR = './src/lib/assets/atlas/generated';
const ATLASES_JSON_PATH = join(GENERATED_DIR, 'atlases.json');

/**
 * ImageMagick identify로 이미지 크기 확인
 */
function getImageSize(imagePath: string): ImageSize {
	const output = execSync(`magick identify -format "%wx%h" "${imagePath}"`, {
		encoding: 'utf-8',
	}).trim();
	const parts = output.split('x').map(Number);
	const width = parts[0] ?? 0;
	const height = parts[1] ?? 0;
	return { width, height };
}

/**
 * 이미지 파일 확인
 */
function isImageFile(filename: string): boolean {
	return /\.(png|webp|jpe?g)$/i.test(filename);
}

/**
 * 파일명에서 숫자 추출해서 정렬
 */
function sortByNumber(files: string[]): string[] {
	return files.sort((a, b) => {
		const numA = parseInt(a.match(/-(\d+)\.(png|webp|jpe?g)$/i)?.[1] || '0');
		const numB = parseInt(b.match(/-(\d+)\.(png|webp|jpe?g)$/i)?.[1] || '0');
		return numA - numB;
	});
}

/**
 * Sprite Sheet 생성 (동일 크기 이미지들)
 */
async function generateSpriteSheet(groupName: string, files: string[]): Promise<AtlasMetadata | undefined> {
	const frameCount = files.length;
	const columns = Math.ceil(Math.sqrt(frameCount));
	const rows = Math.ceil(frameCount / columns);

	const inputPaths = files.join(' ');
	const outputPath = join(GENERATED_DIR, `${groupName}.png`);

	const command = `magick montage ${inputPaths} -tile ${columns}x${rows} -geometry +0+0 -background none ${outputPath}`;
	execSync(command, { stdio: 'inherit' });

	// 프레임 크기 확인 (첫 번째 이미지)
	const firstFile = files[0];
	if (!firstFile) {
		console.warn(`⚠ [${groupName}] No files to process`);
		return undefined;
	}
	const { width: frameWidth, height: frameHeight } = getImageSize(firstFile);

	console.log(
		`✓ [Sprite Sheet] ${groupName}.png (${frameCount} frames, ${columns}x${rows} grid)`
	);

	return {
		name: groupName,
		frameWidth,
		frameHeight,
		columns,
		rows,
		frameCount,
	};
}

/**
 * 특정 그룹의 Atlas 생성
 */
async function generateAtlas(groupName: string): Promise<AtlasMetadata | undefined> {
	try {
		const groupPath = join(SOURCES_DIR, groupName);

		// 폴더 내 이미지 파일들 수집
		const allFiles = await readdir(groupPath);
		const imageFiles = allFiles.filter(isImageFile);

		if (imageFiles.length === 0) {
			console.warn(`⚠ [${groupName}] No image files found`);
			return undefined;
		}

		// 파일명 정렬
		const sortedFiles = sortByNumber(imageFiles);
		const filePaths = sortedFiles.map((f) => join(groupPath, f));

		return await generateSpriteSheet(groupName, filePaths);
	} catch (error) {
		console.error(`Failed to generate atlas for ${groupName}:`, error);
		return undefined;
	}
}

/**
 * 모든 Atlas 생성 및 메타데이터 저장
 */
async function generateAtlases() {
	try {
		// sources 폴더의 하위 폴더들 탐색
		const groups = await readdir(SOURCES_DIR, { withFileTypes: true });
		const atlases: Record<string, Omit<AtlasMetadata, 'name'>> = {};

		for (const group of groups) {
			if (!group.isDirectory()) continue;
			const metadata = await generateAtlas(group.name);
			if (metadata) {
				const { name, ...rest } = metadata;
				atlases[name] = rest;
			}
		}

		// 전체 메타데이터를 하나의 파일로 저장
		await writeFile(ATLASES_JSON_PATH, JSON.stringify(atlases, null, 2));
		console.log(`✓ [Metadata] atlases.json (${Object.keys(atlases).length} atlases)`);
	} catch (error) {
		console.error('Failed to generate atlases:', error);
	}
}

/**
 * Atlas 자동 생성 Vite 플러그인
 */
export function atlasPlugin(): Plugin {
	return {
		name: 'vite-plugin-atlas',

		configureServer(server) {
			// 전체 재생성 debounce
			const debouncedGenerateAll = debounce({ delay: 300 }, async () => {
				await generateAtlases();

				// HMR 트리거
				server.ws.send({
					type: 'full-reload',
					path: '*',
				});
			});

			// 개발 모드: sources 폴더 watch
			const watcher = watch(SOURCES_DIR, { recursive: true }, (eventType, filename) => {
				if (!filename || !isImageFile(filename)) return;

				console.log(`\n📦 Atlas source changed: ${filename}`);
				debouncedGenerateAll();
			});

			// 서버 시작 시 한 번 생성
			generateAtlases();

			server.httpServer?.on('close', () => {
				watcher.close();
			});
		},
	};
}
