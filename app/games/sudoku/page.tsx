'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { logGameEvent } from '@/lib/logger';

// Sudoku puzzle generator
function generatePuzzle(): { puzzle: (number | null)[][], solution: number[][] } {
  // A set of pre-made puzzles (puzzle/solution pairs)
  const puzzles = [
    {
      puzzle: [
        [5,3,null,null,7,null,null,null,null],
        [6,null,null,1,9,5,null,null,null],
        [null,9,8,null,null,null,null,6,null],
        [8,null,null,null,6,null,null,null,3],
        [4,null,null,8,null,3,null,null,1],
        [7,null,null,null,2,null,null,null,6],
        [null,6,null,null,null,null,2,8,null],
        [null,null,null,4,1,9,null,null,5],
        [null,null,null,null,8,null,null,7,9],
      ],
      solution: [
        [5,3,4,6,7,8,9,1,2],
        [6,7,2,1,9,5,3,4,8],
        [1,9,8,3,4,2,5,6,7],
        [8,5,9,7,6,1,4,2,3],
        [4,2,6,8,5,3,7,9,1],
        [7,1,3,9,2,4,8,5,6],
        [9,6,1,5,3,7,2,8,4],
        [2,8,7,4,1,9,6,3,5],
        [3,4,5,2,8,6,1,7,9],
      ],
    },
    {
      puzzle: [
        [null,null,null,2,6,null,7,null,1],
        [6,8,null,null,7,null,null,9,null],
        [1,9,null,null,null,4,5,null,null],
        [8,2,null,1,null,null,null,4,null],
        [null,null,4,6,null,2,9,null,null],
        [null,5,null,null,null,3,null,2,8],
        [null,null,9,3,null,null,null,7,4],
        [null,4,null,null,5,null,null,3,6],
        [7,null,3,null,1,8,null,null,null],
      ],
      solution: [
        [4,3,5,2,6,9,7,8,1],
        [6,8,2,5,7,1,4,9,3],
        [1,9,7,8,3,4,5,6,2],
        [8,2,6,1,9,5,3,4,7],
        [3,7,4,6,8,2,9,1,5],
        [9,5,1,7,4,3,6,2,8],
        [5,1,9,3,2,6,8,7,4],
        [2,4,8,9,5,7,1,3,6],
        [7,6,3,4,1,8,2,5,9],
      ],
    },
    {
      puzzle: [
        [null,2,null,null,null,null,null,null,null],
        [null,null,null,6,null,null,null,null,3],
        [null,7,4,null,8,null,null,null,null],
        [null,null,null,null,null,3,null,null,2],
        [null,8,null,null,4,null,null,1,null],
        [6,null,null,5,null,null,null,null,null],
        [null,null,null,null,1,null,7,8,null],
        [5,null,null,null,null,9,null,null,null],
        [null,null,null,null,null,null,null,4,null],
      ],
      solution: [
        [1,2,6,4,3,7,9,5,8],
        [8,9,5,6,2,1,4,7,3],
        [3,7,4,9,8,5,1,2,6],
        [4,5,7,1,9,3,8,6,2],
        [9,8,3,2,4,6,5,1,7],
        [6,1,2,5,7,8,3,9,4],
        [2,6,9,3,1,4,7,8,5],
        [5,4,8,7,6,9,2,3,1],
        [7,3,1,8,5,2,6,4,9],
      ],
    },
  ];

  const idx = Math.floor(Math.random() * puzzles.length);
  return puzzles[idx];
}

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

