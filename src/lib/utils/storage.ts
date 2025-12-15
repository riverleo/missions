import type { Supabase, Player, Terrain } from '$lib/types';

/**
 * Player의 avatar를 접근 가능한 public URL로 변환합니다.
 * @param supabase - Supabase 클라이언트
 * @param player - Player 데이터
 * @returns public URL
 */
export function getAvatarUrl(
	supabase: Supabase,
	player: Pick<Player, 'id' | 'avatar'>
): string | undefined {
	if (!player.avatar) return;

	const path = `${player.id}/${player.avatar}`;
	const {
		data: { publicUrl },
	} = supabase.storage.from('avatars').getPublicUrl(path);

	return publicUrl;
}

/**
 * 아바타 이미지를 업로드하고 Player 프로필을 업데이트합니다.
 * @param supabase - Supabase 클라이언트
 * @param player - Player 데이터
 * @param file - 업로드할 File 또는 Blob 객체
 * @returns 업데이트된 Player 데이터 또는 에러
 */
export async function uploadAvatar(
	supabase: Supabase,
	player: Player,
	file: File | Blob
): Promise<string> {
	const filename = `avatar-${Date.now()}.${file.type.split('/')[1]}`;
	const path = `${player.id}/${filename}`;

	const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
		cacheControl: '3600',
		contentType: file.type,
		upsert: false,
	});

	if (uploadError) {
		console.error('Failed to upload avatar:', uploadError);
		return '';
	}

	// DB 업데이트
	const { data: updatedPlayer, error: updateError } = await supabase
		.from('players')
		.update({ avatar: filename })
		.eq('id', player.id)
		.select()
		.single<Player>();

	if (updateError) {
		console.error('Failed to update player avatar:', updateError);
		return '';
	}

	return getAvatarUrl(supabase, updatedPlayer) ?? '';
}

export type GameAssetType = 'terrain' | 'item';

/**
 * 게임 에셋의 public URL을 반환합니다.
 * @param supabase - Supabase 클라이언트
 * @param type - 에셋 타입
 * @param target - 에셋 대상
 * @returns public URL
 */
export function getGameAssetUrl(
	supabase: Supabase,
	type: GameAssetType,
	target: { id: string; game_asset: string | null }
): string | undefined {
	if (!target.game_asset) return;

	const path = `${type}/${target.id}/${target.game_asset}`;
	const {
		data: { publicUrl },
	} = supabase.storage.from('game-assets').getPublicUrl(path);

	return publicUrl;
}

/**
 * 게임 에셋 파일을 업로드합니다.
 * @param supabase - Supabase 클라이언트
 * @param type - 에셋 타입
 * @param target - 에셋 대상
 * @param file - 업로드할 파일
 * @returns 업로드된 파일명 (실패 시 빈 문자열)
 */
export async function uploadGameAsset(
	supabase: Supabase,
	type: GameAssetType,
	target: { id: string },
	file: File | Blob
): Promise<string> {
	const ext = file.type.split('/')[1] || 'bin';
	const filename = `${type}-${Date.now()}.${ext}`;
	const path = `${type}/${target.id}/${filename}`;

	const { error: uploadError } = await supabase.storage.from('game-assets').upload(path, file, {
		cacheControl: '3600',
		contentType: file.type,
		upsert: false,
	});

	if (uploadError) {
		console.error('Failed to upload game asset:', uploadError);
		return '';
	}

	return filename;
}
