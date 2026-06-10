'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { logGameEvent } from '@/lib/logger';

// Tetris constants
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const TICK_MS = 500;

type CellColor = string | null;
type Board = CellColor[][];

const PIECES = [
  { shape: [[1,1,1,1]], color: '#b8d4e8' },            // I - pale blue
  { shape: [[1,1],[1,1]], color: '#fde8a8' },            // O - pale yellow
  { shape: [[0,1,0],[1,1,1]], color: '#c8e6c9' },        // T - pale green
  { shape: [[1,0],[1,1],[0,1]], color: '#f8bbd9' },      // S - pale pink
  { shape: [[0,1],[1,1],[1,0]], color: '#d1c4e9' },      // Z - pale purple
  { shape: [[1,0],[1,0],[1,1]], color: '#ffe0b2' },      // L - pale orange
  { shape: [[0,1],[0,1],[1,1]], color: '#b2dfdb' },      // J - pale teal
];

function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
}

function rotatePiece(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = shape[r][c];
    }
  }
  return rotated;
}

function randomPiece() {
  return PIECES[Math.floor(Math.random() * PIECES.length)];
}

interface ActivePiece {
  shape: number[][];
  color: string;
  x: number;
  y: number;
}

export default function TetrisPage() {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [active, setActive] = useState<ActivePiece | null>(null);
  const [nextPiece, setNextPiece] = useState<typeof PIECES[0] | null>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);

  const boardRef = useRef<Board>(createEmptyBoard());
  const activeRef = useRef<ActivePiece | null>(null);
  const pausedRef = useRef(false);
  const gameOverRef = useRef(false);
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const levelRef = useRef(1);

  useEffect(() => { logGameEvent('tetris', 'enter'); }, []);
  useEffect(() => () => { logGameEvent('tetris', 'exit'); }, []);

  const isValid = useCallback((shape: number[][], px: number, py: number, b: Board): boolean => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = px + c;
        const ny = py + r;
        if (nx < 0 || nx >= BOARD_WIDTH || ny >= BOARD_HEIGHT) return false;
        if (ny >= 0 && b[ny][nx]) return false;
      }
    }
    return true;
  }, []);

  const placePiece = useCallback((piece: ActivePiece, b: Board): Board => {
    const nb = b.map(row => [...row]);
    piece.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell && piece.y + r >= 0) {
          nb[piece.y + r][piece.x + c] = piece.color;
        }
      });
    });
    return nb;
  }, []);

  const clearLines = useCallback((b: Board): { board: Board; cleared: number } => {
    const newRows = b.filter(row => row.some(cell => !cell));
    const cleared = BOARD_HEIGHT - newRows.length;
    const emptyRows = Array.from({ length: cleared }, () => Array(BOARD_WIDTH).fill(null));
    return { board: [...emptyRows, ...newRows], cleared };
  }, []);

  const spawnPiece = useCallback((next: typeof PIECES[0], b: Board): boolean => {
    const piece: ActivePiece = {
      shape: next.shape,
      color: next.color,
      x: Math.floor((BOARD_WIDTH - next.shape[0].length) / 2),
      y: -next.shape.length + 1,
    };
    if (!isValid(piece.shape, piece.x, piece.y + 1, b) && !isValid(piece.shape, piece.x, piece.y, b)) {
      return false;
    }
    activeRef.current = piece;
    setActive({ ...piece });
    return true;
  }, [isValid]);

  const tick = useCallback(() => {
    if (pausedRef.current || gameOverRef.current) return;
    const cur = activeRef.current;
    if (!cur) return;

    if (isValid(cur.shape, cur.x, cur.y + 1, boardRef.current)) {
      const moved = { ...cur, y: cur.y + 1 };
      activeRef.current = moved;
      setActive({ ...moved });
    } else {
      // Place piece
      const newBoard = placePiece(cur, boardRef.current);
      const { board: cleared, cleared: count } = clearLines(newBoard);
      boardRef.current = cleared;
      setBoard([...cleared]);

      const points = [0, 100, 300, 500, 800][count] || 0;
      scoreRef.current += points * levelRef.current;
      linesRef.current += count;
      levelRef.current = Math.floor(linesRef.current / 10) + 1;
      setScore(scoreRef.current);
      setLines(linesRef.current);
      setLevel(levelRef.current);

      // Spawn next
      const next = randomPiece();
      setNextPiece(next);
      const ok = spawnPiece(next, cleared);
      if (!ok) {
        gameOverRef.current = true;
        setGameOver(true);
        logGameEvent('tetris', 'complete');
      }
    }
  }, [isValid, placePiece, clearLines, spawnPiece]);

  useEffect(() => {
    if (!started || paused || gameOver) return;
    const speed = Math.max(100, TICK_MS - (level - 1) * 40);
    const interval = setInterval(tick, speed);
    return () => clearInterval(interval);
  }, [started, paused, gameOver, level, tick]);

  const startGame = () => {
    const b = createEmptyBoard();
    boardRef.current = b;
    setBoard(b);
    scoreRef.current = 0;
    linesRef.current = 0;
    levelRef.current = 1;
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    gameOverRef.current = false;
    setPaused(false);
    pausedRef.current = false;
    const next = randomPiece();
    setNextPiece(randomPiece());
    spawnPiece(next, b);
    setStarted(true);
  };

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!started || gameOver) return;
    const cur = activeRef.current;
    if (!cur) return;

    if (e.key === 'ArrowLeft') {
      if (isValid(cur.shape, cur.x - 1, cur.y, boardRef.current)) {
        const m = { ...cur, x: cur.x - 1 };
        activeRef.current = m;
        setActive({ ...m });
      }
    } else if (e.key === 'ArrowRight') {
      if (isValid(cur.shape, cur.x + 1, cur.y, boardRef.current)) {
        const m = { ...cur, x: cur.x + 1 };
        activeRef.current = m;
        setActive({ ...m });
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (isValid(cur.shape, cur.x, cur.y + 1, boardRef.current)) {
        const m = { ...cur, y: cur.y + 1 };
        activeRef.current = m;
        setActive({ ...m });
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const rotated = rotatePiece(cur.shape);
      if (isValid(rotated, cur.x, cur.y, boardRef.current)) {
        const m = { ...cur, shape: rotated };
        activeRef.current = m;
        setActive({ ...m });
      }
    } else if (e.key === ' ') {
      e.preventDefault();
      // Hard drop
      let dy = 0;
      while (isValid(cur.shape, cur.x, cur.y + dy + 1, boardRef.current)) dy++;
      const dropped = { ...cur, y: cur.y + dy };
      activeRef.current = dropped;
      setActive({ ...dropped });
      scoreRef.current += dy * 2;
      setScore(scoreRef.current);
      tick();
    } else if (e.key === 'p' || e.key === 'P') {
      pausedRef.current = !pausedRef.current;
      setPaused(pausedRef.current);
    }
  }, [started, gameOver, isValid, tick]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // Render board with active piece overlay
  const renderBoard = () => {
    const display: Board = board.map(row => [...row]);
    if (active) {
      // Ghost piece
      let ghostY = active.y;
      while (isValid(active.shape, active.x, ghostY + 1, board)) ghostY++;
      if (ghostY !== active.y) {
        active.shape.forEach((row, r) => {
          row.forEach((cell, c) => {
            if (cell && ghostY + r >= 0 && ghostY + r < BOARD_HEIGHT) {
              if (!display[ghostY + r][active.x + c]) {
                display[ghostY + r][active.x + c] = 'ghost';
              }
            }
          });
        });
      }
      // Active piece
      active.shape.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell && active.y + r >= 0 && active.y + r < BOARD_HEIGHT) {
            display[active.y + r][active.x + c] = active.color;
          }
        });
      });
    }
    return display;
  };

  const displayBoard = renderBoard();

  // Fake metrics in background
  const fakeMetrics = [
    'Q3 Revenue', 'YoY Growth %', 'EBITDA Margin', 'Customer Churn', 'NPS Score',
    'Headcount', 'Opex Budget', 'CAC', 'LTV', 'Burn Rate',
    'ARR', 'MRR', 'Gross Margin', 'Run Rate', 'Pipeline Coverage',
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col text-xs select-none">
      {/* Google Sheets top bar */}
      <div className="flex items-center px-3 py-1.5 border-b border-gray-200 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6">
              <rect x="3" y="2" width="18" height="20" rx="2" fill="#0f9d58" />
              <rect x="7" y="7" width="10" height="1.5" rx="0.5" fill="white" />
              <rect x="7" y="10" width="10" height="1.5" rx="0.5" fill="white" />
              <rect x="7" y="13" width="7" height="1.5" rx="0.5" fill="white" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-800">Q4_Planning_Dashboard_2024.xlsx</div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>파일</span><span>수정</span><span>보기</span><span>삽입</span>
              <span>형식</span><span>데이터</span><span>도구</span><span>확장 프로그램</span>
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/" className="text-xs text-blue-600 hover:underline">← 업무 포털로</Link>
          <button className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700">공유</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-1 border-b border-gray-200 bg-gray-50 overflow-x-auto">
        {['↩', '↪', '🖨', '🔍', '%', '$', '₩', '.0', '.00',
          '굵게', '기울임', '취소선', '테두리', '채우기', '정렬', '병합'].map(t => (
          <button key={t} className="text-gray-500 hover:bg-gray-200 px-1.5 py-0.5 rounded whitespace-nowrap">
            {t}
          </button>
        ))}
      </div>

      {/* Formula bar */}
      <div className="flex items-center gap-2 px-3 py-1 border-b border-gray-300">
        <div className="text-gray-500 border border-gray-300 px-2 py-0.5 w-16 text-center text-xs bg-white">
          J11
        </div>
        <div className="flex-1 border border-gray-300 px-2 py-0.5 text-xs bg-white text-gray-400">
          =VLOOKUP(J10, Q4_Targets!B:F, 3, FALSE) * (1 + growth_rate)
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Background spreadsheet */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Col headers */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <div className="w-10 h-6 border-r border-gray-200 flex-shrink-0" />
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="w-24 h-6 border-r border-gray-200 text-center text-gray-400 text-xs leading-6 flex-shrink-0">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: 30 }, (_, ri) => (
            <div key={ri} className="flex border-b border-gray-100">
              <div className="w-10 border-r border-gray-200 text-right pr-1 text-gray-400 text-xs leading-5 flex-shrink-0 bg-gray-50">
                {ri + 1}
              </div>
              {Array.from({ length: 20 }, (_, ci) => {
                const metricIdx = (ri * 3 + ci) % fakeMetrics.length;
                const showMetric = (ri + ci) % 5 === 0;
                const showNum = (ri + ci) % 3 === 1;
                return (
                  <div key={ci} className="w-24 border-r border-gray-100 px-1 text-xs leading-5 flex-shrink-0 text-gray-200 overflow-hidden whitespace-nowrap">
                    {showMetric ? fakeMetrics[metricIdx] :
                     showNum ? `${(Math.random() * 100).toFixed(1)}%` : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Game area overlay */}
        <div className="relative z-10 flex items-start justify-center w-full pt-4 gap-6">
          {/* Board */}
          <div
            className="border-2 border-gray-400 bg-white bg-opacity-95 shadow-lg"
            style={{ width: BOARD_WIDTH * 24, height: BOARD_HEIGHT * 24 }}
          >
            {displayBoard.map((row, ri) => (
              <div key={ri} className="flex">
                {row.map((cell, ci) => (
                  <div
                    key={ci}
                    style={{
                      width: 24,
                      height: 24,
                      backgroundColor: cell === 'ghost' ? 'rgba(100,100,200,0.15)' : cell || 'transparent',
                      border: cell && cell !== 'ghost' ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(200,200,200,0.3)',
                      boxSizing: 'border-box',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Side panel */}
          <div className="flex flex-col gap-3 bg-white bg-opacity-95 border border-gray-300 p-3 shadow-md min-w-32">
            {/* Score */}
            <div className="border border-gray-200 p-2 bg-gray-50">
              <div className="text-gray-500 text-xs">Score</div>
              <div className="font-bold text-gray-800 text-base">{score.toLocaleString()}</div>
            </div>
            <div className="border border-gray-200 p-2 bg-gray-50">
              <div className="text-gray-500 text-xs">Lines</div>
              <div className="font-bold text-gray-800">{lines}</div>
            </div>
            <div className="border border-gray-200 p-2 bg-gray-50">
              <div className="text-gray-500 text-xs">Level</div>
              <div className="font-bold text-gray-800">{level}</div>
            </div>

            {/* Next piece */}
            <div className="border border-gray-200 p-2">
              <div className="text-gray-500 text-xs mb-1">Next</div>
              <div className="flex flex-col items-center">
                {nextPiece && nextPiece.shape.map((row, r) => (
                  <div key={r} className="flex">
                    {row.map((cell, c) => (
                      <div key={c} style={{
                        width: 18, height: 18,
                        backgroundColor: cell ? nextPiece.color : 'transparent',
                        border: cell ? '1px solid rgba(0,0,0,0.1)' : '1px solid transparent',
                      }} />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            {!started || gameOver ? (
              <button
                onClick={startGame}
                className="bg-green-600 text-white text-xs px-3 py-2 hover:bg-green-700 font-medium"
              >
                {gameOver ? '다시 시작' : '시작'}
              </button>
            ) : (
              <button
                onClick={() => {
                  pausedRef.current = !pausedRef.current;
                  setPaused(pausedRef.current);
                }}
                className="bg-blue-600 text-white text-xs px-3 py-2 hover:bg-blue-700"
              >
                {paused ? '계속' : '일시정지'}
              </button>
            )}

            <div className="text-xs text-gray-400 space-y-0.5 mt-1">
              <div>← → 이동</div>
              <div>↑ 회전</div>
              <div>↓ 빠르게</div>
              <div>Space 낙하</div>
              <div>P 일시정지</div>
            </div>
          </div>
        </div>

        {/* Pause overlay */}
        {paused && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white bg-opacity-70">
            <div className="bg-white border border-gray-300 shadow-lg px-8 py-6 text-center">
              <div className="text-2xl mb-2">⏸</div>
              <div className="text-sm font-bold text-gray-700">일시 정지됨</div>
              <div className="text-xs text-gray-400 mt-1">P 를 눌러 계속하세요</div>
            </div>
          </div>
        )}

        {/* Game over overlay */}
        {gameOver && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white border border-gray-300 shadow-xl px-8 py-6 text-center">
              <div className="text-2xl mb-2">🏁</div>
              <div className="text-lg font-bold text-gray-800 mb-2">게임 오버</div>
              <div className="text-sm text-gray-600 mb-1">최종 점수: <strong>{score.toLocaleString()}</strong></div>
              <div className="text-xs text-gray-500 mb-4">
                처리 라인: {lines} | 달성 레벨: {level}
              </div>
              <div className="flex gap-2 justify-center">
                <button onClick={startGame} className="px-4 py-2 bg-green-600 text-white text-sm hover:bg-green-700">
                  다시 시작
                </button>
                <Link href="/" className="px-4 py-2 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
                  포털로
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sheet tabs */}
      <div className="flex items-center border-t border-gray-300 bg-gray-50 px-2 py-0.5 gap-0.5">
        <button className="text-xs bg-white border border-gray-300 border-b-white px-3 py-1 -mb-px text-gray-800 font-medium">
          Q4 Planning
        </button>
        <button className="text-xs text-gray-500 hover:bg-gray-100 px-3 py-1">Q3 Actuals</button>
        <button className="text-xs text-gray-500 hover:bg-gray-100 px-3 py-1">Headcount</button>
        <button className="text-xs text-gray-500 hover:bg-gray-100 px-3 py-1">Budget vs Actual</button>
        <span className="ml-1 text-gray-400 text-base leading-none">+</span>
      </div>
    </div>
  );
}
