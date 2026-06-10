'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, GameLog } from '@/lib/supabase';

const GAME_NAMES: Record<string, string> = {
  sudoku: '데이터 분석 도구 (수도쿠)',
  tetris: '업무 현황판 (테트리스)',
  mystery: '코드 리뷰어 (미스터리)',
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  enter: { label: '입장', color: 'bg-green-100 text-green-700' },
  exit: { label: '퇴장', color: 'bg-gray-100 text-gray-600' },
  complete: { label: '완료', color: 'bg-blue-100 text-blue-700' },
};

type Stats = {
  total: number;
  byGame: Record<string, { enter: number; complete: number; unique: Set<string> }>;
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, byGame: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError('Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: err } = await supabase
        .from('game_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (err) throw err;

      const logsData = (data || []) as GameLog[];
      setLogs(logsData);

      // Compute stats
      const st: Stats = { total: logsData.length, byGame: {} };
      logsData.forEach(log => {
        if (!st.byGame[log.game_id]) {
          st.byGame[log.game_id] = { enter: 0, complete: 0, unique: new Set() };
        }
        if (log.action === 'enter') st.byGame[log.game_id].enter++;
        if (log.action === 'complete') st.byGame[log.game_id].complete++;
        st.byGame[log.game_id].unique.add(log.nickname);
      });
      setStats(st);
    } catch (e: unknown) {
      setError(`데이터 로드 실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.game_id !== filter) return false;
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    return true;
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ko-KR');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col text-sm">
      {/* Header */}
      <header className="bg-blue-900 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-400 text-blue-900 font-black text-xs px-2 py-1">ACME</div>
          <span className="text-sm font-medium">관리자 패널 — 게임 로그</span>
        </div>
        <Link href="/" className="text-xs text-blue-300 hover:text-white">← 포털로 이동</Link>
      </header>

      <main className="flex-1 p-4 max-w-6xl mx-auto w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white border border-gray-300 p-3">
            <div className="text-xs text-gray-500">전체 로그</div>
            <div className="text-2xl font-bold text-blue-800">{stats.total.toLocaleString()}</div>
          </div>
          {['sudoku', 'tetris', 'mystery'].map(gid => (
            <div key={gid} className="bg-white border border-gray-300 p-3">
              <div className="text-xs text-gray-500">{GAME_NAMES[gid]?.split('(')[1]?.replace(')', '') || gid}</div>
              <div className="text-lg font-bold text-gray-800">
                {stats.byGame[gid]?.enter || 0}
                <span className="text-xs font-normal text-gray-400 ml-1">회 입장</span>
              </div>
              <div className="text-xs text-gray-500">
                완료: {stats.byGame[gid]?.complete || 0} |
                유저: {stats.byGame[gid]?.unique.size || 0}
              </div>
            </div>
          ))}
        </div>

        {/* Filter + Table */}
        <div className="bg-white border border-gray-300 shadow-sm">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold text-gray-700">게임 로그</h2>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="border border-gray-300 text-xs px-2 py-1 bg-white"
              >
                <option value="all">전체 게임</option>
                <option value="sudoku">수도쿠</option>
                <option value="tetris">테트리스</option>
                <option value="mystery">미스터리</option>
              </select>
              <select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                className="border border-gray-300 text-xs px-2 py-1 bg-white"
              >
                <option value="all">전체 액션</option>
                <option value="enter">입장</option>
                <option value="exit">퇴장</option>
                <option value="complete">완료</option>
              </select>
              <button
                onClick={fetchLogs}
                className="border border-gray-300 px-3 py-1 text-xs bg-white hover:bg-gray-50"
              >
                새로 고침
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-3 text-red-700 text-xs">
              <strong>오류:</strong> {error}
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-gray-400">로딩 중...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              {error ? '데이터를 불러올 수 없습니다.' : '로그 데이터가 없습니다.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2 text-gray-600 font-medium">시각</th>
                    <th className="text-left px-4 py-2 text-gray-600 font-medium">닉네임</th>
                    <th className="text-left px-4 py-2 text-gray-600 font-medium">게임</th>
                    <th className="text-left px-4 py-2 text-gray-600 font-medium">액션</th>
                    <th className="text-left px-4 py-2 text-gray-600 font-medium">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLogs.map((log, i) => {
                    const action = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-600' };
                    return (
                      <tr key={log.id || i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap font-mono">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-4 py-2 text-gray-800 font-medium">{log.nickname}</td>
                        <td className="px-4 py-2 text-gray-600">
                          {GAME_NAMES[log.game_id] || log.game_id}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${action.color}`}>
                            {action.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-400 font-mono">{log.ip_address}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            총 {filteredLogs.length}개 표시 (최근 500건)
          </div>
        </div>
      </main>
    </div>
  );
}
