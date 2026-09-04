'use client';

import { useState, useEffect } from 'react';
import { GAME_1_PROMPT_LEVELS, GAME_2_PPT_LEVELS, LevelData, Option, DifficultyLevel } from '@/data/gameData';

type GameMode = 'GAME_1_PROMPT' | 'GAME_2_PPT';
type GameState = 'LOGIN' | 'MAIN_MENU' | 'RULES' | 'MATERIAL' | 'PLAYING' | 'FEEDBACK' | 'PLAYGROUND' | 'FINISHED';
type MainTab = 'CHALLENGES' | 'LEADERBOARD' | 'MY_STATS';
type LeaderboardSubTab = 'ALL' | 'GAME_1' | 'GAME_2';

interface LeaderboardItem {
  player_name: string;
  game_mode: string;
  score: number;
  created_at?: string;
}

interface DbQuestion {
  id: number;
  game_type: string;
  title: string;
  material?: string;
  scenario: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: string;
  explanation?: string;
  image_url?: string;
  default_prompt_to_test?: string;
  timer_seconds?: number;
}

interface AnswerHistoryDetail {
  questionTitle: string;
  scenario: string;
  selectedText: string;
  correctText: string;
  isCorrect: boolean;
  explanation: string;
}

// 🎲 ALGORITMA FISHER-YATES SHUFFLE
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [gameState, setGameState] = useState<GameState>('LOGIN');
  const [activeTab, setActiveTab] = useState<MainTab>('CHALLENGES');
  const [leaderboardSubTab, setLeaderboardSubTab] = useState<LeaderboardSubTab>('ALL');

  const [playerName, setPlayerName] = useState('');
  const [gameMode, setGameMode] = useState<GameMode>('GAME_1_PROMPT');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('EASY');

  const [activeLevels, setActiveLevels] = useState<LevelData[]>([]);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);

  const [sessionScore, setSessionScore] = useState(0);
  const [userScores, setUserScores] = useState<number[]>([]);

  const [sessionAnswers, setSessionAnswers] = useState<AnswerHistoryDetail[]>([]);

  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);

  const [dbQuestions, setDbQuestions] = useState<DbQuestion[]>([]);

  // Playground state
  const [playgroundPrompt, setPlaygroundPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const currentLevel: LevelData | undefined = activeLevels[currentLevelIdx];

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLeaderboardData(data);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil leaderboard:', err);
    }
  };

  const fetchDbQuestions = async () => {
    try {
      const res = await fetch('/api/questions');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDbQuestions(data);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil soal dari database:', err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    fetchDbQuestions();
  }, []);

  useEffect(() => {
    const sum = userScores.reduce((acc, curr) => acc + (curr || 0), 0);
    setSessionScore(sum);
  }, [userScores]);

  const getCombinedLeaderboard = (): LeaderboardItem[] => {
    const playerMap: { [name: string]: { game1: number; game2: number } } = {};

    leaderboardData.forEach((item) => {
      const name = item.player_name;
      const key = name.toLowerCase();

      if (!playerMap[key]) {
        playerMap[key] = { game1: 0, game2: 0 };
      }

      if (item.game_mode.includes('Prompt') || item.game_mode.includes('Game 1')) {
        playerMap[key].game1 = Math.max(playerMap[key].game1, Number(item.score) || 0);
      } else if (item.game_mode.includes('PPT') || item.game_mode.includes('Mastery') || item.game_mode.includes('Game 2')) {
        playerMap[key].game2 = Math.max(playerMap[key].game2, Number(item.score) || 0);
      }
    });

    const combinedList: LeaderboardItem[] = Object.keys(playerMap).map((key) => {
      const originalName = leaderboardData.find(i => i.player_name.toLowerCase() === key)?.player_name || key;
      return {
        player_name: originalName,
        game_mode: 'Total Gabungan (Game 1 + Game 2)',
        score: playerMap[key].game1 + playerMap[key].game2,
      };
    });

    return combinedList.sort((a, b) => b.score - a.score);
  };

  const getPlayerStats = () => {
    if (!playerName) {
      return { scoreGame1: 0, scoreGame2: 0, totalCombined: 0, rankGame1: '-', rankGame2: '-', overallRank: '-', completedChallenges: 0, history: [] };
    }

    const nameLower = playerName.trim().toLowerCase();
    const playerHistory = leaderboardData.filter(item => item.player_name.trim().toLowerCase() === nameLower);

    const game1List = leaderboardData
      .filter(item => item.game_mode.includes('Prompt') || item.game_mode.includes('Game 1'))
      .sort((a, b) => b.score - a.score);

    const game2List = leaderboardData
      .filter(item => item.game_mode.includes('PPT') || item.game_mode.includes('Mastery') || item.game_mode.includes('Game 2'))
      .sort((a, b) => b.score - a.score);

    const playerGame1Entry = game1List.find(item => item.player_name.trim().toLowerCase() === nameLower);
    const playerGame2Entry = game2List.find(item => item.player_name.trim().toLowerCase() === nameLower);

    const scoreGame1 = playerGame1Entry ? Number(playerGame1Entry.score) : 0;
    const scoreGame2 = playerGame2Entry ? Number(playerGame2Entry.score) : 0;

    const rankGame1Idx = game1List.findIndex(item => item.player_name.trim().toLowerCase() === nameLower);
    const rankGame2Idx = game2List.findIndex(item => item.player_name.trim().toLowerCase() === nameLower);

    const combinedLeaderboard = getCombinedLeaderboard();
    const overallRankIdx = combinedLeaderboard.findIndex(item => item.player_name.trim().toLowerCase() === nameLower);

    let completedCount = 0;
    if (playerGame1Entry) completedCount++;
    if (playerGame2Entry) completedCount++;

    return {
      scoreGame1,
      scoreGame2,
      totalCombined: scoreGame1 + scoreGame2,
      rankGame1: rankGame1Idx !== -1 ? `#${rankGame1Idx + 1}` : 'Unranked',
      rankGame2: rankGame2Idx !== -1 ? `#${rankGame2Idx + 1}` : 'Unranked',
      overallRank: overallRankIdx !== -1 ? `#${overallRankIdx + 1}` : 'Unranked',
      completedChallenges: completedCount,
      history: playerHistory
    };
  };

  const playerStats = getPlayerStats();

  const displayHeaderScore = (
    gameState === 'MATERIAL' ||
    gameState === 'PLAYING' ||
    gameState === 'FEEDBACK' ||
    gameState === 'PLAYGROUND' ||
    gameState === 'FINISHED'
  )
    ? sessionScore
    : playerStats.totalCombined;

  const handleResetAndChangePlayer = () => {
    setPlayerName('');
    setSessionScore(0);
    setUserScores([]);
    setSessionAnswers([]);
    setCurrentLevelIdx(0);
    setActiveLevels([]);
    setSelectedOption(null);
    setGameState('LOGIN');
  };

  const getFilteredLeaderboard = () => {
    if (leaderboardSubTab === 'GAME_1') {
      return leaderboardData
        .filter(item => item.game_mode.includes('Prompt') || item.game_mode.includes('Game 1'))
        .sort((a, b) => b.score - a.score);
    }
    if (leaderboardSubTab === 'GAME_2') {
      return leaderboardData
        .filter(item => item.game_mode.includes('PPT') || item.game_mode.includes('Mastery') || item.game_mode.includes('Game 2'))
        .sort((a, b) => b.score - a.score);
    }
    return getCombinedLeaderboard();
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (gameState === 'PLAYING' && timeLeft === 0) {
      handleAnswer(null);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const handleLogin = async () => {
    if (!playerName.trim()) return alert('Masukkan Username Anda!');
    setSessionScore(0);
    setUserScores([]);
    setSessionAnswers([]);
    await fetchLeaderboard();
    await fetchDbQuestions();
    setGameState('MAIN_MENU');
  };

  const handleSelectGame = (mode: GameMode) => {
    setGameMode(mode);
    setGameState('RULES');
  };

  const handleStartGameFromRules = () => {
    const defaultPool = gameMode === 'GAME_1_PROMPT' ? GAME_1_PROMPT_LEVELS : GAME_2_PPT_LEVELS;

    const filteredByDifficulty = defaultPool.filter((q) => q.difficulty === selectedDifficulty);

    const poolToUse = filteredByDifficulty.length > 0 ? filteredByDifficulty : defaultPool;

    // Acak urutan soal, potong hanya 5 soal (.slice(0, 5)), dan atur ulang penomorannya
    const preparedLevels = shuffleArray(poolToUse)
      .slice(0, 5)
      .map((level, idx) => {
        const cleanTitle = level.title.replace(/^Soal \d+:\s*|^Level \d+:\s*|^Materi \d+:\s*/i, '');
        return {
          ...level,
          title: `Soal ${idx + 1}: ${cleanTitle}`,
          options: shuffleArray(level.options).map((opt, optIdx) => ({
            ...opt,
            id: String.fromCharCode(65 + optIdx),
          })),
        };
      });

    setActiveLevels(preparedLevels);
    setCurrentLevelIdx(0);
    setUserScores(new Array(preparedLevels.length).fill(0));
    setSessionAnswers([]);
    setGameState('MATERIAL');
  };

  const handleStartLevel = () => {
    if (!currentLevel) return;
    setTimeLeft(currentLevel.timerSeconds);
    setSelectedOption(null);
    setGameState('PLAYING');
  };

  const handleAnswer = (option: Option | null) => {
    setSelectedOption(option);

    let basePoints = 100;
    if (selectedDifficulty === 'MEDIUM') basePoints = 150;
    if (selectedDifficulty === 'HARD') basePoints = 200;

    let pointsEarned = 0;
    const correctOpt = currentLevel?.options.find(o => o.isCorrect);

    if (option && option.isCorrect) {
      const bonusSpeed = timeLeft * 5;
      pointsEarned = basePoints + bonusSpeed;
    }

    if (currentLevel) {
      const answerDetail: AnswerHistoryDetail = {
        questionTitle: currentLevel.title,
        scenario: currentLevel.scenario,
        selectedText: option ? option.text : 'Waktu Habis (Tidak Menjawab)',
        correctText: correctOpt ? correctOpt.text : '-',
        isCorrect: option ? option.isCorrect : false,
        explanation: currentLevel.explanation
      };

      setSessionAnswers(prev => {
        const updated = [...prev];
        updated[currentLevelIdx] = answerDetail;
        return updated;
      });
    }

    setUserScores((prev) => {
      const updated = [...prev];
      updated[currentLevelIdx] = pointsEarned;
      return updated;
    });

    setGameState('FEEDBACK');
  };

  const handleGoToPreviousLevel = () => {
    if (currentLevelIdx > 0) {
      setCurrentLevelIdx((prev) => prev - 1);
      setGameState('MATERIAL');
    }
  };

  const handleOpenPlayground = () => {
    const defaultText = currentLevel?.defaultPromptToTest || "Foto kopi beruap di atas meja kayu kafe";
    setPlaygroundPrompt(defaultText);
    setGeneratedImageUrl(`https://image.pollinations.ai/prompt/${encodeURIComponent(defaultText)}?width=600&height=400&nologo=true`);
    setGameState('PLAYGROUND');
  };

  const handleGenerateCustomImage = () => {
    if (!playgroundPrompt.trim()) return;
    setIsGenerating(true);
    const newUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(playgroundPrompt)}?width=600&height=400&seed=${Math.floor(Math.random() * 1000)}&nologo=true`;
    setGeneratedImageUrl(newUrl);
  };

  const handleNextLevel = async () => {
    if (currentLevelIdx + 1 < activeLevels.length) {
      setCurrentLevelIdx((prev) => prev + 1);
      setGameState('MATERIAL');
    } else {
      try {
        const targetMode = gameMode === 'GAME_1_PROMPT' 
          ? `AI Prompt Master (${selectedDifficulty})` 
          : `AI Mastery Quiz (${selectedDifficulty})`;

        const res = await fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerName: playerName.trim(),
            gameMode: targetMode,
            score: sessionScore
          })
        });

        if (!res.ok) {
          console.error('Gagal simpan skor, HTTP status:', res.status);
        }

        await fetchLeaderboard();
      } catch (err) {
        console.error('Gagal menyimpan skor:', err);
      }
      setGameState('FINISHED');
    }
  };

  const getOptionStyles = (idx: number) => {
    const styles = [
      {
        border: isDarkMode ? 'border-cyan-500/40 hover:border-cyan-400' : 'border-cyan-400 hover:border-cyan-600 shadow-sm',
        badge: isDarkMode ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50' : 'bg-cyan-100 text-cyan-800 border-cyan-400',
        bg: isDarkMode ? 'bg-slate-900/70 hover:bg-cyan-500/10' : 'bg-white hover:bg-cyan-50/80',
        text: isDarkMode ? 'text-slate-200 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-950 font-semibold'
      },
      {
        border: isDarkMode ? 'border-purple-500/40 hover:border-purple-400' : 'border-purple-400 hover:border-purple-600 shadow-sm',
        badge: isDarkMode ? 'bg-purple-500/20 text-purple-300 border-purple-400/50' : 'bg-purple-100 text-purple-800 border-purple-400',
        bg: isDarkMode ? 'bg-slate-900/70 hover:bg-purple-500/10' : 'bg-white hover:bg-purple-50/80',
        text: isDarkMode ? 'text-slate-200 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-950 font-semibold'
      },
      {
        border: isDarkMode ? 'border-emerald-500/40 hover:border-emerald-400' : 'border-emerald-400 hover:border-emerald-600 shadow-sm',
        badge: isDarkMode ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50' : 'bg-emerald-100 text-emerald-800 border-emerald-400',
        bg: isDarkMode ? 'bg-slate-900/70 hover:bg-emerald-500/10' : 'bg-white hover:bg-emerald-50/80',
        text: isDarkMode ? 'text-slate-200 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-950 font-semibold'
      }
    ];
    return styles[idx % 3];
  };

  const filteredLeaderboard = getFilteredLeaderboard();

  const getRankBadge = (idx: number) => {
    if (idx === 0) return <span className="text-xl">🥇</span>;
    if (idx === 1) return <span className="text-xl">🥈</span>;
    if (idx === 2) return <span className="text-xl">🥉</span>;
    return <span className="opacity-60 text-sm font-bold">#{idx + 1}</span>;
  };

  const wrongAnswers = sessionAnswers.filter(ans => !ans.isCorrect);

  const themeBg = isDarkMode ? 'bg-[#0f172a] text-white' : 'bg-slate-100 text-slate-900';
  const cardBg = isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-300 shadow-2xl';

  return (
    <main className={`min-h-screen ${themeBg} flex flex-col items-center justify-center p-4 md:p-6 relative transition-colors duration-300`}>

      {/* TOGGLE LIGHT/DARK MODE */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`px-4 py-2 rounded-full text-xs font-bold border transition shadow-lg flex items-center gap-2 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-amber-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
        >
          {isDarkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      {/* 🚀 LOGIN SCREEN */}
      {gameState === 'LOGIN' ? (
        <div className={`w-full max-w-xl rounded-3xl p-8 md:p-12 border text-center space-y-8 shadow-2xl relative overflow-hidden transition-all duration-300 ${cardBg}`}>

          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-3xl mb-1 animate-bounce shadow-inner">
              🎮
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-400 to-purple-400">
              Prompt Master
            </h1>
            <p className="text-xs md:text-sm opacity-80 max-w-md mx-auto leading-relaxed">
              Simulasi & Mini Game untuk Menguji Pemahaman Mengenai AI
            </p>
          </div>

          <div className="space-y-3 text-left pt-2 relative z-10">
            <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
              <span>👤</span> Masukkan Username:
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Contoh: Fathur"
              className={`w-full px-5 py-4 rounded-2xl border text-base font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-inner ${isDarkMode ? 'bg-slate-900/90 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
            />
          </div>

          <button
            onClick={handleLogin}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-extrabold rounded-2xl transition text-base shadow-xl hover:shadow-indigo-500/25 active:scale-[0.99] relative z-10 flex items-center justify-center gap-2"
          >
            <span>Masuk</span>
            <span className="text-lg">➔</span>
          </button>
        </div>
      ) : (
        /* DASHBOARD UTAMA */
        <div className={`w-full max-w-5xl min-h-[580px] rounded-3xl border flex flex-col justify-between shadow-2xl transition-all duration-300 ${cardBg}`}>

          <div className="flex flex-col h-full">
            {/* HEADER TOP BAR */}
            <div className="bg-sky-600 text-white px-8 py-4 flex flex-wrap justify-between items-center gap-3 border-b border-sky-500 rounded-t-3xl shrink-0">
              <div className="flex items-center gap-3">
                <span className="bg-sky-800 text-sky-200 text-xs px-2.5 py-1 rounded-lg font-black tracking-wider">PM</span>
                <h1 className="font-extrabold text-lg tracking-wide">Prompt Master</h1>
              </div>

              <div className="flex items-center gap-4 text-xs md:text-sm font-bold tracking-wide">
                <div className="bg-sky-700/80 px-4 py-2 rounded-xl border border-sky-400/30 flex items-center gap-3">
                  <span>TOTAL SCORE: <strong className="text-amber-300 font-mono text-base">{displayHeaderScore}</strong></span>
                  <span className="opacity-40">|</span>
                  <span>OVERALL RANK: <strong className="text-emerald-300 font-mono text-base">{playerStats.overallRank}</strong></span>
                </div>

                <button
                  onClick={handleResetAndChangePlayer}
                  className="bg-sky-800 hover:bg-sky-900 text-sky-100 text-xs px-4 py-2 rounded-xl transition font-semibold"
                >
                  Ganti Player
                </button>
              </div>
            </div>

            {/* MAIN MENU STATE */}
            {gameState === 'MAIN_MENU' && (
              <div className="flex flex-col flex-1">
                {/* TAB NAVIGATION MAIN */}
                <div className={`flex border-b text-sm font-bold shrink-0 ${isDarkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-100 border-slate-300'}`}>
                  <button
                    onClick={() => setActiveTab('CHALLENGES')}
                    className={`flex-1 py-3.5 text-center transition border-b-2 ${activeTab === 'CHALLENGES'
                        ? 'border-sky-400 text-sky-400 bg-sky-500/10'
                        : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                  >
                    🎯 Challenges
                  </button>
                  <button
                    onClick={async () => {
                      await fetchLeaderboard();
                      setActiveTab('LEADERBOARD');
                    }}
                    className={`flex-1 py-3.5 text-center transition border-b-2 ${activeTab === 'LEADERBOARD'
                        ? 'border-sky-400 text-sky-400 bg-sky-500/10'
                        : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                  >
                    🏆 Leaderboard
                  </button>
                  <button
                    onClick={async () => {
                      await fetchLeaderboard();
                      setActiveTab('MY_STATS');
                    }}
                    className={`flex-1 py-3.5 text-center transition border-b-2 ${activeTab === 'MY_STATS'
                        ? 'border-sky-400 text-sky-400 bg-sky-500/10'
                        : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                  >
                    📊 My Stats
                  </button>
                </div>

                {/* KONTEN UTAMA */}
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">

                  {/* TAB 1: CHALLENGES */}
                  {activeTab === 'CHALLENGES' && (
                    <div className="space-y-6 my-auto">
                      <div className="text-center space-y-1">
                        <h2 className="text-2xl font-black">
                          {leaderboardData.some(
                            (item) => item.player_name.trim().toLowerCase() === playerName.trim().toLowerCase()
                          )
                            ? `Welcome back, ${playerName} 👋`
                            : `Welcome, ${playerName} 👋`}
                        </h2>
                        <p className="text-xs md:text-sm opacity-75">Siap Mengasah Kemampuanmu?, Pilih tantangan di bawah ini untuk memulai game:</p>
                      </div>

                      {/* GAME CHOICE CARDS DENGAN BUTTON MULAI BERMAIN */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        
                        {/* GAME 1 CARD */}
                        <div
                          onClick={() => handleSelectGame('GAME_1_PROMPT')}
                          className="group relative overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 text-white text-left transition-all duration-300 shadow-2xl hover:scale-[1.02] hover:shadow-indigo-500/30 flex flex-col justify-between border border-indigo-400/30 cursor-pointer min-h-[220px]"
                        >
                          <div className="space-y-3">
                            <span className="text-4xl block">🎯</span>
                            <div>
                              <h3 className="font-extrabold text-xl tracking-wide">Game 1: AI Prompt Master</h3>
                              <p className="text-xs md:text-sm text-indigo-100 opacity-90 leading-relaxed mt-1">
                                Menebak Prompt yang Menghasilkan Teks & Gambar yang ditampilkan
                              </p>
                            </div>
                          </div>

                          {/* BUTTON MULAI BERMAIN */}
                          <div className="pt-6">
                            <button
                              type="button"
                              className="w-full py-3 px-4 rounded-2xl bg-white text-indigo-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg group-hover:bg-cyan-300 group-hover:scale-[1.02] active:scale-95 transition-all duration-200"
                            >
                              <span>▶</span> Mulai Bermain
                            </button>
                          </div>
                        </div>

                        {/* GAME 2 CARD */}
                        <div
                          onClick={() => handleSelectGame('GAME_2_PPT')}
                          className="group relative overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-br from-purple-600 via-purple-700 to-pink-800 text-white text-left transition-all duration-300 shadow-2xl hover:scale-[1.02] hover:shadow-purple-500/30 flex flex-col justify-between border border-purple-400/30 cursor-pointer min-h-[220px]"
                        >
                          <div className="space-y-3">
                            <span className="text-4xl block">📊</span>
                            <div>
                              <h3 className="font-extrabold text-xl tracking-wide">Game 2: AI Mastery Quiz</h3>
                              <p className="text-xs md:text-sm text-purple-100 opacity-90 leading-relaxed mt-1">
                                Memahami Materi Mengenai AI yang Dipadu Dengan Soal Berbentuk Quiz
                              </p>
                            </div>
                          </div>

                          {/* BUTTON MULAI BERMAIN */}
                          <div className="pt-6">
                            <button
                              type="button"
                              className="w-full py-3 px-4 rounded-2xl bg-white text-purple-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg group-hover:bg-pink-300 group-hover:scale-[1.02] active:scale-95 transition-all duration-200"
                            >
                              <span>▶</span> Mulai Quiz
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* TAB 2: LEADERBOARD */}
                  {activeTab === 'LEADERBOARD' && (
                    <div className="space-y-4 my-auto">
                      <div className="flex flex-wrap justify-between items-center gap-3 shrink-0">
                        <h2 className="text-base font-bold text-amber-500 flex items-center gap-2">
                          <span className="text-xl">🏆</span> Top Player Leaderboard
                        </h2>

                        <div className={`flex gap-1.5 p-1 rounded-xl border text-xs font-bold ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-200 border-slate-300'
                          }`}>
                          <button
                            onClick={() => setLeaderboardSubTab('ALL')}
                            className={`px-3.5 py-1.5 rounded-lg transition ${leaderboardSubTab === 'ALL'
                                ? 'bg-sky-600 text-white shadow-md'
                                : isDarkMode
                                  ? 'text-slate-300 hover:text-white'
                                  : 'text-slate-700 hover:text-slate-900'
                              }`}
                          >
                            Semua Game
                          </button>
                          <button
                            onClick={() => setLeaderboardSubTab('GAME_1')}
                            className={`px-3.5 py-1.5 rounded-lg transition ${leaderboardSubTab === 'GAME_1'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : isDarkMode
                                  ? 'text-slate-300 hover:text-white'
                                  : 'text-slate-700 hover:text-slate-900'
                              }`}
                          >
                            Game 1 (Prompt Master)
                          </button>
                          <button
                            onClick={() => setLeaderboardSubTab('GAME_2')}
                            className={`px-3.5 py-1.5 rounded-lg transition ${leaderboardSubTab === 'GAME_2'
                                ? 'bg-purple-600 text-white shadow-md'
                                : isDarkMode
                                  ? 'text-slate-300 hover:text-white'
                                  : 'text-slate-700 hover:text-slate-900'
                              }`}
                          >
                            Game 2 (Mastery Quiz)
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-2">
                        {filteredLeaderboard.length === 0 ? (
                          <p className="text-sm opacity-60 text-center py-12">Belum ada skor tersimpan untuk kategori ini.</p>
                        ) : (
                          filteredLeaderboard.map((item, idx) => (
                            <div
                              key={idx}
                              className={`p-4 rounded-2xl flex justify-between items-center text-sm border transition ${idx === 0
                                  ? isDarkMode
                                    ? 'bg-amber-500/20 border-amber-500 font-bold shadow-lg shadow-amber-500/10'
                                    : 'bg-amber-100 border-amber-400 text-slate-900 font-bold'
                                  : idx === 1
                                    ? isDarkMode
                                      ? 'bg-slate-300/15 border-slate-400 font-bold'
                                      : 'bg-slate-200 border-slate-400 text-slate-900 font-bold'
                                    : idx === 2
                                      ? isDarkMode
                                        ? 'bg-amber-700/20 border-amber-700 font-bold'
                                        : 'bg-amber-200/60 border-amber-600 text-slate-900 font-bold'
                                      : isDarkMode
                                        ? 'bg-slate-900/50 border-slate-700'
                                        : 'bg-slate-50 border-slate-200 text-slate-800'
                                }`}
                            >
                              <div className="flex items-center gap-4">
                                <span className="w-8 text-center flex items-center justify-center">
                                  {getRankBadge(idx)}
                                </span>
                                <div>
                                  <p className="font-bold text-base flex items-center gap-2">
                                    {item.player_name}
                                  </p>
                                  <p className="text-xs opacity-60">{item.game_mode}</p>
                                </div>
                              </div>
                              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-base">{item.score} pts</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: MY STATS */}
                  {activeTab === 'MY_STATS' && (
                    <div className="space-y-5 my-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* KIRI: PROFILE NAMA & STAT CARDS */}
                        <div className="space-y-4">
                          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <h3 className="text-xl font-bold">{playerName}</h3>
                            <p className="text-xs opacity-60">Status: Active Player</p>
                          </div>

                          {/* 3 Stat Cards */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className={`p-4 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                              <span className="text-[10px] font-bold opacity-60 uppercase block">Current Score</span>
                              <span className="text-xl md:text-2xl font-black font-mono text-sky-400 mt-1 block">{playerStats.totalCombined}</span>
                            </div>

                            <div className={`p-4 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                              <span className="text-[10px] font-bold opacity-60 uppercase block">Challenges</span>
                              <span className="text-xl md:text-2xl font-black font-mono text-emerald-400 mt-1 block">{playerStats.completedChallenges}/2</span>
                            </div>

                            <div className={`p-4 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                              <span className="text-[10px] font-bold opacity-60 uppercase block">Position</span>
                              <span className="text-xl md:text-2xl font-black font-mono text-amber-400 mt-1 block">{playerStats.overallRank}</span>
                            </div>
                          </div>

                          {/* Detail Game 1 & Game 2 */}
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-indigo-950/20 border-indigo-800/40' : 'bg-indigo-50/50 border-indigo-200'}`}>
                              <span className="text-xs font-bold text-indigo-400 block">🎯 Game 1</span>
                              <div className="flex justify-between items-end mt-2">
                                <span className="text-lg font-black font-mono">{playerStats.scoreGame1} pts</span>
                                <span className="text-xs font-bold text-emerald-400">{playerStats.rankGame1}</span>
                              </div>
                            </div>

                            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-purple-950/20 border-purple-800/40' : 'bg-purple-50/50 border-purple-200'}`}>
                              <span className="text-xs font-bold text-purple-400 block">📊 Game 2</span>
                              <div className="flex justify-between items-end mt-2">
                                <span className="text-lg font-black font-mono">{playerStats.scoreGame2} pts</span>
                                <span className="text-xs font-bold text-emerald-400">{playerStats.rankGame2}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* KANAN: RECENT ACTIVITY / HISTORY */}
                        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDarkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                          <div>
                            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                              <span>⏱️</span> Recent Activity
                            </h3>

                            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                              {playerStats.history.length === 0 ? (
                                <p className="text-xs opacity-50 text-center py-10">Belum ada aktivitas permainan.</p>
                              ) : (
                                playerStats.history.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className={`p-3.5 rounded-xl border text-xs flex justify-between items-center ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
                                      }`}
                                  >
                                    <div>
                                      <p className="font-bold text-sky-400">Completed '{item.game_mode}'</p>
                                      <span className="text-[10px] opacity-50">Score: {item.score} pts</span>
                                    </div>
                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-1 rounded-lg">
                                      Done
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* BANNER TOTAL SKOR AKUMULASI DI BAGIAN BAWAH */}
                      <div className={`p-5 md:p-6 rounded-2xl border flex justify-between items-center relative overflow-hidden ${isDarkMode
                          ? 'bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border-sky-800/60 shadow-lg'
                          : 'bg-gradient-to-r from-sky-50 via-indigo-50 to-sky-50 border-sky-200 shadow-md'
                        }`}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs md:text-sm uppercase tracking-wider">
                            <span>🔥</span> TOTAL ACCUMULATED SCORE
                          </div>
                          <p className="text-xs opacity-70">
                            Gabungan skor dari kedua game
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl md:text-4xl font-black text-amber-400 font-mono tracking-tight">
                            {playerStats.totalCombined} <span className="text-xl md:text-2xl text-amber-500/80 font-normal">pts</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* GAMEPLAY STATES */}
            <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">

              {/* RULES STATE & SELEKSI DIFFICULTY */}
              {gameState === 'RULES' && (
                <div className="space-y-6 my-auto text-center">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-sky-400">📜 Pilih Tingkat Kesulitan</h2>
                    <p className="text-xs opacity-75">Sesuaikan tantangan dengan kemampuan Anda:</p>
                  </div>

                  {/* KARTU SELEKSI DIFFICULTY */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setSelectedDifficulty('EASY')}
                      className={`p-4 rounded-2xl border font-bold transition flex flex-col items-center gap-1 ${
                        selectedDifficulty === 'EASY'
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-lg scale-105'
                          : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-2xl">🟢</span>
                      <span className="text-sm">Easy</span>
                      <span className="text-[10px] opacity-70">30s | Basic (+100)</span>
                    </button>

                    <button
                      onClick={() => setSelectedDifficulty('MEDIUM')}
                      className={`p-4 rounded-2xl border font-bold transition flex flex-col items-center gap-1 ${
                        selectedDifficulty === 'MEDIUM'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-400 shadow-lg scale-105'
                          : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-2xl">🟡</span>
                      <span className="text-sm">Medium</span>
                      <span className="text-[10px] opacity-70">20s | Case (+150)</span>
                    </button>

                    <button
                      onClick={() => setSelectedDifficulty('HARD')}
                      className={`p-4 rounded-2xl border font-bold transition flex flex-col items-center gap-1 ${
                        selectedDifficulty === 'HARD'
                          ? 'bg-rose-500/20 border-rose-400 text-rose-400 shadow-lg scale-105'
                          : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-2xl">🔴</span>
                      <span className="text-sm">Hard</span>
                      <span className="text-[10px] opacity-70">15s | Expert (+200)</span>
                    </button>
                  </div>

                  <div className={`p-4 rounded-2xl border text-xs text-left space-y-2 ${isDarkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <p>⚡ Semakin tinggi tingkat kesulitan, semakin besar poin dasar yang diperoleh!</p>
                    <p>⏱️ Sisa waktu pengerjaan memberikan poin bonus tambahan.</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setGameState('MAIN_MENU')}
                      className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-2xl transition text-sm"
                    >
                      ⬅️ Batal
                    </button>
                    <button
                      onClick={handleStartGameFromRules}
                      className="flex-1 py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl transition text-base shadow-xl"
                    >
                      Mulai Mode {selectedDifficulty} 🚀
                    </button>
                  </div>
                </div>
              )}

              {/* MATERIAL STATE */}
              {gameState === 'MATERIAL' && currentLevel && (
                <div className="space-y-6 my-auto">
                  <div className={`flex justify-between items-center border-b pb-3 ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
                    <span className="text-sky-400 font-bold text-base">{currentLevel.title}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-bold border ${
                        currentLevel.difficulty === 'EASY' 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                          : currentLevel.difficulty === 'MEDIUM' 
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}>
                        {currentLevel.difficulty}
                      </span>
                      <span className={`text-sm font-semibold ${isDarkMode ? 'opacity-75' : 'text-slate-600'}`}>
                        Soal {currentLevelIdx + 1} / {activeLevels.length}
                      </span>
                    </div>
                  </div>

                  <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-sky-950/40 border-sky-800' : 'bg-sky-50 border-sky-200'}`}>
                    <h3 className="text-xs font-bold text-sky-400 mb-2 uppercase">💡 Ringkasan Materi:</h3>
                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'opacity-90' : 'text-slate-800 font-medium'}`}>
                      {currentLevel.material}
                    </p>
                  </div>

                  <button
                    onClick={handleStartLevel}
                    className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl transition text-base shadow-xl"
                  >
                    Mulai Menjawab ({currentLevel.timerSeconds}s) ➔
                  </button>
                </div>
              )}

              {/* PLAYING STATE */}
              {gameState === 'PLAYING' && currentLevel && (
                <div className="space-y-5 my-auto">
                  <div className={`flex justify-between items-center border-b pb-3 ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                      Skor Sesi Ini: <strong className="text-emerald-500 text-base font-mono">{sessionScore} pts</strong>
                    </span>

                    <div className="flex items-center gap-4">
                      <span className={`font-mono text-lg font-extrabold px-3 py-1 rounded-xl border ${
                        timeLeft <= 5 
                          ? 'bg-rose-500/20 border-rose-500 text-rose-500 animate-pulse' 
                          : isDarkMode 
                          ? 'bg-slate-900/80 border-slate-700 text-emerald-400' 
                          : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      }`}>
                        ⏱️ {timeLeft}s
                      </span>

                      {currentLevelIdx > 0 && (
                        <button
                          onClick={handleGoToPreviousLevel}
                          className={`text-xs px-3.5 py-1.5 rounded-xl border transition font-bold shadow ${
                            isDarkMode 
                              ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/40' 
                              : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-400'
                          }`}
                        >
                          ↩️ Soal {currentLevelIdx}
                        </button>
                      )}
                    </div>
                  </div>

                  {currentLevel.imageUrl && (
                    <div className={`w-full h-44 rounded-2xl overflow-hidden border flex items-center justify-center relative shadow-inner ${
                      isDarkMode ? 'border-slate-700 bg-slate-900/80' : 'border-slate-300 bg-slate-100'
                    }`}>
                      <img src={currentLevel.imageUrl} alt="Visual AI" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* TEKS SOAL / SKENARIO */}
                  <div className="text-center py-1">
                    <p className={`text-base font-extrabold leading-relaxed ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                      {currentLevel.scenario}
                    </p>
                  </div>

                  {/* KARTU JAWABAN ADAPTIF (LIGHT & DARK MODE) */}
                  <div className="grid grid-cols-1 gap-3">
                    {currentLevel.options.map((opt, idx) => {
                      const style = getOptionStyles(idx);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleAnswer(opt)}
                          className={`w-full text-left p-4 rounded-2xl font-medium text-sm transition-all duration-200 border backdrop-blur-md shadow-md hover:scale-[1.01] flex items-center gap-4 group ${style.border} ${style.bg}`}
                        >
                          <span className={`w-9 h-9 rounded-xl border flex items-center justify-center font-extrabold text-sm font-mono shrink-0 transition-transform group-hover:scale-110 ${style.badge}`}>
                            {opt.id}
                          </span>
                          <span className={`flex-1 leading-snug transition-colors ${style.text}`}>
                            {opt.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FEEDBACK STATE */}
              {gameState === 'FEEDBACK' && currentLevel && (
                <div className="space-y-5 text-center my-auto">
                  {selectedOption === null ? (
                    <div className="p-4 bg-amber-500/20 border border-amber-500 rounded-2xl">
                      <span className="text-3xl">⏰</span>
                      <h2 className="text-lg font-bold text-amber-500">Waktu Habis!</h2>
                    </div>
                  ) : selectedOption.isCorrect ? (
                    <div className="p-4 bg-emerald-500/20 border border-emerald-500 rounded-2xl">
                      <span className="text-3xl">🎉</span>
                      <h2 className="text-lg font-bold text-emerald-500">Jawaban Tepat!</h2>
                    </div>
                  ) : (
                    <div className="p-4 bg-rose-500/20 border border-rose-500 rounded-2xl">
                      <span className="text-3xl">❌</span>
                      <h2 className="text-lg font-bold text-rose-500">Pilihan Kurang Tepat!</h2>
                    </div>
                  )}

                  <div className={`p-5 rounded-2xl text-left text-sm leading-relaxed border ${
                    isDarkMode ? 'bg-slate-900/60 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}>
                    <p className="font-bold mb-1">Penjelasan:</p>
                    <p>{currentLevel.explanation}</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {currentLevel.defaultPromptToTest && selectedOption?.isCorrect && (
                      <button
                        onClick={handleOpenPlayground}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition text-sm"
                      >
                        🧪 Uji Coba Prompt Gambar Ini
                      </button>
                    )}

                    <button
                      onClick={handleNextLevel}
                      className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl transition text-base shadow-xl"
                    >
                      {currentLevelIdx + 1 < activeLevels.length ? 'Lanjut Soal Berikutnya ➔' : 'Selesaikan Game 🏆'}
                    </button>
                  </div>
                </div>
              )}

              {/* PLAYGROUND STATE */}
              {gameState === 'PLAYGROUND' && (
                <div className="space-y-4 text-left my-auto">
                  <h3 className="font-bold text-purple-400 text-sm">🧪 Uji Coba Prompt</h3>

                  <div className="w-full h-52 rounded-2xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center relative">
                    {isGenerating && <div className="absolute text-sm text-purple-300">⚡ Generating...</div>}
                    <img src={generatedImageUrl} alt="AI Output" className="w-full h-full object-cover" onLoad={() => setIsGenerating(false)} />
                  </div>

                  <textarea
                    value={playgroundPrompt}
                    onChange={(e) => setPlaygroundPrompt(e.target.value)}
                    rows={2}
                    className={`w-full p-3 border rounded-2xl text-sm focus:outline-none ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                  />

                  <div className="flex gap-3">
                    <button onClick={handleGenerateCustomImage} className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-2xl text-sm">
                      ✨ Generate Gambar
                    </button>
                    <button onClick={handleNextLevel} className="px-6 py-3 bg-slate-600 text-white font-bold rounded-2xl text-sm">
                      Lanjut ➔
                    </button>
                  </div>
                </div>
              )}

              {/* 🏆 FINISHED STATE (HANYA MENAMPILKAN SOAL YANG SALAH) */}
              {gameState === 'FINISHED' && (
                <div className="text-center space-y-5 my-auto max-w-2xl mx-auto py-2">
                  <span className="text-5xl block animate-bounce">🏆</span>
                  <h2 className="text-2xl font-black text-sky-400">Selamat, {playerName}!</h2>

                  {/* KARTU RINGKASAN SKOR */}
                  <div className={`p-5 rounded-2xl border max-w-md mx-auto ${isDarkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-slate-100 border-slate-300 shadow-md'}`}>
                    <span className="text-xs opacity-75 uppercase font-bold tracking-wider">Total Skor Mode {selectedDifficulty}</span>
                    <p className="text-4xl font-black text-emerald-400 mt-1 font-mono">{sessionScore} pts</p>
                    <p className="text-[11px] opacity-60 mt-1">Otomatis Masuk ke dalam leaderboard</p>
                  </div>

                  {/* KOTAK EVALUASI: HANYA MENAMPILKAN JAWABAN SALAH */}
                  <div className="space-y-3 text-left pt-2">
                    <div className="flex justify-between items-center border-b border-slate-700/60 pb-2">
                      <h3 className="font-bold text-xs md:text-sm text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span>❌</span> Evaluasi Jawaban Salah Sesi Ini
                      </h3>
                      <span className="text-[11px] font-bold opacity-70">
                        Salah: {wrongAnswers.length} / {sessionAnswers.length} Soal
                      </span>
                    </div>

                    {wrongAnswers.length === 0 ? (
                      <div className={`p-4 rounded-2xl border text-center ${isDarkMode ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                        <p className="font-bold text-sm">🎉 Luar biasa! Kamu menjawab SEMUA soal dengan sempurna tanpa kesalahan!</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                        {wrongAnswers.map((ans, idx) => (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition ${
                              isDarkMode ? 'bg-rose-950/30 border-rose-800/50' : 'bg-rose-50 border-rose-200'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-bold text-slate-200 text-xs">
                                ❌ {ans.questionTitle}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold shrink-0 bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                SALAH
                              </span>
                            </div>

                            <p className="text-[11px] opacity-90 leading-snug font-medium text-slate-300">
                              {ans.scenario}
                            </p>

                            <div className="pt-1 space-y-1 border-t border-slate-700/40 text-[11px]">
                              <p>
                                Jawaban Anda: <strong className="text-rose-400 font-bold">{ans.selectedText}</strong>
                              </p>
                              <p className="text-emerald-400 font-bold">
                                Jawaban Benar: {ans.correctText}
                              </p>
                              <p className="text-slate-400 italic text-[10px] pt-0.5">
                                💡 {ans.explanation}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={async () => {
                      await fetchLeaderboard();
                      setActiveTab('LEADERBOARD');
                      setGameState('MAIN_MENU');
                    }}
                    className="w-full max-w-md py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-2xl transition text-sm shadow-xl"
                  >
                    Kembali ke Halaman Utama ➔
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

    </main>
  );
}