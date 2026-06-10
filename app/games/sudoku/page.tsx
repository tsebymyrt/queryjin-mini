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
const ROW_ABOVE_1_CELLS = ['분석ID', '데이터1', '데이터2', '데이터3', '데이터4', '데이터5', '데이터6', '데이터7', '데이터8', '데이터9', '합계', '비고', 'L지표', 'M지표', 'N비율', 'O총계'];
const ROW_ABOVE_2_CELLS = ['A-001', '5', '3', '7', '8', '6', '1', '9', '2', '4', '45', '검증완료', '12.3', '88.4%', '0.92', '1,024'];

// Fake totals below
const TOTALS_ROW = ['합계', '47', '41', '52', '38', '64', '55', '43', '57', '49', '446', '', '98.2', '72.1%', '0.88', '8,421'];
const AVERAGE_ROW = ['평균', '5.2', '4.6', '5.8', '4.2', '7.1', '6.1', '4.8', '6.3', '5.4', '49.6', '', '10.9', '80.1%', '0.90', '936'];

// Fake right-side values per data row
const RIGHT_VALS = [
  ['45', '100.0%', '11.2', '91.2%', '0.95', '820'],
  ['38', '84.4%', '9.8', '87.5%', '0.89', '740'],
  ['41', '91.1%', '10.1', '89.3%', '0.91', '780'],
  ['52', '115.6%', '12.8', '95.4%', '0.97', '960'],
  ['36', '80.0%', '9.2', '85.0%', '0.87', '710'],
  ['49', '108.9%', '11.9', '93.1%', '0.94', '900'],
  ['44', '97.8%', '10.8', '90.7%', '0.92', '840'],
  ['53', '117.8%', '13.1', '96.2%', '0.98', '980'],
  ['47', '104.4%', '11.5', '92.1%', '0.93', '870'],
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
    const style: React.CSSProperties = {
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

  // Smaller cell dimensions
  const CELL_W = 32;
  const CELL_H = 24;
  const ROW_NUM_W = 24;
  const HEADER_H = 18;
  const EXTRA_COL_W = 44;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans" style={{ fontSize: 10 }}>
      {/* Excel Title bar */}
      <div className="bg-[#217346] border-b border-[#1a5c38] px-2 py-0.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="bg-white text-[#217346] font-black px-1 py-0.5 leading-none" style={{ fontSize: 11 }}>X</div>
          <span className="text-white" style={{ fontSize: 10 }}>수도쿠_분석데이터_v3.xlsx - Microsoft Excel</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button className="text-white opacity-70 hover:opacity-100 hover:bg-[#1a5c38] px-1.5 py-0.5" style={{ fontSize: 10 }}>─</button>
          <button className="text-white opacity-70 hover:opacity-100 hover:bg-[#1a5c38] px-1.5 py-0.5" style={{ fontSize: 10 }}>□</button>
          <button className="text-white opacity-70 hover:opacity-100 hover:bg-red-600 px-1.5 py-0.5" style={{ fontSize: 10 }}>✕</button>
        </div>
      </div>

      {/* Menu bar */}
      <div className="bg-[#f2f2f2] border-b border-[#d0d0d0] px-1 py-0.5 flex items-center gap-0">
        <Link href="/" className="text-[#444] hover:bg-[#e0e0e0] px-1.5 py-0.5" style={{ fontSize: 10 }}>← 업무 포털로</Link>
        <span className="text-[#d0d0d0] mx-0.5">|</span>
        {['파일', '홈', '삽입', '페이지 레이아웃', '수식', '데이터', '검토', '보기'].map(item => (
          <button key={item} className="text-[#444] hover:bg-[#e0e0e0] px-1.5 py-0.5" style={{ fontSize: 10 }}>{item}</button>
        ))}
      </div>

      {/* Ribbon */}
      <div className="bg-[#f9f9f9] border-b border-[#d0d0d0] px-2 py-1 flex items-center gap-2">
        <div className="flex items-center gap-1 border-r border-[#d0d0d0] pr-2">
          <select className="border border-[#ababab] px-0.5 py-0.5 bg-white w-20" style={{ fontSize: 10 }}>
            <option>맑은 고딕</option>
          </select>
          <select className="border border-[#ababab] px-0.5 py-0.5 bg-white w-10" style={{ fontSize: 10 }}>
            <option>11</option>
          </select>
          <div className="flex gap-0.5">
            {['B','I','U'].map(b => (
              <button key={b} className="border border-[#d0d0d0] px-1 py-0.5 bg-white hover:bg-[#e0e0e0]" style={{ fontSize: 10 }}>{b}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 border-r border-[#d0d0d0] pr-2">
          <button
            onClick={() => setIsNoteMode(!isNoteMode)}
            className={`border px-1.5 py-0.5 ${isNoteMode ? 'bg-[#cce5ff] border-[#80bdff] text-[#004085]' : 'border-[#d0d0d0] bg-white hover:bg-[#e0e0e0]'}`}
            style={{ fontSize: 10 }}
          >
            메모 {isNoteMode ? 'ON' : 'OFF'}
          </button>
          <button onClick={newGame} className="border border-[#d0d0d0] px-1.5 py-0.5 bg-white hover:bg-[#e0e0e0]" style={{ fontSize: 10 }}>
            새 파일
          </button>
        </div>
        <div className="flex items-center gap-2 text-[#555]" style={{ fontSize: 10 }}>
          <span>난이도: {difficulty}</span>
          <span>시간: <span className="font-mono text-[#217346] font-bold">{formatTime(timer)}</span></span>
          {errors.size > 0 && <span className="text-red-600 font-medium">오류: {errors.size}개</span>}
        </div>
      </div>

      {/* Formula bar */}
      <div className="bg-white border-b border-[#d0d0d0] px-1.5 py-0.5 flex items-center gap-1.5" style={{ minHeight: 20 }}>
        <div className="bg-white border border-[#ababab] px-1 py-0.5 w-12 text-center font-mono" style={{ fontSize: 10 }}>
          {selected ? `${COLS[selected[1]]}${selected[0] + 4}` : ''}
        </div>
        <div className="text-[#888] italic" style={{ fontSize: 10 }}>fx</div>
        <div className="flex-1 bg-white border border-[#d0d0d0] px-1 py-0.5 font-mono text-[#333]" style={{ fontSize: 10 }}>
          {formulaBarText || (selected ? `데이터 분석 셀 ${COLS[selected[1]]}${selected[0] + 4}` : '셀을 선택하세요')}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main spreadsheet area */}
        <div className="flex-1 overflow-auto p-2 bg-white">
          {/* Column headers */}
          <div className="flex">
            <div style={{ width: ROW_NUM_W, height: HEADER_H }} className="bg-[#f2f2f2] border border-[#d0d0d0] flex-shrink-0" />
            {[...COLS, 'J', 'K', 'L', 'M', 'N', 'O'].map((col, ci) => (
              <div
                key={col}
                style={{ width: ci < 9 ? CELL_W : EXTRA_COL_W, height: HEADER_H, fontSize: 10 }}
                className={`border border-[#d0d0d0] flex-shrink-0 flex items-center justify-center font-medium
                  ${selected && selected[1] === ci ? 'bg-[#fff2cc] font-bold text-[#7d5a00]' : 'bg-[#f2f2f2] text-[#555]'}`}
              >
                {col}
              </div>
            ))}
            {/* Extra background cols */}
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{ width: EXTRA_COL_W, height: HEADER_H, fontSize: 10 }} className="border border-[#d0d0d0] flex-shrink-0 bg-[#f2f2f2] text-[#555] flex items-center justify-center">
                {String.fromCharCode(80 + i)}
              </div>
            ))}
          </div>

          {/* Row 1: merged header */}
          <div className="flex">
            <div style={{ width: ROW_NUM_W, height: CELL_H, fontSize: 10 }} className="bg-[#f2f2f2] border border-[#d0d0d0] flex-shrink-0 flex items-center justify-center text-[#555]">1</div>
            <div
              style={{ width: CELL_W * 9 + EXTRA_COL_W * 6, height: CELL_H, fontSize: 10 }}
              className="border border-[#d0d0d0] flex-shrink-0 bg-[#dce6f1] flex items-center px-1 font-bold text-[#1f497d]"
            >
              수도쿠 데이터 분석 보고서 Q4-2024
            </div>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{ width: EXTRA_COL_W, height: CELL_H }} className="border border-[#d0d0d0] flex-shrink-0 bg-white" />
            ))}
          </div>

          {/* Row 2: column label headers */}
          <div className="flex">
            <div style={{ width: ROW_NUM_W, height: CELL_H, fontSize: 10 }} className="bg-[#f2f2f2] border border-[#d0d0d0] flex-shrink-0 flex items-center justify-center text-[#555]">2</div>
            {ROW_ABOVE_1_CELLS.map((label, ci) => (
              <div
                key={ci}
                style={{ width: ci < 9 ? CELL_W : EXTRA_COL_W, height: CELL_H, fontSize: 9 }}
                className="border border-[#d0d0d0] flex-shrink-0 bg-[#f2f2f2] flex items-center justify-center font-medium text-[#444] overflow-hidden"
              >
                {label}
              </div>
            ))}
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{ width: EXTRA_COL_W, height: CELL_H, fontSize: 9 }} className="border border-[#d0d0d0] flex-shrink-0 bg-[#f2f2f2] text-[#999] flex items-center justify-center">
                {['목표','실적','차이','YoY','예산','예측','Q4계획','변동','비고','기타'][i]}
              </div>
            ))}
          </div>

          {/* Row 3: sample data row */}
          <div className="flex">
            <div style={{ width: ROW_NUM_W, height: CELL_H, fontSize: 10 }} className="bg-[#f2f2f2] border border-[#d0d0d0] flex-shrink-0 flex items-center justify-center text-[#555]">3</div>
            {ROW_ABOVE_2_CELLS.map((val, ci) => (
              <div
                key={ci}
                style={{ width: ci < 9 ? CELL_W : EXTRA_COL_W, height: CELL_H, fontSize: 9 }}
                className="border border-[#d0d0d0] flex-shrink-0 bg-white flex items-center justify-center text-[#333]"
              >
                {val}
              </div>
            ))}
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{ width: EXTRA_COL_W, height: CELL_H, fontSize: 9 }} className="border border-[#d0d0d0] flex-shrink-0 bg-white text-[#999] flex items-center justify-center">
                {['1,200','89%','42','+5%','1,100','1,150','1,250','+50','완료','—'][i]}
              </div>
            ))}
          </div>

          {/* Sudoku rows (4-12) */}
          {board.map((row, ri) => (
            <div key={ri} className="flex">
              <div
                style={{ width: ROW_NUM_W, height: CELL_H, fontSize: 10 }}
                className={`border border-[#d0d0d0] flex-shrink-0 flex items-center justify-center font-medium
                  ${selected && selected[0] === ri ? 'bg-[#fff2cc] font-bold text-[#7d5a00]' : 'bg-[#f2f2f2] text-[#555]'}`}
              >
                {ri + 4}
              </div>
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
                        style={{
                          fontSize: 11,
                          fontWeight: 'bold',
                          color: isFixed(ri, ci) ? '#1f2937' : isErr ? '#dc2626' : '#1565c0',
                        }}
                      >
                        {val}
                      </span>
                    ) : cellNotes && cellNotes.size > 0 ? (
                      <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5">
                        {[1,2,3,4,5,6,7,8,9].map(n => (
                          <span key={n} className="flex items-center justify-center text-[#999]" style={{ fontSize: 6 }}>
                            {cellNotes.has(n) ? n : ''}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {/* Extra cols J,K,L,M,N,O */}
              {RIGHT_VALS[ri] && RIGHT_VALS[ri].map((v, ki) => (
                <div
                  key={ki}
                  style={{ width: EXTRA_COL_W, height: CELL_H, fontSize: 9 }}
                  className="border border-[#d0d0d0] flex-shrink-0 bg-[#f9f9f9] flex items-center justify-center text-[#333]"
                >
                  {v}
                </div>
              ))}
              {/* More background cols */}
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} style={{ width: EXTRA_COL_W, height: CELL_H, fontSize: 9 }} className="border border-[#d0d0d0] flex-shrink-0 bg-white text-[#ccc] flex items-center justify-center">
                  {(ri * 10 + i) % 3 === 0 ? `${((ri + i) * 7 % 99) + 1}` : ''}
                </div>
              ))}
            </div>
          ))}

          {/* Row 13: Totals */}
          <div className="flex">
            <div style={{ width: ROW_NUM_W, height: CELL_H, fontSize: 10 }} className="bg-[#f2f2f2] border border-[#d0d0d0] flex-shrink-0 flex items-center justify-center text-[#555]">13</div>
            {TOTALS_ROW.map((val, ci) => (
              <div
                key={ci}
                style={{ width: ci < 9 ? CELL_W : EXTRA_COL_W, height: CELL_H, fontSize: 9 }}
                className="border border-[#d0d0d0] flex-shrink-0 bg-[#f2f2f2] flex items-center justify-center font-medium text-[#333]"
              >
                {val}
              </div>
            ))}
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{ width: EXTRA_COL_W, height: CELL_H, fontSize: 9 }} className="border border-[#d0d0d0] flex-shrink-0 bg-[#f2f2f2] text-[#999] flex items-center justify-center">
                {['9,814','88%','412','+12%','9,100','9,500','10,100','+600','—','합계'][i]}
              </div>
            ))}
          </div>

          {/* Row 14: Averages */}
          <div className="flex">
            <div style={{ width: ROW_NUM_W, height: CELL_H, fontSize: 10 }} className="bg-[#f2f2f2] border border-[#d0d0d0] flex-shrink-0 flex items-center justify-center text-[#555]">14</div>
            {AVERAGE_ROW.map((val, ci) => (
              <div
                key={ci}
                style={{ width: ci < 9 ? CELL_W : EXTRA_COL_W, height: CELL_H, fontSize: 9 }}
                className="border border-[#d0d0d0] flex-shrink-0 bg-[#f2f2f2] flex items-center justify-center font-medium text-[#333]"
              >
                {val}
              </div>
            ))}
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{ width: EXTRA_COL_W, height: CELL_H, fontSize: 9 }} className="border border-[#d0d0d0] flex-shrink-0 bg-[#f2f2f2] text-[#999] flex items-center justify-center">
                {['1,090','88%','46','+1.3%','1,011','1,056','1,122','+67','—','평균'][i]}
              </div>
            ))}
          </div>

          {/* Extra background rows 15-25 */}
          {Array.from({ length: 12 }, (_, ri) => (
            <div key={ri} className="flex">
              <div style={{ width: ROW_NUM_W, height: CELL_H, fontSize: 10 }} className="bg-[#f2f2f2] border border-[#d0d0d0] flex-shrink-0 flex items-center justify-end pr-1 text-[#80868b]">
                {15 + ri}
              </div>
              {Array.from({ length: 25 }, (_, ci) => (
                <div key={ci} style={{ width: ci < 9 ? CELL_W : EXTRA_COL_W, height: CELL_H, fontSize: 9 }} className="border border-[#e8eaed] flex-shrink-0 bg-white text-[#ccc] flex items-center justify-center">
                  {(ri * 25 + ci) % 5 === 0 ? `${((ri + ci) * 13 % 999) + 100}` : ''}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Right panel — narrower */}
        <div className="bg-white border-l border-[#d0d0d0] flex flex-col" style={{ width: 100, fontSize: 10 }}>
          <div className="bg-[#f2f2f2] border-b border-[#d0d0d0] px-2 py-1 flex items-center justify-between">
            <span className="font-medium text-[#333]" style={{ fontSize: 10 }}>입력 도우미</span>
            <button className="text-[#888] hover:text-[#333] hover:bg-[#e0e0e0] px-0.5 leading-none" style={{ fontSize: 11 }}>✕</button>
          </div>
          <div className="bg-[#f2f2f2] border-b border-[#d0d0d0] px-2 py-0.5">
            <span className="font-medium text-[#555]" style={{ fontSize: 9 }}>숫자 입력</span>
          </div>
          <div className="p-1.5">
            <div className="grid grid-cols-3 gap-0.5">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button
                  key={n}
                  onClick={() => handleInput(n)}
                  className={`h-7 border font-medium transition-colors
                    ${selectedVal === n ? 'bg-[#217346] text-white border-[#1a5c38]' : 'bg-white border-[#d0d0d0] hover:bg-[#e8f0fe] hover:border-[#1a73e8] text-[#333]'}`}
                  style={{ fontSize: 11 }}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleInput(null)}
              className="w-full h-6 bg-white border border-[#d0d0d0] hover:bg-[#fce8e8] hover:border-[#dc2626] text-[#555] mt-0.5"
              style={{ fontSize: 10 }}
            >
              지우기
            </button>
          </div>

          <div className="bg-[#f2f2f2] border-t border-b border-[#d0d0d0] px-2 py-0.5">
            <span className="font-medium text-[#555]" style={{ fontSize: 9 }}>도움말</span>
          </div>
          <div className="p-1.5 text-[#666] space-y-0.5" style={{ fontSize: 9 }}>
            <div>• 화살표: 셀 이동</div>
            <div>• 1-9: 숫자 입력</div>
            <div>• Del: 삭제</div>
            <div>• 메모 모드: 후보 수</div>
          </div>

          <div className="mt-auto border-t border-[#d0d0d0]">
            <div className="bg-[#f2f2f2] border-b border-[#d0d0d0] px-2 py-0.5">
              <span className="font-medium text-[#555]" style={{ fontSize: 9 }}>통계</span>
            </div>
            <div className="p-1.5 text-[#666] space-y-0.5" style={{ fontSize: 9 }}>
              <div>오류: <span className={errors.size > 0 ? 'text-red-600 font-bold' : 'text-[#217346] font-bold'}>{errors.size}</span></div>
              <div>진행: {board.flat().filter(v => v !== null).length}/81</div>
              <div>시간: {formatTime(timer)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet tabs */}
      <div className="bg-[#f2f2f2] border-t border-[#d0d0d0] flex items-center px-2 py-0.5 gap-0.5">
        <button className="bg-white border border-[#ababab] border-b-white px-2 py-0.5 -mb-px text-[#333] font-medium" style={{ fontSize: 10 }}>
          수도쿠_데이터
        </button>
        <button className="text-[#555] hover:bg-[#e0e0e0] px-2 py-0.5" style={{ fontSize: 10 }}>시트2</button>
        <button className="text-[#555] hover:bg-[#e0e0e0] px-2 py-0.5" style={{ fontSize: 10 }}>통계</button>
        <span className="ml-1 text-[#888] cursor-pointer hover:bg-[#e0e0e0] px-1" style={{ fontSize: 10 }}>+</span>
      </div>

      {/* Status bar */}
      <div className="bg-[#217346] text-white px-2 py-0.5 flex items-center justify-between" style={{ fontSize: 10 }}>
        <div className="flex gap-2 items-center">
          <span>준비</span>
          {selected && <span>셀: {COLS[selected[1]]}{selected[0] + 4}</span>}
          <span>|</span>
          <span>난이도: {difficulty}</span>
        </div>
        <div className="flex gap-2 items-center">
          <span>{formatTime(timer)}</span>
          <span>|</span>
          <span className="opacity-80">▤</span>
          <span className="opacity-80">⊞</span>
          <span>|</span>
          <span>100%</span>
        </div>
      </div>

      {/* Completion modal */}
      {isComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#d0d0d0] shadow-xl p-5 max-w-xs w-full text-center">
            <div className="text-3xl mb-2">🎉</div>
            <h2 className="font-bold text-[#333] mb-1" style={{ fontSize: 15 }}>수도쿠 완성!</h2>
            <p className="text-[#555] mb-1" style={{ fontSize: 12 }}>클리어 시간: <strong>{formatTime(timer)}</strong></p>
            <p className="text-[#888] mb-3" style={{ fontSize: 10 }}>오류 없이 완벽하게 해결하셨습니다.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={newGame} className="px-3 py-1.5 bg-[#217346] text-white hover:bg-[#1a5c38]" style={{ fontSize: 12 }}>
                새 게임
              </button>
              <Link href="/" className="px-3 py-1.5 border border-[#d0d0d0] text-[#333] hover:bg-[#f2f2f2]" style={{ fontSize: 12 }}>
                포털로 이동
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
