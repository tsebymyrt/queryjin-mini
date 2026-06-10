import { supabase, GameLog } from './supabase';

export async function logGameEvent(
  gameId: string,
  action: 'enter' | 'exit' | 'complete',
  nickname?: string
): Promise<void> {
  try {
    // Only log if supabase is configured with real values
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log(`[GameLog] ${action} - ${gameId} - ${nickname || 'anonymous'}`);
      return;
    }

    const storedNickname = typeof window !== 'undefined'
      ? (localStorage.getItem('acme_nickname') || 'anonymous')
      : 'anonymous';

    const logEntry: Omit<GameLog, 'id' | 'created_at'> = {
      nickname: nickname || storedNickname,
      ip_address: 'client', // IP is captured server-side if needed
      game_id: gameId,
      action,
    };

    await supabase.from('game_logs').insert(logEntry);
  } catch (err) {
    // Silently fail - don't interrupt game for logging errors
    console.error('[GameLog] Failed to log event:', err);
  }
}

export async function getPlayCount(gameId: string): Promise<number> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return 0;
    }

    const { count } = await supabase
      .from('game_logs')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId)
      .eq('action', 'enter');

    return count || 0;
  } catch {
    return 0;
  }
}
