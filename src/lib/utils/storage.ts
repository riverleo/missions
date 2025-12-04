import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/supabase';

type Player = Database['public']['Tables']['players']['Row'];

/**
 * Player의 avatar를 접근 가능한 public URL로 변환합니다.
 * @param supabase - Supabase 클라이언트
 * @param player - Player 데이터
 * @returns public URL
 */
export function getAvatarUrl(
	supabase: SupabaseClient,
	player: Pick<Player, 'user_id' | 'avatar'>
): string | undefined {
	if (!player.avatar) return;

	const path = `${player.user_id}/${player.avatar}`;
	const {
		data: { publicUrl },
	} = supabase.storage.from('avatars').getPublicUrl(path);

	return publicUrl;
}

/**
 * 아바타 이미지를 업로드하고 Player 프로필을 업데이트합니다.
 * @param supabase - Supabase 클라이언트
 * @param player - Player 프로필 (user_id 필요)
 * @param file - 업로드할 File 또는 Blob 객체
 * @param options - 업로드 옵션
 * @returns 업데이트된 Player 데이터 또는 에러
 */
export async function uploadAvatar(
	supabase: SupabaseClient,
	player: Pick<Player, 'user_id'>,
	file: File | Blob,
	options?: {
		cacheControl?: string;
		upsert?: boolean;
	}
) {
	const filename = `avatar-${Date.now()}.${file.type.split('/')[1]}`;
	const path = `${player.user_id}/${filename}`;

	const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
		cacheControl: options?.cacheControl ?? '3600',
		contentType: file.type,
		upsert: options?.upsert ?? false,
	});

	if (uploadError) {
		return { data: undefined, error: uploadError };
	}

	// DB 업데이트
	const { data: updatedPlayer, error: updateError } = await supabase
		.from('players')
		.update({ avatar: filename })
		.eq('user_id', player.user_id)
		.select()
		.single<Player>();

	if (updateError) {
		return { data: undefined, error: updateError };
	}

	return getAvatarUrl(supabase, updatedPlayer);
}
