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
  { shape: [[1,1,1,1]], color: '#b8d4e8' },
  { shape: [[1,1],[1,1]], color: '#fde8a8' },
  { shape: [[0,1,0],[1,1,1]], color: '#c8e6c9' },
  { shape: [[1,0],[1,1],[0,1]], color: '#f8bbd9' },
  { shape: [[0,1],[1,1],[1,0]], color: '#d1c4e9' },
  { shape: [[1,0],[1,0],[1,1]], color: '#ffe0b2' },
  { shape: [[0,1],[0,1],[1,1]], color: '#b2dfdb' },
];

const PIECE_BORDERS: Record<string, string> = {
  '#b8d4e8': '#7aaec8',
  '#fde8a8': '#e8c860',
  '#c8e6c9': '#90c492',
  '#f8bbd9': '#e888b8',
  '#d1c4e9': '#a090cc',
  '#ffe0b2': '#f0a860',
  '#b2dfdb': '#70b8b2',
};

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

const dataLabels = ['Q3 Target', 'Actual', 'Variance', 'YoY', 'Budget', 'Forecast', 'Q4 Plan', 'Delta'];
const dataValues = ['1,234', '82.4%', '$4.2M', '3,891', '67.1%', '$1.8M', '2,450', '94.3%', '$6.7M', '(342)', '112.0%', '$0.9M'];

