'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Notice {
  title: string;
  date: string;
  department: string;
  category: string;
  body: string;
}

const NOTICES: Record<string, Notice> = {
  '1': {
    title: '전사 워크샵 참가 후기 작성 마감',
    date: '2024-12-13',
    department: '인사팀',
    category: '행사',
    body: `안녕하세요, 인사팀입니다.\n\n지난 11월 진행된 전사 워크샵에 참여해주신 분들께 감사드립니다.\n참가 후기를 아래 양식을 통해 제출해주시기 바랍니다.\n작성된 후기는 내년 워크샵 기획에 반영될 예정입니다.`,
  },
  '2': {
    title: '신규 도구 베타테스터 모집 공고',
    date: '2024-12-18',
    department: 'IT팀',
    category: 'IT',
    body: `안녕하세요, IT팀입니다.\n\n현재 개발 중인 신규 업무 도구의 베타 테스터를 모집합니다.\n사용 경험을 솔직하게 공유해주시면 개선에 큰 도움이 됩니다.`,
  },
  '3': {
    title: '2024 연말 행사 참여 신청',
    date: '2024-12-23',
    department: '총무팀',
    category: '행사',
    body: `안녕하세요, 총무팀입니다.\n\n2024년 연말 행사를 준비했습니다.\n참여 신청 및 행사에 대한 기대/건의사항을 남겨주세요!`,
  },
};

interface Review {
  nickname: string;
  stars: number;
  comment: string;
  date: string;
}

function StarRating({ value, onChange, readonly }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <span
          key={n}
          className={`text-xl cursor-pointer select-none ${(hover || value) >= n ? 'text-yellow-400' : 'text-gray-300'}`}
          onMouseEnter={() => !readonly && setHover(n)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onChange?.(n)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function NoticePage() {
  const params = useParams();
  const id = params?.id as string;
  const notice = NOTICES[id];

  const [reviews, setReviews] = useState<Review[]>([]);
  const [nickname, setNickname] = useState('');
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!id) return;
    const stored = localStorage.getItem(`acme_nickname`);
    if (stored) setNickname(stored);
    const raw = localStorage.getItem(`reviews_${id}`);
    if (raw) {
      try { setReviews(JSON.parse(raw)); } catch {}
    }
  }, [id]);

  if (!notice) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white border border-gray-300 p-8 text-center">
          <p className="text-gray-600 mb-4">공지사항을 찾을 수 없습니다.</p>
          <Link href="/" className="text-blue-600 hover:underline">← 포털로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || stars === 0 || !comment.trim()) return;
    const newReview: Review = {
      nickname: nickname.trim(),
      stars,
      comment: comment.trim(),
      date: new Date().toLocaleDateString('ko-KR'),
    };
    const updated = [newReview, ...reviews];
    setReviews(updated);
    localStorage.setItem(`reviews_${id}`, JSON.stringify(updated));
    localStorage.setItem('acme_nickname', nickname.trim());
    setComment('');
    setStars(0);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const catColor = notice.category === 'IT'
    ? 'bg-blue-100 text-blue-700'
    : notice.category === '행사'
    ? 'bg-purple-100 text-purple-700'
    : 'bg-gray-100 text-gray-600';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col text-sm">
      {/* ACME Header */}
      <header className="bg-blue-900 text-white shadow-md">
        <div className="flex items-center justify-between px-4 py-0 h-10 border-b border-blue-700">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 text-blue-900 font-black text-xs px-2 py-1 tracking-wider">ACME</div>
            <span className="text-white text-xs font-medium opacity-80 hidden sm:block">Corporation Internal Portal</span>
          </div>
          <nav className="hidden md:flex items-center gap-1 text-xs">
            {['홈', '공지사항', '전자결재', '인사정보', '복리후생', '고객지원'].map((item) => (
              <button key={item} className="px-3 py-2.5 hover:bg-blue-800 transition-colors opacity-80 hover:opacity-100">{item}</button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1 px-4 py-1 bg-blue-800 text-xs">
          <Link href="/" className="opacity-60 hover:opacity-100 hover:underline">홈</Link>
          <span className="opacity-40 mx-1">&gt;</span>
          <span className="opacity-80">공지사항</span>
          <span className="opacity-40 mx-1">&gt;</span>
          <span className="text-yellow-300 truncate max-w-xs">{notice.title}</span>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-3xl mx-auto w-full">
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs mb-3">
          ← 포털로 돌아가기
        </Link>

        {/* Notice card */}
        <div className="bg-white border border-gray-300 shadow-sm mb-4">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${catColor}`}>{notice.category}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{notice.department}</span>
            </div>
            <h1 className="font-bold text-gray-900 text-lg leading-snug mb-1">{notice.title}</h1>
            <div className="text-xs text-gray-400">{notice.date}</div>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{notice.body}</p>
          </div>
        </div>

        {/* Review section */}
        <div className="bg-white border border-gray-300 shadow-sm">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
            <h2 className="font-bold text-gray-700 text-sm">💬 의견 남기기</h2>
          </div>

          {/* Existing reviews */}
          {reviews.length > 0 && (
            <div className="divide-y divide-gray-100 px-6">
              {reviews.map((r, i) => (
                <div key={i} className="py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800 text-sm">{r.nickname}</span>
                    <StarRating value={r.stars} readonly />
                    <span className="text-xs text-gray-400 ml-auto">{r.date}</span>
                  </div>
                  <p className="text-sm text-gray-600">{r.comment}</p>
                </div>
              ))}
            </div>
          )}

          {reviews.length === 0 && (
            <div className="px-6 py-4 text-xs text-gray-400 italic">아직 작성된 의견이 없습니다. 첫 번째로 의견을 남겨보세요!</div>
          )}

          {/* Review form */}
          <div className="border-t border-gray-200 px-6 py-4">
            <h3 className="font-medium text-gray-700 text-xs mb-3 uppercase tracking-wide">의견 작성</h3>
            {submitted && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 rounded mb-3">
                ✓ 의견이 등록되었습니다.
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">닉네임</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  className="border border-gray-300 px-2 py-1.5 text-sm w-full max-w-xs focus:outline-none focus:border-blue-500"
                  placeholder="닉네임을 입력하세요"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">별점</label>
                <StarRating value={stars} onChange={setStars} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">의견</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="border border-gray-300 px-2 py-1.5 text-sm w-full focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                  placeholder="솔직한 의견을 남겨주세요..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={stars === 0}
                className="bg-blue-900 text-white px-4 py-2 text-sm hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                의견 등록
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="bg-gray-200 border-t border-gray-300 px-4 py-2 text-xs text-gray-500 flex items-center justify-between">
        <span>© 2024 ACME Corporation. All rights reserved. | 인트라넷 포털 v2.4.1</span>
        <span>IT 지원: it-helpdesk@acme.co.kr | ☎ 내선 1000</span>
      </footer>
    </div>
  );
}
