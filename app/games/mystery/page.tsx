'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { logGameEvent } from '@/lib/logger';

// Story data
type Choice = {
  id: string;
  label: string;
  description: string;
  nextScene: string;
  reveal?: string;
};

type Scene = {
  id: string;
  file: string;
  title: string;
  content: string[];
  choices: Choice[];
  isEnding?: boolean;
};

const STORY: Scene[] = [
  {
    id: 'start',
    file: 'README.md',
    title: '// Case File: The Dead Dev',
    content: [
      '/*',
      ' * CASE FILE: "The Dead Dev"',
      ' * Detective Agency: Byte & Mortar Investigations',
      ' * Date: 2024-12-09 | Priority: CRITICAL',
      ' *',
      ' * INCIDENT SUMMARY:',
      ' * Victor Harmon, Senior Lead Developer at Nexus Corp,',
      ' * was found dead in Server Room B at 11:42 PM.',
      ' * The door was locked from the inside.',
      ' * His commit history was wiped clean — all 4 years of it.',
      ' *',
      ' * SUSPECTS:',
      ' *   1. Diana Cho    — Product Manager, had access to repo admin',
      ' *   2. Felix Grant  — Junior Dev, last person to see Victor alive',
      ' *   3. Nora Stein   — DevOps Lead, controls physical server access',
      ' *',
      ' * YOUR ROLE:',
      ' * You are Detective Sam Reyes.',
      ' * Review the evidence. Interrogate suspects.',
      ' * Find the truth hidden in the code.',
      ' */',
      '',
      '// Where do you start?',
    ],
    choices: [
      { id: 'c1', label: 'examineScene()', description: 'Examine the crime scene', nextScene: 'scene_lab' },
      { id: 'c2', label: 'readCommitLog()', description: 'Check the git history', nextScene: 'scene_git' },
      { id: 'c3', label: 'callDiana()', description: 'Interview Diana Cho first', nextScene: 'interview_diana' },
    ],
  },
  {
    id: 'scene_lab',
    file: 'crime_scene.ts',
    title: '// Server Room B — Physical Evidence',
    content: [
      '// crime_scene.ts — Forensic Analysis Report',
      '',
      'const physicalEvidence = {',
      '  location: "Server Room B, Floor 3",',
      '  timeOfDeath: "approx. 23:15",',
      '  causeOfDeath: "blunt force trauma",',
      '',
      '  // Items found at the scene:',
      '  items: [',
      '    "Victim\'s keycard — still inserted in rack slot B-12",',
      '    "Shattered coffee mug (PROPERTY OF: F.G.)",', // Felix Grant's mug
      '    "USB drive — encrypted, labeled \'BACKUP_2019\'",',
      '    "A printed email thread — corners torn off",',
      '  ],',
      '',
      '  doorStatus: "locked from inside via deadbolt",',
      '  // NOTE: Only 3 keycards have clearance to Server Room B:',
      '  //   - Victor Harmon (victim)',
      '  //   - Nora Stein (DevOps)',
      '  //   - Diana Cho (admin override)',
      '};',
      '',
      '// The mug belongs to Felix Grant — but he has NO keycard access.',
      '// How did his mug get inside a room he cannot enter?',
      '',
      '// Continue investigation...',
    ],
    choices: [
      { id: 'c1', label: 'analyzeUSB()', description: 'Decrypt the USB drive', nextScene: 'scene_usb' },
      { id: 'c2', label: 'callFelix()', description: 'Ask Felix about his mug', nextScene: 'interview_felix' },
      { id: 'c3', label: 'callNora()', description: 'Talk to Nora about keycard access', nextScene: 'interview_nora' },
    ],
  },
  {
    id: 'scene_git',
    file: 'git_history.log',
    title: '// Git History — Reconstructed',
    content: [
      '# git log --all --oneline --no-walk',
      '# (History was force-pushed to oblivion)',
      '# Recovered via .git/refs/original/',
      '',
      'a1b2c3d  (2024-12-09 22:58) noreply@nexus.corp',
      '         "EMERGENCY: remove sensitive data"',
      '         // Deleted: auth_bypass.patch, prod_keys.env',
      '',
      'f4e5d6c  (2024-12-09 22:31) v.harmon@nexus.corp',
      '         "DO NOT MERGE: proof of fraud"',
      '         // Modified: quarterly_report.xlsx (formulas)',
      '         // Added: evidence_pack.zip',
      '',
      'b7c8e9f  (2024-12-09 21:15) d.cho@nexus.corp',
      '         "hotfix: adjust Q4 numbers before board meeting"',
      '         // Modified: financial_projections.ts',
      '',
      '// KEY FINDING:',
      '// Victor found Diana manipulating financial projections.',
      '// He staged a commit with "proof of fraud" at 22:31.',
      '// Someone deleted it 27 minutes later.',
      '// That someone used "noreply@nexus.corp" — a bot account.',
      '// Only repo admins can create bot commits.',
      '// Repo admins: Diana Cho (PM), Victor Harmon (deceased)',
    ],
    choices: [
      { id: 'c1', label: 'callDiana()', description: 'Confront Diana about the commits', nextScene: 'interview_diana' },
      { id: 'c2', label: 'traceNoreplyAccount()', description: 'Trace the bot account origin', nextScene: 'scene_trace' },
      { id: 'c3', label: 'examineScene()', description: 'Check the physical evidence', nextScene: 'scene_lab' },
    ],
  },
  {
    id: 'interview_diana',
    file: 'interview_diana.txt',
    title: '// Interview: Diana Cho — Product Manager',
    content: [
      '// TRANSCRIPT — Diana Cho, 2024-12-09 23:40',
      '// Location: Nexus Corp Conference Room A',
      '',
      'Detective Reyes: "Ms. Cho. Where were you at 11 PM?"',
      '',
      'Diana: "In my office. Working late on the board deck."',
      '       // [eyes shift left — possible deception indicator]',
      '',
      'Reyes: "Victor\'s last commit mentioned \'proof of fraud\'.',
      '        Was he referring to you?"',
      '',
      'Diana: "That\'s absurd. Victor was... unstable lately.',
      '        He\'d been making wild accusations."',
      '       // [taps phone screen rapidly]',
      '',
      'Reyes: "The Q4 numbers were altered at 9:15 PM.',
      '        Your email is on that commit."',
      '',
      'Diana: [long pause]',
      '       "I want a lawyer."',
      '',
      '// Diana has keycard access to Server Room B.',
      '// She had motive — Victor found her fraud.',
      '// But how did she leave the room locked from inside?',
      '',
      '// There\'s still a piece missing...',
    ],
    choices: [
      { id: 'c1', label: 'callFelix()', description: 'Check on Felix — there\'s that mug...', nextScene: 'interview_felix' },
      { id: 'c2', label: 'callNora()', description: 'Ask Nora if she let someone in', nextScene: 'interview_nora' },
      { id: 'c3', label: 'readCommitLog()', description: 'Re-examine the git history', nextScene: 'scene_git' },
    ],
  },
  {
    id: 'interview_felix',
    file: 'interview_felix.txt',
    title: '// Interview: Felix Grant — Junior Dev',
    content: [
      '// TRANSCRIPT — Felix Grant, 2024-12-09 23:55',
      '// Location: Hallway outside Server Room B',
      '',
      'Felix: [nervously] "I didn\'t go inside. I swear."',
      '',
      'Reyes: "Your mug was in there. The one that says',
      '        \'World\'s Okayest Programmer\'."',
      '',
      'Felix: [silence for 3 seconds]',
      '       "Okay. Okay fine. I... Diana asked me to',
      '        return Victor\'s USB drive to him. She said',
      '        he\'d left it in the meeting room.',
      '        She let me in with her keycard. But I left',
      '        immediately. Victor was alive when I left."',
      '',
      'Reyes: "What time?"',
      '',
      'Felix: "Maybe... 10:50 PM? Victor looked scared.',
      '        He said: \'tell no one I\'m here tonight\'."',
      '',
      '// Felix was there. Diana gave him access.',
      '// Victor was alive at 10:50 PM.',
      '// Diana had a reason to get Felix inside...',
      '// Was Felix a plant? Or an unwitting witness?',
      '',
      '// Felix mentions: Diana was in the hallway',
      '// THE ENTIRE TIME Felix was inside.',
      '// She never left his sight until the door closed.',
    ],
    choices: [
      { id: 'c1', label: 'pressFelix()', description: 'Press Felix for more details', nextScene: 'scene_usb' },
      { id: 'c2', label: 'callNora()', description: 'Ask Nora about the door lock', nextScene: 'interview_nora' },
      { id: 'c3', label: 'traceNoreplyAccount()', description: 'Follow the digital trail', nextScene: 'scene_trace' },
    ],
  },
  {
    id: 'interview_nora',
    file: 'interview_nora.txt',
    title: '// Interview: Nora Stein — DevOps Lead',
    content: [
      '// TRANSCRIPT — Nora Stein, 2024-12-10 00:10',
      '',
      'Nora: "The deadbolt in Server Room B has a quirk.',
      '       It can be set to auto-lock on door close.',
      '       I disabled that feature years ago, but....',
      '       someone re-enabled it at 22:43 tonight.',
      '       Through the building management API."',
      '',
      'Reyes: "Who has API access?"',
      '',
      'Nora: "Me. And... IT admin accounts."',
      '      "Diana\'s role gives her IT admin."',
      '',
      'Reyes: "So she could have re-enabled auto-lock',
      '        AFTER Felix and Victor were inside?"',
      '',
      'Nora: "Yes. But wait — Victor would just unlock',
      '       it from inside, right? Unless..."',
      '',
      'Reyes: "Unless someone had already incapacitated him."',
      '',
      '// RECONSTRUCTION:',
      '// 22:31 — Victor commits the fraud evidence',
      '// 22:43 — Diana re-enables auto-lock via API',
      '// 22:50 — Felix enters with Diana\'s card, delivers USB',
      '// 22:52 — Felix leaves, door auto-locks behind him',
      '// 23:00 — Diana enters separately (her own keycard)',
      '// 23:15 — Victor killed. Diana exits. Door stays locked.',
      '// 22:58 — Bot account deletes the commit (Diana, remote)',
    ],
    choices: [
      { id: 'c1', label: 'accuseDiana()', description: 'Diana Cho did it — you\'re certain', nextScene: 'ending_correct', reveal: 'diana' },
      { id: 'c2', label: 'accuseFelix()', description: 'Felix Grant — he was there', nextScene: 'ending_wrong_felix', reveal: 'felix' },
      { id: 'c3', label: 'accuseNora()', description: 'Nora Stein — she controls access', nextScene: 'ending_wrong_nora', reveal: 'nora' },
    ],
  },
  {
    id: 'scene_usb',
    file: 'usb_contents.bin',
    title: '// USB Drive — Decrypted Contents',
    content: [
      '// File: usb_contents — Decryption successful',
      '// Password cracked via: rockyou.txt wordlist',
      '',
      'const usbContents = [',
      '  "financial_fraud_evidence.pdf",    // 47 pages',
      '  "diana_cho_communications.msg",    // 83 emails',
      '  "board_presentation_original.ppt", // Before edits',
      '  "offshore_transfers.csv",          // 12 transactions',
      '];',
      '',
      '// financial_fraud_evidence.pdf:',
      '// Victor had been documenting Diana\'s activities',
      '// for THREE MONTHS before his death.',
      '// Q2 and Q3 numbers were also altered.',
      '// $2.3M redirected to shell companies.',
      '',
      '// diana_cho_communications.msg:',
      '// Email to unknown recipient (encrypted):',
      '// "He knows. Tonight is the only option.',
      '//  The server room is the only place without cameras.',
      '//  The boy will give me the alibi I need."',
      '// "The boy" — almost certainly Felix.',
      '',
      '// DATE OF EMAIL: 2024-12-09 18:22',
      '// Diana planned this hours before it happened.',
    ],
    choices: [
      { id: 'c1', label: 'callNora()', description: 'Share findings with Nora', nextScene: 'interview_nora' },
      { id: 'c2', label: 'accuseDiana()', description: 'Enough evidence — accuse Diana', nextScene: 'ending_correct', reveal: 'diana' },
      { id: 'c3', label: 'callDiana()', description: 'Confront Diana with the USB', nextScene: 'interview_diana' },
    ],
  },
  {
    id: 'scene_trace',
    file: 'trace_analysis.ts',
    title: '// Trace: noreply@nexus.corp Bot Account',
    content: [
      '// trace_analysis.ts',
      '',
      'async function traceCommitAuthor(email: string) {',
      '  const gitConfig = await readGitConfig("/etc/nexus/git.conf");',
      '  // noreply@nexus.corp is used by CI/CD pipeline',
      '  // AND by users with "bypass_committer" permission',
      '  ',
      '  const usersWithBypass = await db.query(`',
      '    SELECT username, email FROM users',
      '    WHERE permissions @> \'{"bypass_committer": true}\'',
      '  `);',
      '  // Results: ["v.harmon", "d.cho"]',
      '  // Victor is dead. That leaves: Diana Cho.',
      '}',
      '',
      '// IP log for bot commits on 2024-12-09:',
      '// 22:58:03 — 192.168.1.47 (internal)',
      '',
      '// DHCP lookup: 192.168.1.47',
      '// Assigned to: MacBook Pro (d.cho-mbp.local)',
      '// Last seen: Diana Cho\'s office, Floor 2',
      '',
      '// Diana made the commit from her office.',
      '// While Felix was in the server room.',
      '// The perfect alibi — except for the digital fingerprints.',
    ],
    choices: [
      { id: 'c1', label: 'callNora()', description: 'Get the full picture on the lock', nextScene: 'interview_nora' },
      { id: 'c2', label: 'accuseDiana()', description: 'You have enough. Make the call.', nextScene: 'ending_correct', reveal: 'diana' },
      { id: 'c3', label: 'callFelix()', description: 'Warn Felix that he was used', nextScene: 'interview_felix' },
    ],
  },
  {
    id: 'ending_correct',
    file: 'CASE_CLOSED.md',
    title: '// CASE CLOSED — Correct',
    isEnding: true,
    content: [
      '/**',
      ' * CASE RESOLVED',
      ' * ============================================================',
      ' * Perpetrator: Diana Cho, Product Manager',
      ' * Verdict:     First-degree murder + corporate fraud',
      ' *',
      ' * HOW IT HAPPENED:',
      ' * Diana had been falsifying financial reports for 18 months.',
      ' * Victor discovered the fraud and staged evidence in a commit.',
      ' * Diana planned the murder hours in advance.',
      ' *',
      ' * She used Felix as an unwitting alibi — placing him at the',
      ' * scene first to explain away any physical evidence.',
      ' * She re-enabled the server room auto-lock via the building',
      ' * API while Felix was inside, trapping Victor.',
      ' * She entered separately with her own keycard, committed',
      ' * the act, and exited — the door locking behind her.',
      ' * Then she remotely deleted Victor\'s fraud-evidence commit',
      ' * from her laptop, using the CI/CD bot account.',
      ' *',
      ' * The shattered mug was the first crack in her plan.',
      ' * The email on the USB sealed her fate.',
      ' *',
      ' * STATUS: Diana Cho arrested at 02:17 AM.',
      ' * Felix Grant — released, cooperating witness.',
      ' * Nora Stein  — cleared of all suspicion.',
      ' *',
      ' * "Good code leaves no bugs.",',
      ' * "Good detectives find them anyway."',
      ' *        — Det. Sam Reyes',
      ' */',
    ],
    choices: [
      { id: 'restart', label: 'restartInvestigation()', description: 'Play again from the beginning', nextScene: 'start' },
    ],
  },
  {
    id: 'ending_wrong_felix',
    file: 'CASE_CLOSED.md',
    title: '// CASE CLOSED — Wrong',
    isEnding: true,
    content: [
      '/**',
      ' * VERDICT: Incorrect',
      ' * ============================================================',
      ' * You accused: Felix Grant',
      ' * Actual perpetrator: Diana Cho',
      ' *',
      ' * Felix was an unwitting participant. Diana used him to',
      ' * establish a false alibi and explain physical evidence.',
      ' * He had no keycard access, no motive, and no knowledge',
      ' * of Victor\'s fraud investigation.',
      ' *',
      ' * Three months later, Diana\'s scheme was uncovered by',
      ' * an external audit. She confessed to the murder.',
      ' * Felix received a settlement for wrongful arrest.',
      ' *',
      ' * The key clues you missed:',
      ' * - Felix had no keycard access (Diana let him in)',
      ' * - The bot commit originated from Diana\'s laptop IP',
      ' * - Diana\'s email: "the boy will give me the alibi"',
      ' * - Nora confirmed Diana re-enabled the auto-lock',
      ' *',
      ' * Try again — the evidence was all there.',
      ' */',
    ],
    choices: [
      { id: 'restart', label: 'restartInvestigation()', description: 'Start over and find the truth', nextScene: 'start' },
    ],
  },
  {
    id: 'ending_wrong_nora',
    file: 'CASE_CLOSED.md',
    title: '// CASE CLOSED — Wrong',
    isEnding: true,
    content: [
      '/**',
      ' * VERDICT: Incorrect',
      ' * ============================================================',
      ' * You accused: Nora Stein',
      ' * Actual perpetrator: Diana Cho',
      ' *',
      ' * Nora Stein had no motive and was the one who',
      ' * helped you uncover the truth about the auto-lock.',
      ' * Her transparency was critical to solving the case.',
      ' *',
      ' * The building API access was a red herring if you',
      ' * didn\'t follow it to its true source.',
      ' * Yes, Nora had the ability — but Diana also had',
      ' * IT admin rights, and the IP logs prove she used them.',
      ' *',
      ' * Key clues you missed:',
      ' * - Bot commit IP mapped to Diana\'s laptop, not Nora\'s',
      ' * - Victor\'s USB contained emails from Diana, not Nora',
      ' * - Only Diana had motive: the financial fraud cover-up',
      ' *',
      ' * The truth was in the code. Look closer next time.',
      ' */',
    ],
    choices: [
      { id: 'restart', label: 'restartInvestigation()', description: 'Start over and find the truth', nextScene: 'start' },
    ],
  },
];

