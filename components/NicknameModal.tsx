'use client';

import { useState } from 'react';

interface NicknameModalProps {
  onConfirm: (nickname: string) => void;
}

export default function NicknameModal({ onConfirm }: NicknameModalProps) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError('사원 이름 또는 ID를 입력해주세요.');
      return;
    }
    if (trimmed.length < 2) {
      setError('2자 이상 입력해주세요.');
      return;
    }
    if (trimmed.length > 20) {
      setError('20자 이하로 입력해주세요.');
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border border-gray-300 shadow-xl w-full max-w-sm">
        {/* Title bar */}
        <div className="bg-blue-800 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 border border-gray-300 text-xs flex items-center justify-center text-gray-700 font-bold">
              A
            </div>
            <span className="text-sm font-medium">ACME Corp - 포털 로그인</span>
          </div>
          <div className="flex gap-1">
            <button className="w-5 h-4 bg-gray-300 text-gray-700 text-xs hover:bg-gray-400 flex items-center justify-center">_</button>
            <button className="w-5 h-4 bg-gray-300 text-gray-700 text-xs hover:bg-gray-400 flex items-center justify-center">□</button>
            <button className="w-5 h-4 bg-red-500 text-white text-xs hover:bg-red-600 flex items-center justify-center">×</button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 border border-blue-300 flex items-center justify-center text-2xl">
              🏢
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">ACME 업무 포털에 오신 것을 환영합니다</h2>
              <p className="text-xs text-gray-500">사원 정보를 입력하여 포털에 접근하세요.</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-300 px-3 py-2 mb-4 text-xs text-yellow-800">
            ⚠ 이 시스템은 ACME Corporation 내부 직원 전용입니다. 무단 접근 시 법적 책임을 질 수 있습니다.
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                사원 이름 / ID
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError('');
                }}
                placeholder="예: 김철수 / emp_12345"
                className="w-full border border-gray-400 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                autoFocus
              />
              {error && (
                <p className="text-xs text-red-600 mt-1">{error}</p>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-800 text-white text-sm font-medium hover:bg-blue-900 border border-blue-900"
              >
                로그인
              </button>
            </div>
          </form>

          <p className="text-xs text-gray-400 mt-4 text-center">
            ACME Corp IT Dept. | Portal v2.4.1 | © 2024 ACME Corporation
          </p>
        </div>
      </div>
    </div>
  );
}