function getFakeCell(ri: number, ci: number): string {
  const seed = ri * 20 + ci;
  if (seed % 7 === 0) return dataLabels[seed % dataLabels.length];
  if (seed % 5 === 1) return dataValues[seed % dataValues.length];
  if (seed % 11 === 3) return dataValues[(seed + 3) % dataValues.length];
  return '';
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

  const renderBoard = () => {
    const display: Board = board.map(row => [...row]);
    if (active) {
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

  const COL_W = 96;
  const ROW_H = 20;
  const ROW_NUM_W = 40;

  return (
    <div className="min-h-screen bg-white flex flex-col text-xs select-none" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Google Sheets title bar */}
      <div className="flex items-center px-3 py-1.5 border-b border-[#dadce0] gap-3 bg-white">
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
            <div className="text-sm font-medium text-[#3c4043]">Q4_Planning_Dashboard_2024.xlsx</div>
            <div className="flex items-center gap-1 text-[#5f6368]" style={{ fontSize: 11 }}>
              {['파일','수정','보기','삽입','형식','데이터','도구','확장 프로그램'].map(m => (
                <span key={m} className="hover:bg-[#f1f3f4] px-1.5 py-0.5 rounded cursor-pointer">{m}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/" className="text-[#1a73e8] hover:underline" style={{ fontSize: 11 }}>← 업무 포털로</Link>
          <button className="bg-[#1a73e8] text-white px-3 py-1 rounded hover:bg-[#1557b0]" style={{ fontSize: 11 }}>공유</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-[#dadce0] bg-white overflow-x-auto">
        <button className="w-7 h-7 rounded hover:bg-[#f1f3f4] text-[#5f6368] flex items-center justify-center">↩</button>
        <button className="w-7 h-7 rounded hover:bg-[#f1f3f4] text-[#5f6368] flex items-center justify-center">↪</button>
        <button className="w-7 h-7 rounded hover:bg-[#f1f3f4] text-[#5f6368] flex items-center justify-center" style={{ fontSize: 13 }}>🖨</button>
        <div className="w-px h-5 bg-[#dadce0] mx-0.5" />
        <button className="text-[#3c4043] hover:bg-[#f1f3f4] px-2 py-1 rounded flex items-center gap-0.5" style={{ fontSize: 11 }}>100% ▾</button>
        <div className="w-px h-5 bg-[#dadce0] mx-0.5" />
        <button className="text-[#3c4043] hover:bg-[#f1f3f4] px-2 py-1 rounded min-w-[80px] text-left" style={{ fontSize: 11 }}>Arial ▾</button>
        <div className="w-px h-5 bg-[#dadce0] mx-0.5" />
        <button className="text-[#3c4043] hover:bg-[#f1f3f4] px-1.5 py-1 rounded" style={{ fontSize: 11 }}>10 ▾</button>
        <div className="w-px h-5 bg-[#dadce0] mx-0.5" />
        <button className="w-7 h-7 rounded hover:bg-[#f1f3f4] text-[#3c4043] font-bold flex items-center justify-center" style={{ fontSize: 13 }}>B</button>
        <button className="w-7 h-7 rounded hover:bg-[#f1f3f4] text-[#3c4043] italic flex items-center justify-center" style={{ fontSize: 13 }}>I</button>
        <button className="w-7 h-7 rounded hover:bg-[#f1f3f4] text-[#3c4043] underline flex items-center justify-center" style={{ fontSize: 13 }}>U</button>
        <div className="w-px h-5 bg-[#dadce0] mx-0.5" />
        <button className="w-7 h-7 rounded hover:bg-[#f1f3f4] flex flex-col items-center justify-center gap-0">
          <span className="text-[#3c4043] font-bold leading-none" style={{ fontSize: 11 }}>A</span>
          <div className="w-3.5 h-0.5 bg-red-500" />
        </button>
        <button className="w-7 h-7 rounded hover:bg-[#f1f3f4] flex flex-col items-center justify-center gap-0">
          <span className="text-[#5f6368] leading-none" style={{ fontSize: 11 }}>⬡</span>
          <div className="w-3.5 h-0.5 bg-yellow-400" />
        </button>
        <div className="w-px h-5 bg-[#dadce0] mx-0.5" />
        <button className="w-7 h-7 rounded hover:bg-[#f1f3f4] text-[#5f6368] flex items-center justify-center" style={{ fontSize: 14 }}>⊞</button>
        <button className="w-7 h-7 rounded hover:bg-[#f1f3f4] text-[#5f6368] flex items-center justify-center" style={{ fontSize: 12 }}>⊟</button>
        <div className="w-px h-5 bg-[#dadce0] mx-0.5" />
        <button className="w-7 h-7 rounded hover:bg-[#f1f3f4] text-[#5f6368] flex items-center justify-center" style={{ fontSize: 14 }}>≡</button>
        <button className="w-7 h-7 rounded hover:bg-[#f1f3f4] text-[#5f6368] flex items-center justify-center" style={{ fontSize: 14 }}>☰</button>
        <button className="w-7 h-7 rounded hover:bg-[#f1f3f4] text-[#5f6368] flex items-center justify-center" style={{ fontSize: 14 }}>≣</button>
      </div>

      {/* Name box + Formula bar */}
      <div className="flex items-center border-b border-[#dadce0] bg-white" style={{ height: 26 }}>
        <div className="border-r border-[#dadce0] px-2 w-20 text-center text-[#3c4043] bg-white flex-shrink-0" style={{ fontSize: 11 }}>
          J3
        </div>
        <div className="text-[#5f6368] px-2 italic flex-shrink-0 select-none" style={{ fontSize: 13 }}>fx</div>
        <div className="flex-1 px-2 text-[#3c4043] bg-white font-mono" style={{ fontSize: 11 }}>
          =SUM(J3:S23)
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Background spreadsheet */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="flex border-b border-[#dadce0]" style={{ height: ROW_H }}>
            <div style={{ width: ROW_NUM_W, height: ROW_H }} className="border-r border-[#dadce0] bg-[#f8f9fa] flex-shrink-0" />
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                style={{ width: COL_W, height: ROW_H }}
                className="border-r border-[#dadce0] bg-[#f8f9fa] text-center text-[#80868b] flex-shrink-0 flex items-center justify-center font-medium"
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          {Array.from({ length: 30 }, (_, ri) => (
            <div key={ri} className="flex border-b border-[#e8eaed]" style={{ height: ROW_H }}>
              <div
                style={{ width: ROW_NUM_W, height: ROW_H }}
                className="border-r border-[#dadce0] pr-1.5 flex-shrink-0 bg-[#f8f9fa] flex items-center justify-end text-[#80868b]"
              >
                {ri + 1}
              </div>
              {Array.from({ length: 20 }, (_, ci) => {
                const val = getFakeCell(ri, ci);
                return (
                  <div
                    key={ci}
                    style={{ width: COL_W, height: ROW_H, opacity: 0.3 }}
                    className="border-r border-[#e8eaed] px-1 flex-shrink-0 text-[#3c4043] overflow-hidden whitespace-nowrap flex items-center"
                  >
                    {val}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Game area */}
        <div className="relative z-10 flex items-start justify-center w-full pt-6 gap-4">
          <div className="flex flex-col">
            {/* Named range label */}
            <div className="flex items-center gap-1.5 mb-1">
              <div
                className="text-white font-medium rounded-sm px-1.5 py-0.5"
                style={{ backgroundColor: '#1a73e8', fontSize: 10 }}
              >
                J3:S23
              </div>
              <span className="text-[#5f6368]" style={{ fontSize: 10 }}>선택된 범위</span>
            </div>
            {/* Board */}
            <div
              style={{
                width: BOARD_WIDTH * 24,
                height: BOARD_HEIGHT * 24,
                border: '2px solid #1a73e8',
                backgroundColor: 'rgba(255,255,255,0.97)',
                boxShadow: '0 2px 8px rgba(26,115,232,0.18)',
              }}
            >
              {displayBoard.map((row, ri) => (
                <div key={ri} className="flex">
                  {row.map((cell, ci) => (
                    <div
                      key={ci}
                      style={{
                        width: 24,
                        height: 24,
                        backgroundColor: cell === 'ghost' ? 'rgba(26,115,232,0.08)' : cell || 'transparent',
                        border: cell && cell !== 'ghost'
                          ? `1px solid ${PIECE_BORDERS[cell] || 'rgba(0,0,0,0.15)'}`
                          : '1px solid rgba(218,220,224,0.5)',
                        boxSizing: 'border-box',
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Side panel — Google Sheets sidebar */}
          <div
            style={{
              backgroundColor: 'white',
              border: '1px solid #dadce0',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              minWidth: 148,
              borderRadius: 2,
            }}
          >
            <div className="px-3 py-2 border-b border-[#dadce0] bg-[#f8f9fa]">
              <div className="font-medium text-[#3c4043]" style={{ fontSize: 11 }}>범위 분석</div>
              <div className="text-[#80868b]" style={{ fontSize: 10 }}>J3:S23</div>
            </div>
            {[
              { label: 'SCORE', value: score.toLocaleString() },
              { label: 'LINES', value: String(lines) },
              { label: 'LEVEL', value: String(level) },
            ].map(({ label, value }) => (
              <div key={label} className="px-3 py-2 border-b border-[#e8eaed]">
                <div className="text-[#5f6368] mb-1 font-medium uppercase tracking-wide" style={{ fontSize: 10 }}>{label}</div>
                <div className="font-bold text-[#3c4043]" style={{ fontSize: label === 'SCORE' ? 14 : 12 }}>{value}</div>
              </div>
            ))}
            <div className="px-3 py-2 border-b border-[#e8eaed]">
              <div className="text-[#5f6368] mb-2 font-medium uppercase tracking-wide" style={{ fontSize: 10 }}>NEXT</div>
              <div className="flex flex-col items-center">
                {nextPiece && nextPiece.shape.map((row, r) => (
                  <div key={r} className="flex">
                    {row.map((cell, c) => (
                      <div key={c} style={{
                        width: 16, height: 16,
                        backgroundColor: cell ? nextPiece.color : 'transparent',
                        border: cell ? `1px solid ${PIECE_BORDERS[nextPiece.color] || 'rgba(0,0,0,0.15)'}` : '1px solid transparent',
                      }} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="px-3 py-2 border-b border-[#e8eaed]">
              {!started || gameOver ? (
                <button
                  onClick={startGame}
                  className="w-full text-white py-1.5 font-medium"
                  style={{ backgroundColor: '#1a73e8', borderRadius: 2, fontSize: 11 }}
                >
                  {gameOver ? '다시 시작' : '시작'}
                </button>
              ) : (
                <button
                  onClick={() => { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current); }}
                  className="w-full text-white py-1.5 font-medium"
                  style={{ backgroundColor: paused ? '#1a73e8' : '#5f6368', borderRadius: 2, fontSize: 11 }}
                >
                  {paused ? '계속' : '일시정지'}
                </button>
              )}
            </div>
            <div className="px-3 py-2">
              <div className="text-[#5f6368] mb-1 font-medium uppercase tracking-wide" style={{ fontSize: 10 }}>CONTROLS</div>
              <div className="text-[#80868b] space-y-0.5" style={{ fontSize: 10 }}>
                <div>← → 이동</div>
                <div>↑ 회전</div>
                <div>↓ 빠르게</div>
                <div>Space 낙하</div>
                <div>P 일시정지</div>
              </div>
            </div>
          </div>
        </div>

        {paused && (
          <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.75)' }}>
            <div className="bg-white border border-[#dadce0] shadow-lg px-8 py-6 text-center" style={{ borderRadius: 4 }}>
              <div className="text-2xl mb-2">⏸</div>
              <div className="font-medium text-[#3c4043]" style={{ fontSize: 14 }}>일시 정지됨</div>
              <div className="text-[#5f6368] mt-1" style={{ fontSize: 11 }}>P 를 눌러 계속하세요</div>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white border border-[#dadce0] shadow-xl px-8 py-6 text-center" style={{ borderRadius: 4 }}>
              <div className="text-2xl mb-2">🏁</div>
              <div className="font-bold text-[#3c4043] mb-2" style={{ fontSize: 18 }}>게임 오버</div>
              <div className="text-[#5f6368] mb-1" style={{ fontSize: 13 }}>최종 점수: <strong>{score.toLocaleString()}</strong></div>
              <div className="text-[#80868b] mb-4" style={{ fontSize: 11 }}>처리 라인: {lines} | 달성 레벨: {level}</div>
              <div className="flex gap-2 justify-center">
                <button onClick={startGame} className="px-4 py-2 text-white" style={{ backgroundColor: '#1a73e8', borderRadius: 2, fontSize: 13 }}>
                  다시 시작
                </button>
                <Link href="/" className="px-4 py-2 text-[#3c4043] hover:bg-[#f1f3f4]" style={{ border: '1px solid #dadce0', borderRadius: 2, fontSize: 13 }}>
                  포털로
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sheet tabs */}
      <div className="flex items-center border-t border-[#dadce0] bg-[#f8f9fa] px-2 py-0.5 gap-0.5">
        <button className="bg-white border border-[#dadce0] border-b-white px-3 py-1 -mb-px text-[#3c4043] font-medium" style={{ fontSize: 11 }}>
          Q4 Planning
        </button>
        {['Q3 Actuals','Headcount','Budget vs Actual'].map(t => (
          <button key={t} className="text-[#5f6368] hover:bg-[#e8eaed] px-3 py-1" style={{ fontSize: 11 }}>{t}</button>
        ))}
        <span className="ml-1 text-[#5f6368] text-base leading-none cursor-pointer hover:bg-[#e8eaed] px-1">+</span>
      </div>
    </div>
  );
}