function getScene(id: string): Scene {
  return STORY.find(s => s.id === id) || STORY[0];
}

export default function MysteryPage() {
  const [currentScene, setCurrentScene] = useState<Scene>(getScene('start'));
  const [history, setHistory] = useState<string[]>(['start']);
  const [terminalLines, setTerminalLines] = useState<string[]>([
    '> NEXUS CORP INTERNAL REVIEW SYSTEM v3.2.1',
    '> Authorized Personnel Only',
    '> Loading case file...',
    '> Type a function name to proceed.',
  ]);
  const [openFiles, setOpenFiles] = useState<string[]>(['README.md']);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => { logGameEvent('mystery', 'enter'); }, []);
  useEffect(() => () => { logGameEvent('mystery', 'exit'); }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const navigate = (scene: Scene, choice: Choice) => {
    const nextScene = getScene(choice.nextScene);
    setCurrentScene(nextScene);
    setHistory(prev => [...prev, nextScene.id]);
    if (!openFiles.includes(nextScene.file)) {
      setOpenFiles(prev => [...prev, nextScene.file]);
    }
    setTerminalLines(prev => [
      ...prev,
      `> ${choice.label}`,
      `  Navigating to: ${nextScene.file}`,
      `  ${choice.description}`,
      '  ---',
    ]);

    if (nextScene.isEnding) {
      if (nextScene.id === 'ending_correct') {
        logGameEvent('mystery', 'complete');
        setTerminalLines(prev => [...prev, '> CASE SOLVED. Excellent detective work.']);
      } else {
        setTerminalLines(prev => [...prev, '> INCORRECT VERDICT. The case remains open.']);
      }
    }
  };

  const isCorrectEnding = currentScene.id === 'ending_correct';
  const isWrongEnding = currentScene.id.startsWith('ending_wrong');

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col text-xs font-mono overflow-hidden">
      {/* VS Code Title Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-gray-400 text-xs ml-2">
            {currentScene.file} — Code Review System
          </span>
        </div>
        <Link href="/" className="text-gray-400 hover:text-white text-xs">
          ← 업무 포털로
        </Link>
      </div>

      {/* Menu Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-2 py-0.5 flex items-center gap-1">
        {['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'].map(item => (
          <button key={item} className="text-gray-400 hover:text-white hover:bg-gray-700 px-2 py-0.5 text-xs">
            {item}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <div className="w-10 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-2 gap-3">
          {['📁', '🔍', '⚙', '🐛', '🔧'].map((icon, i) => (
            <button key={i} className={`text-base opacity-60 hover:opacity-100 ${i === 0 ? 'opacity-100' : ''}`}>
              {icon}
            </button>
          ))}
        </div>

        {/* File Explorer Sidebar */}
        <div className="w-48 bg-gray-850 border-r border-gray-700 overflow-y-auto bg-gray-900">
          <div className="px-3 py-2 text-gray-400 uppercase tracking-widest text-xs font-bold">
            Explorer
          </div>
          <div className="px-2">
            <div className="text-gray-300 flex items-center gap-1 py-0.5 cursor-pointer hover:bg-gray-700 px-1">
              <span>▾</span>
              <span className="text-yellow-400">📁 NEXUS_CASE_FILES</span>
            </div>
            {STORY.map(scene => (
              <button
                key={scene.id}
                onClick={() => {
                  setCurrentScene(scene);
                  if (!openFiles.includes(scene.file)) {
                    setOpenFiles(prev => [...prev, scene.file]);
                  }
                }}
                className={`
                  w-full text-left pl-6 py-0.5 flex items-center gap-1 hover:bg-gray-700
                  ${history.includes(scene.id) ? 'text-gray-300' : 'text-gray-500'}
                  ${currentScene.id === scene.id ? 'bg-gray-700 text-white' : ''}
                `}
              >
                <span className="text-blue-400">📄</span>
                <span className="truncate">{scene.file}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto">
            {openFiles.map(file => (
              <button
                key={file}
                onClick={() => {
                  const scene = STORY.find(s => s.file === file);
                  if (scene) setCurrentScene(scene);
                }}
                className={`
                  flex items-center gap-2 px-3 py-1.5 text-xs border-r border-gray-700 whitespace-nowrap flex-shrink-0
                  ${currentScene.file === file ? 'bg-gray-900 text-white border-t border-t-blue-500' : 'text-gray-400 hover:text-white hover:bg-gray-700'}
                `}
              >
                <span className="text-blue-400">📄</span>
                {file}
              </button>
            ))}
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-y-auto bg-gray-900 p-4">
            {/* Line numbers + code */}
            <div>
              <div className="text-purple-400 text-xs mb-4 opacity-70">
                // {currentScene.title}
              </div>
              {currentScene.content.map((line, i) => (
                <div key={i} className="flex">
                  <span className="w-8 text-right pr-3 text-gray-600 select-none flex-shrink-0">
                    {i + 1}
                  </span>
                  <pre className={`
                    text-xs leading-5 flex-1 whitespace-pre-wrap break-words
                    ${line.startsWith('//') || line.startsWith('#') || line.startsWith(' *') || line.startsWith('/*') || line.startsWith(' */') ? 'text-gray-500' :
                      line.startsWith('"') || line.includes(': "') ? 'text-green-400' :
                      line.includes('const ') || line.includes('async ') || line.includes('function ') ? 'text-blue-400' :
                      line.includes('Detective') || line.includes('Reyes:') || line.includes('Diana:') || line.includes('Felix:') || line.includes('Nora:') ? 'text-yellow-300' :
                      'text-gray-300'
                    }
                  `}>{line}</pre>
                </div>
              ))}
            </div>

            {/* Choices */}
            {!currentScene.isEnding && (
              <div className="mt-6 border-t border-gray-700 pt-4">
                <div className="text-gray-500 mb-3">// What do you do next?</div>
                <div className="space-y-2">
                  {currentScene.choices.map(choice => (
                    <button
                      key={choice.id}
                      onClick={() => navigate(currentScene, choice)}
                      className="w-full text-left group"
                    >
                      <div className="flex items-start gap-2 px-3 py-2 border border-gray-700 hover:border-blue-500 hover:bg-gray-800 transition-colors">
                        <span className="text-yellow-400 mt-0.5">▶</span>
                        <div>
                          <span className="text-blue-400 group-hover:text-blue-300">{choice.label}</span>
                          <span className="text-gray-400 ml-2">// {choice.description}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Restart button for endings */}
            {currentScene.isEnding && (
              <div className="mt-6 border-t border-gray-700 pt-4">
                <div className={`text-sm font-bold mb-4 ${isCorrectEnding ? 'text-green-400' : 'text-red-400'}`}>
                  {isCorrectEnding ? '// ✓ CASE SOLVED — Excellent work, Detective!' : '// ✗ INCORRECT VERDICT — The truth is still out there.'}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setCurrentScene(getScene('start'));
                      setHistory(['start']);
                      setOpenFiles(['README.md']);
                      setTerminalLines([
                        '> Restarting investigation...',
                        '> Case file reloaded.',
                      ]);
                    }}
                    className="px-4 py-2 border border-blue-500 text-blue-400 hover:bg-blue-900 text-xs"
                  >
                    restartInvestigation()
                  </button>
                  <Link
                    href="/"
                    className="px-4 py-2 border border-gray-600 text-gray-400 hover:bg-gray-800 text-xs inline-flex items-center"
                  >
                    exitToPortal()
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Terminal panel */}
          <div className="h-36 bg-black border-t border-gray-700 flex flex-col">
            <div className="flex items-center gap-3 px-3 py-1 bg-gray-800 border-b border-gray-700">
              <span className="text-gray-400 text-xs">TERMINAL</span>
              <span className="text-gray-400 text-xs">PROBLEMS</span>
              <span className="text-gray-400 text-xs">OUTPUT</span>
              <span className="text-gray-400 text-xs">DEBUG CONSOLE</span>
            </div>
            <div
              ref={terminalRef}
              className="flex-1 overflow-y-auto p-2 text-green-400 text-xs leading-4"
            >
              {terminalLines.map((line, i) => (
                <div key={i} className={line.startsWith('>') ? 'text-green-400' : 'text-gray-400'}>
                  {line}
                </div>
              ))}
              <div className="text-green-400 flex items-center gap-1">
                <span>&gt;</span>
                <span className="animate-pulse">█</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-blue-700 px-3 py-0.5 flex items-center justify-between text-white text-xs">
        <div className="flex items-center gap-3">
          <span>⎇ case/the-dead-dev</span>
          <span>⚠ 3 suspects</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Progress: {history.length} scenes visited</span>
          <span>{currentScene.file}</span>
          <span>TypeScript</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
}
