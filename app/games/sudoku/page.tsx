'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { logGameEvent } from '@/lib/logger';

function generatePuzzle(): { puzzle: (number | null)[][], solution: number[][] } {
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

// Fake data rows above
const ROW_ABOVE_1_CELLS = ['분석ID', '데이터1', '데이터2', '데이터3', '데이터4', '데이터5', '데이터6', '데이터7', '데이터8', '데이터9', '합계', '비고'];
const ROW_ABOVE_2_CELLS = ['A-001', '5', '3', '7', '8', '6', '1', '9', '2', '4', '45', '검증완료'];

// Fake totals below
const TOTALS_ROW = ['합계', '47', '41', '52', '38', '64', '55', '43', '57', '49', '446', ''];
const AVERAGE_ROW = ['평균', '5.2', '4.6', '5.8', '4.2', '7.1', '6.1', '4.8', '6.3', '5.4', '49.6', ''];

// Fake right-side values (J and K cols) per data row
const RIGHT_VALS = [
  ['45', '100.0%'],
  ['38', '84.4%'],
  ['41', '91.1%'],
  ['52', '115.6%'],
  ['36', '80.0%'],
  ['49', '108.9%'],
  ['44', '97.8%'],
  ['53', '117.8%'],
  ['47', '104.4%'],
];

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
    setFormulaBarText(val ? `=SUDOKU_VAL(${COLS[c]}${r + 4})` : `=${COLS[c]}${r + 4}`);
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
        if (cellNotes.has(num)) cellNotes.delete(num);
        else cellNotes.add(num);
        newNotes.set(key, cellNotes);
        return newNotes;
      });
      return;
    }

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);

    if (num !== null && num !== solution[r]?.[c]) {
      setErrors(prev => new Set([...prev, getCellKey(r, c)]));
    } else {
      setErrors(prev => {
        const newErrors = new Set(prev);
        newErrors.delete(getCellKey(r, c));
        return newErrors;
      });
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
      if (e.key >= '1' && e.key <= '9') handleInput(parseInt(e.key));
      else if (e.key === 'Backspace' || e.key === 'Delete') handleInput(null);
      else if (e.key === 'ArrowUp' && r > 0) setSelected([r - 1, c]);
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
    let style: React.CSSProperties = {
      borderTop: r % 3 === 0 ? '2px solid #888' : '1px solid #d0d0d0',
      borderLeft: c % 3 === 0 ? '2px solid #888' : '1px solid #d0d0d0',
      borderBottom: r === 8 ? '2px solid #888' : '1px solid #d0d0d0',
      borderRight: c === 8 ? '2px solid #888' : '1px solid #d0d0d0',
    };
    return style;
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

  // Excel cell dimensions
  const CELL_W = 40;
  const CELL_H = 32;
  const ROW_NUM_W = 32;
  const HEADER_H = 24;
  const EXTRA_COL_W = 56;

  return (
    <div className="min-h-screen bg-white flex flex-col text-xs font-sans">
      {/* Excel Title bar */}
      <div className="bg-[#217346] border-b border-[#1a5c38] px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-white text-[#217346] font-black px-1.5 py-0.5 text-sm leading-none">X</div>
          <span className="text-white text-xs">수도쿠_분석데이터_v3.xlsx - Microsoft Excel</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="text-white opacity-70 hover:opacity-100 hover:bg-[#1a5c38] px-2 py-0.5">─</button>
          <button className="text-white opacity-70 hover:opacity-100 hover:bg-[#1a5c38] px-2 py-0.5">□</button>
          <button className="text-white opacity-70 hover:opacity-100 hover:bg-red-600 px-2 py-0.5">✕</button>
        </div>
      </div>

      {/* Menu bar */}
      <div className="bg-[#f2f2f2] border-b border-[#d0d0d0] px-2 py-0.5 flex items-center gap-0">
        <Link href="/" className="text-[#444] hover:bg-[#e0e0e0] px-2 py-1 text-xs">← 업무 포털로</Link>
        <span className="text-[#d0d0d0] mx-1">|</span>
        {['파일', '홈', '삽입', '페이지 레이아웃', '수식', '데이터', '검토', '보기'].map(item => (
          <button key={item} className="text-[#444] hover:bg-[#e0e0e0] px-2 py-1">{item}</button>
        ))}
      </div>

      {/* Ribbon */}
      <div className="bg-[#f9f9f9] border-b border-[#d0d0d0] px-3 py-1.5 flex items-center gap-3">
        <div className="flex items-center gap-1.5 border-r border-[#d0d0d0] pr-3">
          <select className="border border-[#ababab] text-xs px-1 py-0.5 bg-white w-28">
            <option>맑은 고딕</option>
          </select>
          <select className="border border-[#ababab] text-xs px-1 py-0.5 bg-white w-12">
            <option>11</option>
          </select>
          <div className="flex gap-0.5">
            <button className="border border-[#d0d0d0] px-1.5 py-0.5 bg-white hover:bg-[#e0e0e0] font-bold text-xs">B</button>
            <button className="border border-[#d0d0d0] px-1.5 py-0.5 bg-white hover:bg-[#e0e0e0] italic text-xs">I</button>
            <button className="border border-[#d0d0d0] px-1.5 py-0.5 bg-white hover:bg-[#e0e0e0] underline text-xs">U</button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 border-r border-[#d0d0d0] pr-3">
          <button
            onClick={() => setIsNoteMode(!isNoteMode)}
            className={`border px-2 py-0.5 text-xs ${isNoteMode ? 'bg-[#cce5ff] border-[#80bdff] text-[#004085]' : 'border-[#d0d0d0] bg-white hover:bg-[#e0e0e0]'}`}
          >
            메모 모드 {isNoteMode ? 'ON' : 'OFF'}
          </button>
          <button onClick={newGame} className="border border-[#d0d0d0] px-2 py-0.5 bg-white hover:bg-[#e0e0e0] text-xs">
            새 파일
          </button>
        </div>
        <div className="flex items-center gap-3 text-[#555]">
          <span>난이도: {difficulty}</span>
          <span>시간: <span className="font-mono text-[#217346] font-bold">{formatTime(timer)}</span></span>
          {errors.size > 0 && <span className="text-red-600 font-medium">오류: {errors.size}개</span>}
        </div>
      </div>

      {/* Formula bar */}
      <div className="bg-white border-b border-[#d0d0d0] px-2 py-1 flex items-center gap-2">
        <div className="bg-white border border-[#ababab] px-2 py-0.5 w-16 text-center font-mono text-xs">
          {selected ? `${COLS[selected[1]]}${selected[0] + 4}` : ''}
        </div>
        <div className="text-[#888] font-italic text-xs">fx</div>
        <div className="flex-1 bg-white border border-[#d0d0d0] px-2 py-0.5 font-mono text-xs text-[#333]">
          {formulaBarText || (selected ? `데이터 분석 셀 ${COLS[selected[1]]}${selected[0] + 4}` : '셀을 선택하세요')}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main spreadsheet area */}
        <div className="flex-1 overflow-auto p-3 bg-white">
          {/* ── Column headers ── */}
          <div className="flex">
            {/* Corner */}
            <div style={{ width: ROW_NUM_W, height: HEADER_H }} className="bg-[#f2f2f2] border border-[#d0d0d0] flex-shrink-0" />
            {/* Sudoku cols A-I + J K */}
            {[...COLS, 'J', 'K'].map((col, ci) => (
              <div
                key={col}
                style={{ width: ci < 9 ? CELL_W : EXTRA_COL_W, height: HEADER_H }}
                className={`border border-[#d0d0d0] flex-shrink-0 flex items-center justify-center font-medium
                  ${selected && selected[1] === ci ? 'bg-[#fff2cc] font-bold text-[#7d5a00]' : 'bg-[#f2f2f2] text-[#555]'}`}
              >
                {col}
              </div>
            ))}
          </div>

          {/* ── Row 1: merged header ── */}
          <div className="flex">
            <div style={{ width: ROW_NUM_W, height: CELL_H }} className="bg-[#f2f2f2] border border-[#d0d0d0] flex-shrink-0 flex items-center justify-center text-[#555]">1</div>
            <div
              style={{ width: CELL_W * 9 + EXTRA_COL_W * 2, height: CELL_H }}
              className="border border-[#d0d0d0] flex-shrink-0 bg-[#dce6f1] flex items-center px-2 font-bold text-[#1f497d]"
            >
              수도쿠 데이터 분석 보고서 Q4-2024
            </div>
          </div>

          {/* ── Row 2: column label headers ── */}
          <div className="flex">
            <div style={{ width: ROW_NUM_W, height: CELL_H }} className="bg-[#f2f2f2] border border-[#d0d0d0] flex-shrink-0 flex items-center justify-center text-[#555]">2</div>
            {ROW_ABOVE_1_CELLS.map((label, ci) => (
              <div
                key={ci}
                style={{ width: ci < 9 ? CELL_W : EXTRA_COL_W, height: CELL_H, fontSize: 10 }}
                className="border border-[#d0d0d0] flex-shrink-0 bg-[#f2f2f2] flex items-center justify-center font-medium text-[#444] text-center px-0.5 overflow-hidden"
              >
                {label}
              </div>
            ))}
          </div>

          {/* ── Row 3: sample data row ── */}
          <div className="flex">
            <div style={{ width: ROW_NUM_W, height: CELL_H }} className="bg-[#f2f2f2] border border-[#d0d0d0] flex-shrink-0 flex items-center justify-center text-[#555]">3</div>
            {ROW_ABOVE_2_CELLS.map((val, ci) => (
              <div
                key={ci}
                style={{ width: ci < 9 ? CELL_W : EXTRA_COL_W, height: CELL_H }}
                className="border border-[#d0d0d0] flex-shrink-0 bg-white flex items-center justify-center text-[#333]"
              >
                {val}
              </div>
            ))}
          </div>

          {/* ── Sudoku rows (4–12) ── */}
          {board.map((row, ri) => (
            <div key={ri} className="flex">
              {/* Row number */}
              <div
                style={{ width: ROW_NUM_W, height: CELL_H }}
                className={`border border-[#d0d0d0] flex-shrink-0 flex items-center justify-center font-medium
                  ${selected && selected[0] === ri ? 'bg-[#fff2cc] font-bold text-[#7d5a00]' : 'bg-[#f2f2f2] text-[#555]'}`}
              >
                {ri + 4}
              </div>
              {/* Sudoku cells */}
              {row.map((val, ci) => {
                const key = getCellKey(ri, ci);
                const isSelected = selected?.[0] === ri && selected?.[1] === ci;
                const isErr = errors.has(key);
                const isSame = !isSelected && isSameNumber(ri, ci);
                const isRel = !isSelected && !isSame && isRelated(ri, ci);
                const cellNotes = notes.get(key);
                const boxStyle = getBoxBorder(ri, ci);

                let bgColor = 'white';
                if (isSelected) bgColor = '#e8f0fe';
                else if (isErr) bgColor = '#fce8e8';
                else if (isSame) bgColor = '#e8f0fe';
                else if (isRel) bgColor = '#f8f9fa';

                return (
                  <div
                    key={ci}
                    onClick={() => handleCellClick(ri, ci)}
                    style={{
                      width: CELL_W,
                      height: CELL_H,
                      ...boxStyle,
                      backgroundColor: bgColor,
                      ...(isSelected ? { border: '2px solid #1a73e8', zIndex: 10 } : {}),
                      position: 'relative',
                    }}
                    className="flex-shrink-0 flex items-center justify-center cursor-pointer select-none"
                  >
                    {val ? (
                      <span
                        className="font-bold"
                        style={{
                          fontSize: 13,
                          color: isFixed(ri, ci) ? '#1f2937' : isErr ? '#dc2626' : '#1565c0',
                        }}
                      >
                        {val}
                      </span>
                    ) : cellNotes && cellNotes.size > 0 ? (
                      <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5">
                        {[1,2,3,4,5,6,7,8,9].map(n => (
                          <span key={n} className="flex items-center justify-center text-[#999]" style={{ fontSize: 7 }}>
                            {cellNotes.has(n) ? n : ''}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {/* J and K extra cols */}
              {RIGHT_VALS[ri] && RIGHT_VALS[ri].map((v, ki) => (
                <div
                  key={ki}
                  style={{ width: EXTRA_COL_W, height: CELL_H }}
                  className="border border-[#d0d0d0] flex-shrink-0 bg-[#f9f9f9] flex items-center justify-center text-[#333]"
                >
                  {v}
                </div>
              ))}
            </div>
          ))}

          {/* ── Row 13: Totals ── */}
          <div className="flex">
            <div style={{ width: ROW_NUM_W, height: CELL_H }} className="bg-[#f2f2f2] border border-[#d0d0d0] flex-shrink-0 flex items-center justify-center text-[#555]">13</div>
            {TOTALS_ROW.map((val, ci) => (
              <div
                key={ci}
                style={{ width: ci < 9 ? CELL_W : EXTRA_COL_W, height: CELL_H }}
                className="border border-[#d0d0d0] flex-shrink-0 bg-[#f2f2f2] flex items-center justify-center font-medium text-[#333]"
              >
                {val}
              </div>
            ))}
          </div>

          {/* ── Row 14: Averages ── */}
          <div className="flex">
            <div style={{ width: ROW_NUM_W, height: CELL_H }} className="bg-[#f2f2f2] border border-[#d0d0d0] flex-shrink-0 flex items-center justify-center text-[#555]">14</div>
            {AVERAGE_ROW.map((val, ci) => (
              <div
                key={ci}
                style={{ width: ci < 9 ? CELL_W : EXTRA_COL_W, height: CELL_H }}
                className="border border-[#d0d0d0] flex-shrink-0 bg-[#f2f2f2] flex items-center justify-center font-medium text-[#333]"
              >
                {val}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — Excel task pane style */}
        <div className="w-40 bg-white border-l border-[#d0d0d0] flex flex-col" style={{ fontSize: 11 }}>
          {/* Task pane title */}
          <div className="bg-[#f2f2f2] border-b border-[#d0d0d0] px-2 py-1.5 flex items-center justify-between">
            <span className="font-medium text-[#333]">입력 도우미</span>
            <button className="text-[#888] hover:text-[#333] hover:bg-[#e0e0e0] px-1 leading-none" style={{ fontSize: 13 }}>✕</button>
          </div>

          {/* Number input section */}
          <div className="bg-[#f2f2f2] border-b border-[#d0d0d0] px-2 py-1">
            <span className="font-medium text-[#555]" style={{ fontSize: 10 }}>숫자 입력</span>
          </div>
          <div className="p-2">
            <div className="grid grid-cols-3 gap-1">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button
                  key={n}
                  onClick={() => handleInput(n)}
                  className={`h-9 border font-medium transition-colors
                    ${selectedVal === n ? 'bg-[#217346] text-white border-[#1a5c38]' : 'bg-white border-[#d0d0d0] hover:bg-[#e8f0fe] hover:border-[#1a73e8] text-[#333]'}`}
                  style={{ fontSize: 13 }}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleInput(null)}
              className="w-full h-7 bg-white border border-[#d0d0d0] hover:bg-[#fce8e8] hover:border-[#dc2626] text-[#555] mt-1"
              style={{ fontSize: 11 }}
            >
              지우기 (Del)
            </button>
          </div>

          {/* Help section */}
          <div className="bg-[#f2f2f2] border-t border-b border-[#d0d0d0] px-2 py-1">
            <span className="font-medium text-[#555]" style={{ fontSize: 10 }}>도움말</span>
          </div>
          <div className="p-2 text-[#666] space-y-1" style={{ fontSize: 10 }}>
            <div>• 화살표: 셀 이동</div>
            <div>• 1-9: 숫자 입력</div>
            <div>• Del: 삭제</div>
            <div>• 메모 모드: 후보 수</div>
          </div>

          {/* Stats section */}
          <div className="mt-auto border-t border-[#d0d0d0]">
            <div className="bg-[#f2f2f2] border-b border-[#d0d0d0] px-2 py-1">
              <span className="font-medium text-[#555]" style={{ fontSize: 10 }}>통계</span>
            </div>
            <div className="p-2 text-[#666] space-y-1" style={{ fontSize: 10 }}>
              <div>오류: <span className={errors.size > 0 ? 'text-red-600 font-bold' : 'text-[#217346] font-bold'}>{errors.size}</span></div>
              <div>진행: {board.flat().filter(v => v !== null).length}/81</div>
              <div>시간: {formatTime(timer)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet tabs */}
      <div className="bg-[#f2f2f2] border-t border-[#d0d0d0] flex items-center px-2 py-0.5 gap-1">
        <button className="bg-white border border-[#ababab] border-b-white px-3 py-1 -mb-px text-[#333] font-medium text-xs">
          수도쿠_데이터
        </button>
        <button className="text-[#555] hover:bg-[#e0e0e0] px-3 py-1 text-xs">시트2</button>
        <button className="text-[#555] hover:bg-[#e0e0e0] px-3 py-1 text-xs">통계</button>
        <span className="ml-2 text-[#888] text-sm cursor-pointer hover:bg-[#e0e0e0] px-1">+</span>
      </div>

      {/* Status bar — Excel green */}
      <div className="bg-[#217346] text-white px-3 py-0.5 flex items-center justify-between text-xs">
        <div className="flex gap-3 items-center">
          <span>준비</span>
          {selected && <span>셀: {COLS[selected[1]]}{selected[0] + 4}</span>}
          <span>|</span>
          <span>난이도: {difficulty}</span>
        </div>
        <div className="flex gap-3 items-center">
          <span>{formatTime(timer)}</span>
          <span>|</span>
          {/* Sheet view icons */}
          <span className="opacity-80">▤</span>
          <span className="opacity-80">⊞</span>
          <span className="opacity-80">⊟</span>
          <span>|</span>
          <span>100%</span>
          <span className="opacity-60">—●—</span>
        </div>
      </div>

      {/* Completion modal */}
      {isComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#d0d0d0] shadow-xl p-6 max-w-sm w-full text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="font-bold text-[#333] mb-2" style={{ fontSize: 18 }}>수도쿠 완성!</h2>
            <p className="text-[#555] mb-1" style={{ fontSize: 13 }}>클리어 시간: <strong>{formatTime(timer)}</strong></p>
            <p className="text-[#888] mb-4" style={{ fontSize: 11 }}>오류 없이 완벽하게 해결하셨습니다.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={newGame} className="px-4 py-2 bg-[#217346] text-white hover:bg-[#1a5c38]" style={{ fontSize: 13 }}>
                새 게임
              </button>
              <Link href="/" className="px-4 py-2 border border-[#d0d0d0] text-[#333] hover:bg-[#f2f2f2]" style={{ fontSize: 13 }}>
                포털로 이동
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
