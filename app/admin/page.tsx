'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GAME_1_PROMPT_LEVELS, GAME_2_PPT_LEVELS, DifficultyLevel } from '@/data/gameData';

interface QuestionDb {
  id?: number;
  game_type: string;
  difficulty?: DifficultyLevel;
  title: string;
  material: string;
  scenario: string;
  image_url: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: string;
  explanation: string;
  default_prompt_to_test: string;
  timer_seconds: number;
}

interface LeaderboardItem {
  id: number;
  player_name: string;
  avatar?: string;
  game_mode: string;
  score: number;
  created_at?: string;
}

interface CombinedPlayerStats {
  playerName: string;
  scoreGame1: number;
  scoreGame2: number;
  totalScore: number;
  completedCount: number;
  lastActive: string;
  status: 'Active' | 'Inactive';
}

type AdminTab = 'DASHBOARD' | 'PLAYER_LOGS' | 'CRUD_QUESTIONS';
type QuestionFilter = 'ALL' | 'GAME_1_PROMPT' | 'GAME_2_PPT';
type ManageQuestionTab = 'LIST' | 'FORM';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');

  // Data State
  const [questions, setQuestions] = useState<QuestionDb[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Modal State untuk Player Stats
  const [selectedPlayer, setSelectedPlayer] = useState<CombinedPlayerStats | null>(null);

  // Sub-Halaman & Filter Manage Questions State
  const [manageTab, setManageTab] = useState<ManageQuestionTab>('LIST');
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 🔔 Custom Toast Notification State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Form State CRUD Soal
  const [editingQuestion, setEditingQuestion] = useState<QuestionDb | null>(null);
  const [formQuestion, setFormQuestion] = useState<QuestionDb>({
    game_type: 'GAME_1_PROMPT',
    difficulty: 'EASY',
    title: '',
    material: '',
    scenario: '',
    image_url: '',
    option_a: '',
    option_b: '',
    option_c: '',
    correct_option: 'A',
    explanation: '',
    default_prompt_to_test: '',
    timer_seconds: 20
  });

  const fetchData = async () => {
    try {
      const [resQ, resL] = await Promise.all([
        fetch('/api/questions'),
        fetch('/api/leaderboard')
      ]);

      if (resQ.ok) {
        const qData = await resQ.json();
        if (Array.isArray(qData)) setQuestions(qData);
      }

      if (resL.ok) {
        const lData = await resL.json();
        if (Array.isArray(lData)) setLeaderboard(lData);
      }
    } catch (err) {
      console.error('Gagal mengambil data admin:', err);
      showNotification('Gagal mengambil data dari server!', 'error');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const isMainAdmin = sessionStorage.getItem('admin_session');
    if (isMainAdmin === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === 'admin123' || adminPass === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_session', 'true');
      showNotification('Selamat datang kembali, Admin!', 'success');
    } else {
      showNotification('Password Admin Salah!', 'error');
    }
  };

  const handleResetLeaderboard = async () => {
    if (!confirm('⚠️ PERINGATAN:\nApakah Anda yakin ingin MENGHAPUS SELURUH SKOR LEADERBOARD & LOGS?\n\nTindakan ini akan mengosongkan papan peringkat agar pemain baru bisa bersaing.')) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch('/api/leaderboard', { method: 'DELETE' });
      if (res.ok) {
        showNotification('Leaderboard dan riwayat permainan berhasil di-reset!', 'success');
        fetchData();
      } else {
        showNotification('Gagal melakukan reset leaderboard.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Terjadi kesalahan jaringan saat menghapus leaderboard.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSync30DefaultQuestions = async () => {
    if (!confirm('Apakah Anda yakin ingin MENGHAPUS seluruh soal lama di database dan MENGIMPOR Soal Standar beserta Difficulty-nya?')) return;
    
    setIsSeeding(true);

    try {
      for (const q of questions) {
        if (q.id) {
          await fetch(`/api/questions?id=${q.id}`, { method: 'DELETE' });
        }
      }

      const game1Formatted: QuestionDb[] = GAME_1_PROMPT_LEVELS.map((level) => {
        const correctOpt = level.options.find((o) => o.isCorrect);
        const correctLetter = correctOpt ? correctOpt.id.toUpperCase() : 'A';
        return {
          game_type: 'GAME_1_PROMPT',
          difficulty: level.difficulty || 'EASY',
          title: level.title,
          material: level.material,
          scenario: level.scenario,
          image_url: level.imageUrl || '',
          option_a: level.options[0]?.text || '',
          option_b: level.options[1]?.text || '',
          option_c: level.options[2]?.text || '',
          correct_option: correctLetter,
          explanation: level.explanation,
          default_prompt_to_test: level.defaultPromptToTest || '',
          timer_seconds: level.timerSeconds || 25,
        };
      });

      const game2Formatted: QuestionDb[] = GAME_2_PPT_LEVELS.map((level) => {
        const correctOpt = level.options.find((o) => o.isCorrect);
        const correctLetter = correctOpt ? correctOpt.id.toUpperCase() : 'A';
        return {
          game_type: 'GAME_2_PPT',
          difficulty: level.difficulty || 'EASY',
          title: level.title,
          material: level.material,
          scenario: level.scenario,
          image_url: level.imageUrl || '',
          option_a: level.options[0]?.text || '',
          option_b: level.options[1]?.text || '',
          option_c: level.options[2]?.text || '',
          correct_option: correctLetter,
          explanation: level.explanation,
          default_prompt_to_test: level.defaultPromptToTest || '',
          timer_seconds: level.timerSeconds || 20,
        };
      });

      const allDefaultQuestions = [...game1Formatted, ...game2Formatted];

      for (const q of allDefaultQuestions) {
        await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(q),
        });
      }

      showNotification('Berhasil mensinkronkan database dengan tingkat kesulitan!', 'success');
      await fetchData();
    } catch (err) {
      console.error(err);
      showNotification('Gagal mensinkronkan soal bawaan ke database.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingQuestion ? 'PUT' : 'POST';
    try {
      const res = await fetch('/api/questions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingQuestion ? { ...formQuestion, id: editingQuestion.id } : formQuestion)
      });

      if (res.ok) {
        showNotification(
          editingQuestion ? 'Soal berhasil diperbarui!' : 'Soal baru berhasil ditambahkan!',
          'success'
        );
        setEditingQuestion(null);
        resetForm();
        fetchData();
        setManageTab('LIST');
      } else {
        showNotification('Gagal menyimpan soal.', 'error');
      }
    } catch (err) {
      showNotification('Terjadi kesalahan jaringan.', 'error');
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return;
    try {
      const res = await fetch(`/api/questions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Soal berhasil dihapus!', 'info');
        fetchData();
      } else {
        showNotification('Gagal menghapus soal.', 'error');
      }
    } catch (err) {
      showNotification('Gagal menghapus soal.', 'error');
    }
  };

  const resetForm = () => {
    setFormQuestion({
      game_type: 'GAME_1_PROMPT',
      difficulty: 'EASY',
      title: '',
      material: '',
      scenario: '',
      image_url: '',
      option_a: '',
      option_b: '',
      option_c: '',
      correct_option: 'A',
      explanation: '',
      default_prompt_to_test: '',
      timer_seconds: 20
    });
  };

  const handleOpenAddForm = () => {
    setEditingQuestion(null);
    resetForm();
    setManageTab('FORM');
  };

  const handleOpenEditForm = (q: QuestionDb) => {
    setEditingQuestion(q);
    setFormQuestion({
      ...q,
      difficulty: q.difficulty || 'EASY'
    });
    setManageTab('FORM');
  };

  const getCalculatedPlayerStats = (): CombinedPlayerStats[] => {
    const playerMap: { [name: string]: { game1: number; game2: number; count: number; lastDate: string } } = {};

    leaderboard.forEach((item) => {
      const name = item.player_name;
      const key = name.toLowerCase();

      if (!playerMap[key]) {
        playerMap[key] = { game1: 0, game2: 0, count: 0, lastDate: item.created_at || '' };
      }

      playerMap[key].count += 1;
      if (item.created_at) playerMap[key].lastDate = item.created_at;

      if (item.game_mode.includes('Prompt') || item.game_mode.includes('Game 1')) {
        playerMap[key].game1 = Math.max(playerMap[key].game1, Number(item.score) || 0);
      } else if (item.game_mode.includes('PPT') || item.game_mode.includes('Mastery') || item.game_mode.includes('Game 2')) {
        playerMap[key].game2 = Math.max(playerMap[key].game2, Number(item.score) || 0);
      }
    });

    return Object.keys(playerMap).map((key) => {
      const originalName = leaderboard.find(i => i.player_name.toLowerCase() === key)?.player_name || key;
      const g1 = playerMap[key].game1;
      const g2 = playerMap[key].game2;
      return {
        playerName: originalName,
        scoreGame1: g1,
        scoreGame2: g2,
        totalScore: g1 + g2,
        completedCount: (g1 > 0 ? 1 : 0) + (g2 > 0 ? 1 : 0),
        lastActive: playerMap[key].lastDate,
        status: 'Active' as const
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  };

  const topPerformers = getCalculatedPlayerStats();
  const totalUserCount = topPerformers.length;
  const activeSessionsCount = leaderboard.length;
  const totalQuestionsCount = questions.length;

  const countGame1 = questions.filter((q) => q.game_type === 'GAME_1_PROMPT' || q.game_type.includes('Game 1')).length;
  const countGame2 = questions.filter((q) => q.game_type === 'GAME_2_PPT' || q.game_type.includes('Game 2')).length;

  const filteredQuestions = questions.filter((q) => {
    const isGame1 = q.game_type === 'GAME_1_PROMPT' || q.game_type.includes('Game 1');
    const isGame2 = q.game_type === 'GAME_2_PPT' || q.game_type.includes('Game 2');

    let matchesGame = true;
    if (questionFilter === 'GAME_1_PROMPT') matchesGame = isGame1;
    if (questionFilter === 'GAME_2_PPT') matchesGame = isGame2;

    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.scenario.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.material && q.material.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGame && matchesSearch;
  });

  const usersBothGames = topPerformers.filter(p => p.completedCount === 2).length;
  const usersSingleGame = topPerformers.filter(p => p.completedCount === 1).length;

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center p-4 relative">
        <form onSubmit={handleLogin} className="w-full max-w-md p-8 rounded-3xl bg-[#151c2e] border border-slate-800 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-3xl">
            ⚙️
          </div>
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Admin Control Panel</h1>
            <p className="text-xs text-slate-400 mt-1">Prompt Master System Analytics</p>
          </div>
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-sky-400">Password Access:</label>
            <input
              type="password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              placeholder="Masukkan Password Admin"
              className="w-full px-4 py-3 rounded-xl bg-[#0b0f19] border border-slate-800 text-white font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl transition text-sm shadow-lg">
            Masuk ke Dashboard ➔
          </button>
        </form>

        {/* 🔔 CUSTOM TOAST NOTIFICATION UI FOR LOGIN */}
        {toast.show && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 bg-slate-900/95 border-indigo-500/40 text-white">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black shrink-0 ${
              toast.type === 'success' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : toast.type === 'error'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
            }`}>
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
            </div>
            
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Notifikasi System</p>
              <p className="text-xs md:text-sm font-semibold text-slate-100">{toast.message}</p>
            </div>

            <button 
              onClick={() => setToast({ ...toast, show: false })}
              className="ml-4 text-slate-400 hover:text-white text-xs font-bold p-1 transition"
            >
              ✕
            </button>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white flex relative">
      <aside className="w-64 bg-[#151c2e] border-r border-slate-800/80 p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-600 text-white text-xs px-2.5 py-1 rounded-lg font-black">PM</span>
            <h1 className="font-extrabold text-base tracking-wide text-indigo-400">Admin System</h1>
          </div>

          <nav className="space-y-2 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'DASHBOARD' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800/60'}`}
            >
              <span>📊</span> Dashboard
            </button>
            <button
              onClick={() => {
                fetchData();
                setActiveTab('PLAYER_LOGS');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'PLAYER_LOGS' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800/60'}`}
            >
              <span>📜</span> Activity Logs
            </button>
            <button
              onClick={() => setActiveTab('CRUD_QUESTIONS')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'CRUD_QUESTIONS' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800/60'}`}
            >
              <span>✏️</span> Manage Questions
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800/80 space-y-3">
          <Link
            href="/"
            onClick={() => sessionStorage.removeItem('admin_session')}
            className="w-full block text-center py-2.5 bg-slate-800/80 hover:bg-slate-700 text-xs font-bold rounded-xl transition"
          >
            ⬅️ Back to Game
          </Link>
          <button
            onClick={() => {
              sessionStorage.removeItem('admin_session');
              setIsAuthenticated(false);
            }}
            className="w-full text-center py-2.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 text-xs font-bold rounded-xl transition"
          >
            Logout
          </button>
        </div>
      </aside>

      <section className="flex-1 p-6 md:p-8 overflow-y-auto max-h-screen">
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 rounded-2xl bg-[#151c2e] border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total User Count</span>
                  <p className="text-3xl font-black font-mono text-white mt-1">{totalUserCount}</p>
                  <span className="text-[10px] text-emerald-400 font-semibold">↗ Active Registered Players</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl">👥</div>
              </div>

              <div className="p-6 rounded-2xl bg-[#151c2e] border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Sessions</span>
                  <p className="text-3xl font-black font-mono text-white mt-1">{activeSessionsCount}</p>
                  <span className="text-[10px] text-sky-400 font-semibold">Total Completed Game Sessions</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-2xl">🎮</div>
              </div>

              <div className="p-6 rounded-2xl bg-[#151c2e] border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Questions</span>
                  <p className="text-3xl font-black font-mono text-white mt-1">{totalQuestionsCount}</p>
                  <span className="text-[10px] text-emerald-400 font-semibold">↗ Terintegrasi dengan Database</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl">❓</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="p-6 rounded-2xl bg-[#151c2e] border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-200">User Behavior</h3>
                  <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">Overall</span>
                </div>

                <div className="flex items-center justify-center py-4">
                  <div className="relative w-36 h-36 rounded-full border-8 border-indigo-500/20 flex items-center justify-center border-t-indigo-500 border-r-purple-500">
                    <div className="text-center">
                      <span className="text-2xl font-black font-mono">{totalUserCount}</span>
                      <span className="block text-[10px] text-slate-400">Total Players</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Completed Both Games</span>
                    <strong className="font-mono">{usersBothGames} Players</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Played Single Game</span>
                    <strong className="font-mono">{usersSingleGame} Players</strong>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 p-6 rounded-2xl bg-[#151c2e] border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-200">Game Performance</h3>
                  <span className="text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg font-semibold">Live Score Comparison</span>
                </div>

                <div className="h-44 w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-800">
                  {topPerformers.map((p, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="w-full flex items-end gap-1 h-full justify-center">
                        <div
                          style={{ height: `${Math.min((p.scoreGame1 / 2500) * 100, 100)}%` }}
                          className="w-1/2 bg-indigo-500 rounded-t-md transition-all hover:bg-indigo-400"
                          title={`Game 1: ${p.scoreGame1} pts`}
                        ></div>
                        <div
                          style={{ height: `${Math.min((p.scoreGame2 / 2500) * 100, 100)}%` }}
                          className="w-1/2 bg-purple-500 rounded-t-md transition-all hover:bg-purple-400"
                          title={`Game 2: ${p.scoreGame2} pts`}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate max-w-[50px]">{p.playerName}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center gap-6 text-xs pt-1">
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-indigo-500"></span> Game 1 (AI Prompt Master)</span>
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-purple-500"></span> Game 2 (AI Mastery Quiz)</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#151c2e] border border-slate-800 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-200">Top Performance Players (Akumulasi Game 1 + Game 2)</h3>
                  <span className="text-xs text-slate-400">Total {topPerformers.length} Players • Klik player untuk melihat statistik detail</span>
                </div>

                <button
                  type="button"
                  onClick={handleResetLeaderboard}
                  disabled={isResetting || leaderboard.length === 0}
                  className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold rounded-xl text-xs transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>🔄</span> {isResetting ? 'Memproses Reset...' : 'Reset Leaderboard'}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase">
                      <th className="p-3">Rank</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Game 1 Score</th>
                      <th className="p-3">Game 2 Score</th>
                      <th className="p-3">Total Score</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {topPerformers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500 italic">
                          Belum ada data peringkat. Leaderboard bersih!
                        </td>
                      </tr>
                    ) : (
                      topPerformers.map((player, idx) => (
                        <tr 
                          key={idx} 
                          onClick={() => setSelectedPlayer(player)}
                          className="hover:bg-slate-800/80 cursor-pointer transition group"
                        >
                          <td className="p-3 font-bold text-indigo-400">#{idx + 1}</td>
                          <td className="p-3 font-bold text-white flex items-center gap-2 group-hover:text-cyan-300">
                            <span className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-xs font-black border border-indigo-500/30">
                              {player.playerName.charAt(0).toUpperCase()}
                            </span>
                            {player.playerName}
                          </td>
                          <td className="p-3 font-mono text-slate-300">{player.scoreGame1} pts</td>
                          <td className="p-3 font-mono text-slate-300">{player.scoreGame2} pts</td>
                          <td className="p-3 font-mono font-black text-emerald-400 text-sm">{player.totalScore} pts</td>
                          <td className="p-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'PLAYER_LOGS' && (
          <div className="p-6 rounded-2xl bg-[#151c2e] border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-sky-400">📜 Log Riwayat Bermain User</h3>
              <div className="flex gap-2">
                <button
                  onClick={fetchData}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow"
                >
                  <span>🔄</span> Refresh Logs
                </button>
                <button
                  onClick={handleResetLeaderboard}
                  disabled={isResetting || leaderboard.length === 0}
                  className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-40"
                >
                  <span>🗑️</span> Reset Semua Log
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase">
                    <th className="p-3">ID Log</th>
                    <th className="p-3">Username</th>
                    <th className="p-3">Mode Game</th>
                    <th className="p-3">Skor Akhir</th>
                    <th className="p-3">Waktu Selesai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500 italic">
                        Tidak ada riwayat permainan.
                      </td>
                    </tr>
                  ) : (
                    [...leaderboard]
                      .sort((a, b) => (b.id || 0) - (a.id || 0))
                      .map((item, idx) => (
                        <tr key={item.id ? `log-${item.id}` : `log-idx-${idx}`} className="hover:bg-slate-800/40">
                          <td className="p-3 font-mono opacity-60">#{item.id || idx + 1}</td>
                          <td className="p-3 font-bold text-sky-300">{item.player_name}</td>
                          <td className="p-3">{item.game_mode}</td>
                          <td className="p-3 font-mono font-bold text-emerald-400">{item.score} pts</td>
                          <td className="p-3 text-slate-400">
                            {item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : 'Baru saja'}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'CRUD_QUESTIONS' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#151c2e] border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Bank Soal</span>
                  <span className="text-2xl font-black font-mono text-indigo-400">{totalQuestionsCount} Soal</span>
                </div>
                <span className="text-2xl">📦</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#151c2e] border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Game 1: Prompt Master</span>
                  <span className="text-2xl font-black font-mono text-sky-400">{countGame1} Soal</span>
                </div>
                <span className="text-2xl">🎯</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#151c2e] border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Game 2: Mastery Quiz</span>
                  <span className="text-2xl font-black font-mono text-purple-400">{countGame2} Soal</span>
                </div>
                <span className="text-2xl">📊</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#151c2e] border border-slate-800 space-y-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex bg-[#0b0f19] p-1.5 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setManageTab('LIST')}
                    className={`px-5 py-2.5 rounded-lg font-bold text-xs md:text-sm transition flex items-center gap-2 ${
                      manageTab === 'LIST'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>📋</span> Bank Soal ({questions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setManageTab('FORM')}
                    className={`px-5 py-2.5 rounded-lg font-bold text-xs md:text-sm transition flex items-center gap-2 ${
                      manageTab === 'FORM'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{editingQuestion ? '✏️ Edit Soal' : '➕ Tambah Soal Baru'}</span>
                  </button>
                </div>

                {manageTab === 'LIST' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenAddForm}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition shadow-md flex items-center gap-1.5"
                    >
                      <span>➕</span> Tambah Soal Baru
                    </button>
                  </div>
                )}
              </div>

              {manageTab === 'LIST' && (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-[#0b0f19] p-3.5 rounded-xl border border-slate-800">
                    <div className="relative w-full md:w-80">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500 text-sm">
                        🔍
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari judul, materi, atau skenario..."
                        className="w-full pl-9 pr-3 py-2 bg-[#151c2e] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div className="flex gap-1.5 w-full md:w-auto overflow-x-auto text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setQuestionFilter('ALL')}
                        className={`px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${
                          questionFilter === 'ALL'
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                            : 'bg-[#151c2e] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Semua ({questions.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuestionFilter('GAME_1_PROMPT')}
                        className={`px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${
                          questionFilter === 'GAME_1_PROMPT'
                            ? 'bg-sky-600/20 border-sky-500 text-sky-300'
                            : 'bg-[#151c2e] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        🎯 Game 1 ({countGame1})
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuestionFilter('GAME_2_PPT')}
                        className={`px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${
                          questionFilter === 'GAME_2_PPT'
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                            : 'bg-[#151c2e] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        📊 Game 2 ({countGame2})
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 text-xs">
                    {filteredQuestions.length === 0 ? (
                      <div className="text-center py-12 bg-[#0b0f19] rounded-xl border border-slate-800 space-y-1">
                        <p className="text-slate-400 font-medium">Tidak ada soal yang ditemukan.</p>
                      </div>
                    ) : (
                      filteredQuestions.map((q, idx) => (
                        <div
                          key={q.id ? `question-${q.id}` : `question-idx-${idx}`}
                          className="p-4 rounded-xl border border-slate-800 bg-[#0b0f19] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] px-2.5 py-0.5 rounded font-bold ${
                                  q.game_type === 'GAME_1_PROMPT' || q.game_type.includes('Game 1')
                                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                }`}
                              >
                                {q.game_type === 'GAME_1_PROMPT' || q.game_type.includes('Game 1') ? '🎯 Game 1' : '📊 Game 2'}
                              </span>

                              <span className="text-[10px] text-slate-500 font-mono">ID #{q.id || idx + 1}</span>
                            </div>
                            <p className="font-bold text-sm text-white">{q.title}</p>
                            <p className="text-slate-400 line-clamp-2">{q.scenario}</p>
                          </div>

                          <div className="flex gap-2 shrink-0 self-end md:self-center">
                            <button
                              onClick={() => handleOpenEditForm(q)}
                              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-white font-bold transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => q.id && handleDeleteQuestion(q.id)}
                              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-white font-bold transition"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {manageTab === 'FORM' && (
                <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-indigo-400 text-sm">
                      {editingQuestion ? `✏️ Edit Soal Existing (ID #${editingQuestion.id})` : '➕ Tambah Soal Baru'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setManageTab('LIST');
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                    >
                      ✖ Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="font-semibold block mb-1 text-slate-300">Game Type:</label>
                      <select
                        value={formQuestion.game_type}
                        onChange={e => setFormQuestion({ ...formQuestion, game_type: e.target.value })}
                        className="w-full p-3 rounded-xl bg-[#0b0f19] border border-slate-800 text-white font-semibold focus:outline-none focus:border-indigo-500"
                      >
                        <option value="GAME_1_PROMPT">Game 1: AI Prompt Master</option>
                        <option value="GAME_2_PPT">Game 2: AI Mastery Quiz</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-slate-300">Tingkat Kesulitan (Difficulty):</label>
                      <select
                        value={formQuestion.difficulty || 'EASY'}
                        onChange={e => setFormQuestion({ ...formQuestion, difficulty: e.target.value as DifficultyLevel })}
                        className="w-full p-3 rounded-xl bg-[#0b0f19] border border-slate-800 text-white font-semibold focus:outline-none focus:border-indigo-500"
                      >
                        <option value="EASY">🟢 EASY </option>
                        <option value="MEDIUM">🟡 MEDIUM </option>
                        <option value="HARD">🔴 HARD </option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-slate-300">Judul Soal:</label>
                      <input
                        type="text"
                        required
                        value={formQuestion.title}
                        onChange={e => setFormQuestion({ ...formQuestion, title: e.target.value })}
                        className="w-full p-3 rounded-xl bg-[#0b0f19] border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                        placeholder="Contoh: Style Prompt Cyberpunk"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-slate-300">Ringkasan Materi (Opsional):</label>
                    <textarea
                      value={formQuestion.material}
                      onChange={e => setFormQuestion({ ...formQuestion, material: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#0b0f19] border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                      rows={2}
                      placeholder="Ringkasan materi singkat sebelum menjawab soal..."
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-slate-300">Skenario Pertanyaan:</label>
                    <textarea
                      required
                      value={formQuestion.scenario}
                      onChange={e => setFormQuestion({ ...formQuestion, scenario: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#0b0f19] border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                      rows={3}
                      placeholder="Tuliskan pertanyaan/skenario soal..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold block mb-1 text-slate-300">Pilihan A:</label>
                      <input required type="text" value={formQuestion.option_a} onChange={e => setFormQuestion({ ...formQuestion, option_a: e.target.value })} className="w-full p-2.5 rounded-xl bg-[#0b0f19] border border-slate-800 text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1 text-slate-300">Pilihan B:</label>
                      <input required type="text" value={formQuestion.option_b} onChange={e => setFormQuestion({ ...formQuestion, option_b: e.target.value })} className="w-full p-2.5 rounded-xl bg-[#0b0f19] border border-slate-800 text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1 text-slate-300">Pilihan C:</label>
                      <input required type="text" value={formQuestion.option_c} onChange={e => setFormQuestion({ ...formQuestion, option_c: e.target.value })} className="w-full p-2.5 rounded-xl bg-[#0b0f19] border border-slate-800 text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold block mb-1 text-slate-300">Kunci Jawaban Benar:</label>
                      <select value={formQuestion.correct_option} onChange={e => setFormQuestion({ ...formQuestion, correct_option: e.target.value })} className="w-full p-3 rounded-xl bg-[#0b0f19] border border-slate-800 text-white focus:outline-none focus:border-indigo-500">
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-slate-300">Image URL (Opsional):</label>
                      <input type="text" value={formQuestion.image_url} onChange={e => setFormQuestion({ ...formQuestion, image_url: e.target.value })} className="w-full p-3 rounded-xl bg-[#0b0f19] border border-slate-800 text-white focus:outline-none focus:border-indigo-500" placeholder="https://..." />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-slate-300">Penjelasan Kunci Jawaban:</label>
                    <textarea required value={formQuestion.explanation} onChange={e => setFormQuestion({ ...formQuestion, explanation: e.target.value })} className="w-full p-3 rounded-xl bg-[#0b0f19] border border-slate-800 text-white focus:outline-none focus:border-indigo-500" rows={2} placeholder="Penjelasan saat user selesai menjawab..." />
                  </div>

                  <button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 font-extrabold text-white rounded-xl text-sm transition shadow-lg mt-2">
                    {editingQuestion ? '💾 Simpan Perubahan Soal' : '➕ Tambahkan Soal'}
                  </button>
                </form>
              )}

            </div>

          </div>
        )}
      </section>

      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#111827] border border-emerald-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-600 p-0.5 shadow-lg">
                  <div className="w-full h-full bg-[#111827] rounded-[14px] flex items-center justify-center font-black text-2xl text-emerald-400 font-mono">
                    {selectedPlayer.playerName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    {selectedPlayer.playerName}
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                      PRO
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Sesi Terakhir: {selectedPlayer.lastActive ? new Date(selectedPlayer.lastActive).toLocaleString('id-ID') : 'Baru Saja'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlayer(null)}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 font-semibold">Tantangan Selesai</span>
                  <span className="font-bold text-white font-mono">{selectedPlayer.completedCount} / 2 Game</span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 font-semibold">Skor Game 1 (Prompt Master)</span>
                  <span className="font-bold text-sky-400 font-mono">{selectedPlayer.scoreGame1} pts</span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 font-semibold">Skor Game 2 (Mastery Quiz)</span>
                  <span className="font-bold text-purple-400 font-mono">{selectedPlayer.scoreGame2} pts</span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 font-semibold">Peringkat Global</span>
                  <span className="font-bold text-amber-400 font-mono">
                    #{topPerformers.findIndex(p => p.playerName.toLowerCase() === selectedPlayer.playerName.toLowerCase()) + 1}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
                <div className="relative w-36 h-36 rounded-full border-8 border-slate-800 flex items-center justify-center border-t-emerald-400 border-r-indigo-500 shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                  <div className="text-center">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">LEVEL</span>
                    <span className="text-3xl font-black font-mono text-white">
                      {Math.max(1, Math.floor(selectedPlayer.totalScore / 500))}
                    </span>
                    <span className="block text-[9px] text-emerald-400 font-bold font-mono mt-0.5">
                      {selectedPlayer.totalScore} pts
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-medium mt-3">Skor Akumulasi Keseluruhan</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>🏆</span> Achievements & Lencana
              </h3>

              <div className="grid grid-cols-4 gap-3">
                <div className={`p-3 rounded-xl border text-center transition ${selectedPlayer.totalScore > 0 ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                  <span className="text-2xl block mb-1">🎯</span>
                  <span className="text-[10px] font-bold block">First Play</span>
                </div>

                <div className={`p-3 rounded-xl border text-center transition ${selectedPlayer.completedCount === 2 ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                  <span className="text-2xl block mb-1">⚡</span>
                  <span className="text-[10px] font-bold block">All Clear</span>
                </div>

                <div className={`p-3 rounded-xl border text-center transition ${selectedPlayer.totalScore >= 1000 ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                  <span className="text-2xl block mb-1">🔥</span>
                  <span className="text-[10px] font-bold block">High Scorer</span>
                </div>

                <div className={`p-3 rounded-xl border text-center transition ${topPerformers.findIndex(p => p.playerName.toLowerCase() === selectedPlayer.playerName.toLowerCase()) === 0 ? 'bg-purple-950/40 border-purple-500/40 text-purple-300' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                  <span className="text-2xl block mb-1">👑</span>
                  <span className="text-[10px] font-bold block">Top Champion</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedPlayer(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition"
            >
              Tutup Statistik Player
            </button>
          </div>
        </div>
      )}

      {/* 🔔 CUSTOM TOAST NOTIFICATION UI FOR DASHBOARD */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 bg-slate-900/95 border-emerald-500/40 text-white">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black shrink-0 ${
            toast.type === 'success' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : toast.type === 'error'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
          }`}>
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </div>
          
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Notifikasi System</p>
            <p className="text-xs md:text-sm font-semibold text-slate-100">{toast.message}</p>
          </div>

          <button 
            onClick={() => setToast({ ...toast, show: false })}
            className="ml-4 text-slate-400 hover:text-white text-xs font-bold p-1 transition"
          >
            ✕
          </button>
        </div>
      )}
    </main>
  );
}