export default function SudokuPage() {
  const [puzzle, setPuzzle] = useState<(number | null)[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [board, setBoard] = useState<(number | null)[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Map<string, Set<number>>>(new Map());
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [formulaBarText, setFormulaBarText] = useState('');
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [difficulty] = useState('보통');

  useEffect(() => {
    const { puzzle: p, solution: s } = generatePuzzle();
    setPuzzle(p);
    setSolution(s);
    setBoard(p.map(row => [...row]));
    logGameEvent('sudoku', 'enter');
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const t = setInterval(() => setTimer(prev => prev + 1), 1000);
    return () => clearInterval(t);
  }, [timerRunning]);

  useEffect(() => {
    return () => { logGameEvent('sudoku', 'exit'); };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const getCellKey = (r: number, c: number) => `${r},${c}`;

  const isFixed = (r: number, c: number) => puzzle[r]?.[c] !== null && puzzle[r]?.[c] !== undefined;

  const handleCellClick = (r: number, c: number) => {
    setSelected([r, c]);
    const val = board[r]?.[c];
    if (val) {
      setFormulaBarText(`=SUDOKU_VAL(${COLS[c]}${r + 1})`);
    } else {
      setFormulaBarText(`=${COLS[c]}${r + 1}`);
    }
  };

  const checkComplete = useCallback((b: (number | null)[][]) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] !== solution[r]?.[c]) return false;
      }
    }
    return true;
  }, [solution]);

  const handleInput = useCallback((num: number | null) => {
    if (!selected) return;
    const [r, c] = selected;
    if (isFixed(r, c)) return;

    if (isNoteMode && num !== null) {
      const key = getCellKey(r, c);
      setNotes(prev => {
        const newNotes = new Map(prev);
        const cellNotes = new Set(newNotes.get(key) || []);
        if (cellNotes.has(num)) {
          cellNotes.delete(num);
        } else {
          cellNotes.add(num);
        }
        newNotes.set(key, cellNotes);
        return newNotes;
      });
      return;
    }

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);

    // Check for errors
    if (num !== null && num !== solution[r]?.[c]) {
      setErrors(prev => new Set([...prev, getCellKey(r, c)]));
    } else {
      setErrors(prev => {
        const newErrors = new Set(prev);
        newErrors.delete(getCellKey(r, c));
        return newErrors;
      });
      // Clear notes for this cell
      if (num !== null) {
        setNotes(prev => {
          const newNotes = new Map(prev);
          newNotes.delete(getCellKey(r, c));
          return newNotes;
        });
      }
    }

    if (num !== null && checkComplete(newBoard)) {
      setIsComplete(true);
      setTimerRunning(false);
      logGameEvent('sudoku', 'complete');
    }
  }, [selected, board, solution, isNoteMode, isFixed, checkComplete]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!selected) return;
      const [r, c] = selected;
      if (e.key >= '1' && e.key <= '9') {
        handleInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleInput(null);
      } else if (e.key === 'ArrowUp' && r > 0) setSelected([r - 1, c]);
      else if (e.key === 'ArrowDown' && r < 8) setSelected([r + 1, c]);
      else if (e.key === 'ArrowLeft' && c > 0) setSelected([r, c - 1]);
      else if (e.key === 'ArrowRight' && c < 8) setSelected([r, c + 1]);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selected, handleInput]);

  const newGame = () => {
    const { puzzle: p, solution: s } = generatePuzzle();
    setPuzzle(p);
    setSolution(s);
    setBoard(p.map(row => [...row]));
    setSelected(null);
    setErrors(new Set());
    setNotes(new Map());
    setIsComplete(false);
    setTimer(0);
    setTimerRunning(true);
  };

  const getBoxBorder = (r: number, c: number) => {
    let classes = 'border border-gray-300';
    if (c % 3 === 0) classes += ' border-l-2 border-l-gray-500';
    if (c === 8) classes += ' border-r-2 border-r-gray-500';
    if (r % 3 === 0) classes += ' border-t-2 border-t-gray-500';
    if (r === 8) classes += ' border-b-2 border-b-gray-500';
    return classes;
  };

  const isSameNumber = (r: number, c: number) => {
    if (!selected) return false;
    const [sr, sc] = selected;
    const selVal = board[sr]?.[sc];
    return selVal !== null && board[r]?.[c] === selVal;
  };

  const isRelated = (r: number, c: number) => {
    if (!selected) return false;
    const [sr, sc] = selected;
    return r === sr || c === sc || (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3));
  };

  const selectedVal = selected ? board[selected[0]]?.[selected[1]] : null;

  return (
    <div className="min-h-screen bg-white flex flex-col text-xs font-sans">
      {/* Excel Title bar */}
      <div className="bg-gray-200 border-b border-gray-400 px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-green-700 text-base font-bold">X</div>
          <span className="text-gray-700 text-xs">수도쿠_분석데이터_v3.xlsx - Microsoft Excel</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="text-gray-500 hover:bg-gray-300 px-2 py-0.5">─</button>
          <button className="text-gray-500 hover:bg-gray-300 px-2 py-0.5">□</button>
          <button className="text-gray-500 hover:bg-red-500 hover:text-white px-2 py-0.5">✕</button>
        </div>
      </div>

      {/* Menu bar */}
      <div className="bg-gray-100 border-b border-gray-300 px-2 py-0.5 flex items-center gap-1">
        <Link
          href="/"
          className="text-gray-600 hover:bg-gray-200 px-2 py-1 text-xs"
        >
          ← 업무 포털로
        </Link>
        <span className="text-gray-300">|</span>
        {['파일', '홈', '삽입', '페이지 레이아웃', '수식', '데이터', '검토', '보기'].map(item => (
          <button key={item} className="text-gray-700 hover:bg-gray-200 px-2 py-1">{item}</button>
        ))}
      </div>

      {/* Ribbon */}
      <div className="bg-gray-50 border-b border-gray-300 px-3 py-1.5 flex items-center gap-4">
        <div className="flex items-center gap-2 border-r border-gray-300 pr-4">
          <select className="border border-gray-400 text-xs px-1 py-0.5 bg-white w-28">
            <option>맑은 고딕</option>
          </select>
          <select className="border border-gray-400 text-xs px-1 py-0.5 bg-white w-12">
            <option>11</option>
          </select>
          <div className="flex gap-0.5">
            <button className="border border-gray-300 px-1.5 py-0.5 bg-white hover:bg-gray-100 font-bold">B</button>
            <button className="border border-gray-300 px-1.5 py-0.5 bg-white hover:bg-gray-100 italic">I</button>
            <button className="border border-gray-300 px-1.5 py-0.5 bg-white hover:bg-gray-100 underline">U</button>
          </div>
        </div>
        <div className="flex items-center gap-2 border-r border-gray-300 pr-4">
          <button
            onClick={() => setIsNoteMode(!isNoteMode)}
            className={`border px-2 py-0.5 text-xs ${isNoteMode ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-300 bg-white hover:bg-gray-100'}`}
          >
            메모 모드 {isNoteMode ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={newGame}
            className="border border-gray-300 px-2 py-0.5 bg-white hover:bg-gray-100"
          >
            새 파일
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>난이도: {difficulty}</span>
          <span>시간: <span className="font-mono text-blue-700">{formatTime(timer)}</span></span>
          {errors.size > 0 && <span className="text-red-600">오류: {errors.size}개</span>}
        </div>
      </div>

      {/* Formula bar */}
      <div className="bg-white border-b border-gray-300 px-2 py-1 flex items-center gap-2">
        <div className="bg-white border border-gray-400 text-xs px-2 py-1 w-16 text-center font-mono">
          {selected ? `${COLS[selected[1]]}${selected[0] + 1}` : ''}
        </div>
        <div className="text-gray-400">fx</div>
        <div className="flex-1 bg-white border border-gray-300 px-2 py-1 font-mono text-xs text-gray-700">
          {formulaBarText || (selected ? `데이터 분석 셀 ${selected ? `${COLS[selected[1]]}${selected[0] + 1}` : ''}` : '셀을 선택하세요')}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main spreadsheet area */}
        <div className="flex-1 overflow-auto p-4 bg-white">
          {/* Column headers */}
          <div className="flex">
            <div className="w-8 h-6 bg-gray-100 border border-gray-300 flex-shrink-0" />
            {/* Row number col */}
            <div className="w-8 bg-gray-100 border-r border-gray-300 flex-shrink-0" />
            {COLS.map((col, ci) => (
              <div
                key={col}
                className={`w-12 h-6 bg-gray-100 border border-gray-300 text-center text-xs text-gray-600 flex items-center justify-center font-medium flex-shrink-0
                  ${selected && selected[1] === ci ? 'bg-yellow-50 font-bold text-yellow-800' : ''}`}
              >
                {col}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {board.map((row, ri) => (
            <div key={ri} className="flex">
              {/* Row number */}
              <div className="w-8 h-12 bg-gray-100 border border-gray-300 text-center text-xs text-gray-600 flex items-center justify-center flex-shrink-0">
                {/* Box separator label */}
              </div>
              <div
                className={`w-8 bg-gray-100 border border-gray-300 text-center text-xs text-gray-600 flex items-center justify-center flex-shrink-0 font-medium
                  ${selected && selected[0] === ri ? 'bg-yellow-50 font-bold text-yellow-800' : ''}`}
              >
                {ri + 1}
              </div>
              {row.map((val, ci) => {
                const key = getCellKey(ri, ci);
                const isSelected = selected?.[0] === ri && selected?.[1] === ci;
                const isErr = errors.has(key);
                const isSame = !isSelected && isSameNumber(ri, ci);
                const isRel = !isSelected && !isSame && isRelated(ri, ci);
                const cellNotes = notes.get(key);

                return (
                  <div
                    key={ci}
                    onClick={() => handleCellClick(ri, ci)}
                    className={`
                      w-12 h-12 flex-shrink-0 flex items-center justify-center cursor-pointer select-none
                      ${getBoxBorder(ri, ci)}
                      ${isSelected ? 'bg-blue-200 border-2 border-blue-600 z-10' : ''}
                      ${isErr ? 'text-red-600 bg-red-50' : ''}
                      ${isSame ? 'bg-blue-100' : ''}
                      ${isRel && !isSelected ? 'bg-blue-50' : ''}
                      ${!isSelected && !isErr && !isSame && !isRel ? 'hover:bg-gray-50' : ''}
                    `}
                  >
                    {val ? (
                      <span className={`text-sm font-medium ${isFixed(ri, ci) ? 'text-gray-900' : isErr ? 'text-red-600' : 'text-blue-700'}`}>
                        {val}
                      </span>
                    ) : cellNotes && cellNotes.size > 0 ? (
                      <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5">
                        {[1,2,3,4,5,6,7,8,9].map(n => (
                          <span key={n} className={`text-center text-gray-400 leading-none flex items-center justify-center`} style={{ fontSize: '8px' }}>
                            {cellNotes.has(n) ? n : ''}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Right panel - numpad */}
        <div className="w-36 bg-gray-50 border-l border-gray-300 p-3 flex flex-col gap-2">
          <div className="text-xs font-bold text-gray-600 mb-1">입력 패널</div>
          <div className="grid grid-cols-3 gap-1">
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button
                key={n}
                onClick={() => handleInput(n)}
                className={`
                  h-10 border text-sm font-medium transition-colors
                  ${selectedVal === n ? 'bg-blue-600 text-white border-blue-700' : 'bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-400 text-gray-800'}
                `}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={() => handleInput(null)}
            className="w-full h-8 bg-white border border-gray-300 hover:bg-red-50 hover:border-red-400 text-gray-600 text-xs mt-1"
          >
            지우기 (Del)
          </button>

          <div className="mt-3 border-t border-gray-200 pt-3">
            <div className="text-xs font-bold text-gray-600 mb-1">도움말</div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>• 화살표: 셀 이동</div>
              <div>• 1-9: 숫자 입력</div>
              <div>• Del: 삭제</div>
              <div>• 메모 모드: 후보 수</div>
            </div>
          </div>

          <div className="mt-auto border-t border-gray-200 pt-3">
            <div className="text-xs text-gray-500">
              <div>오류: <span className={errors.size > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>{errors.size}</span></div>
              <div>진행: {board.flat().filter(v => v !== null).length}/81</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet tabs */}
      <div className="bg-gray-100 border-t border-gray-300 flex items-center px-2 py-0.5 gap-1">
        <button className="text-xs bg-white border border-gray-400 border-b-white px-3 py-1 -mb-px text-gray-800 font-medium">
          수도쿠_데이터
        </button>
        <button className="text-xs text-gray-500 hover:bg-gray-200 px-3 py-1">시트2</button>
        <button className="text-xs text-gray-500 hover:bg-gray-200 px-3 py-1">통계</button>
        <span className="ml-2 text-gray-400">+</span>
      </div>

      {/* Status bar */}
      <div className="bg-blue-800 text-white px-3 py-0.5 flex items-center justify-between text-xs">
        <div className="flex gap-4">
          <span>준비</span>
          {selected && <span>셀: {COLS[selected[1]]}{selected[0] + 1}</span>}
        </div>
        <div className="flex gap-4">
          <span>난이도: {difficulty}</span>
          <span>경과 시간: {formatTime(timer)}</span>
          <span>Num Lock</span>
        </div>
      </div>

      {/* Completion modal */}
      {isComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 shadow-xl p-6 max-w-sm w-full text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">수도쿠 완성!</h2>
            <p className="text-sm text-gray-600 mb-1">클리어 시간: <strong>{formatTime(timer)}</strong></p>
            <p className="text-xs text-gray-400 mb-4">오류 없이 완벽하게 해결하셨습니다.</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={newGame}
                className="px-4 py-2 bg-blue-800 text-white text-sm hover:bg-blue-900"
              >
                새 게임
              </button>
              <Link href="/" className="px-4 py-2 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
                포털로 이동
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
