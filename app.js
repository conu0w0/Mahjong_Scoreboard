const { useState, useMemo } = React;

const { 
  Users, Settings, History, RotateCcw, 
  Trophy, AlertCircle, ChevronUp, ChevronDown 
} = lucide;

const App = () => {
  // --- 初期設定狀態 ---
  const [players, setPlayers] = useState(['玩家 1', '玩家 2', '玩家 3', '玩家 4']);
  const winds = ['東', '南', '西', '北'];
  const [baseMoney, setBaseMoney] = useState(100); // 底
  const [pointMoney, setPointMoney] = useState(20); // 台
  const [isGameStarted, setIsGameStarted] = useState(false);

  // --- 遊戲過程狀態 ---
  const [history, setHistory] = useState([]);
  const [currentDealerIdx, setCurrentDealerIdx] = useState(0); // 誰是莊家
  const [comboCount, setComboCount] = useState(0); // 連莊數
  
  // 場風邏輯：0=東風, 1=南風, 2=西風, 3=北風
  const [roundWindIdx, setRoundWindIdx] = useState(0); 

  // --- 當前輸入表單狀態 ---
  const [winnerIdx, setWinnerIdx] = useState(0);
  const [loserIdx, setLoserIdx] = useState(1);
  const [isSelfDraw, setIsSelfDraw] = useState(true);
  const [points, setPoints] = useState(0); 
  const [penalty, setPenalty] = useState(0); 

  // --- 計算邏輯 ---
  const balances = useMemo(() => {
    const res = [0, 0, 0, 0];
    history.forEach(round => {
      round.changes.forEach((change, idx) => {
        res[idx] += change;
      });
    });
    return res;
  }, [history]);

  // 取得當前場風名稱
  const getRoundStatus = (rIdx, dIdx) => {
    return `${winds[rIdx]}風${winds[dIdx]}`;
  };

  const handleAddRound = () => {
    const changes = [0, 0, 0, 0];
    const dealerExtraPoints = 1 + (comboCount * 2);
    
    // 淨台數 = 贏家台數 - 犯規扣台
    const netPoints = points - penalty;

    const calculateTotal = (isWinnerDealer, isLoserDealer, rawPoints) => {
      let finalPoints = rawPoints;
      if (isWinnerDealer || isLoserDealer) {
        finalPoints += dealerExtraPoints;
      }
      return baseMoney + (finalPoints * pointMoney);
    };

    if (isSelfDraw) {
      let totalWon = 0;
      players.forEach((_, idx) => {
        if (idx !== winnerIdx) {
          const amount = calculateTotal(winnerIdx === currentDealerIdx, idx === currentDealerIdx, netPoints);
          changes[idx] -= amount;
          totalWon += amount;
        }
      });
      changes[winnerIdx] = totalWon;
    } else {
      const amount = calculateTotal(winnerIdx === currentDealerIdx, loserIdx === currentDealerIdx, netPoints);
      changes[winnerIdx] = amount;
      changes[loserIdx] = -amount;
    }

    const currentStatus = getRoundStatus(roundWindIdx, currentDealerIdx);

    const newRound = {
      id: Date.now(),
      status: currentStatus,
      winner: players[winnerIdx],
      winnerWind: winds[winnerIdx],
      type: isSelfDraw ? '自摸' : '放槍',
      loser: isSelfDraw ? '三家' : players[loserIdx],
      loserWind: isSelfDraw ? '' : winds[loserIdx],
      points: points,
      penalty: penalty,
      dealer: players[currentDealerIdx],
      dealerWind: winds[currentDealerIdx],
      combo: comboCount,
      changes: changes,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setHistory([newRound, ...history]);
    
    if (winnerIdx === currentDealerIdx) {
      setComboCount(comboCount + 1);
    } else {
      setComboCount(0);
      const nextDealerIdx = (currentDealerIdx + 1) % 4;
      setCurrentDealerIdx(nextDealerIdx);
      if (nextDealerIdx === 0) {
        setRoundWindIdx((roundWindIdx + 1) % 4);
      }
    }
    setPoints(0);
    setPenalty(0);
  };

  const undoLastRound = () => {
    if (history.length === 0) return;
    setHistory(history.slice(1));
  };

  if (!isGameStarted) {
    return (
      <div className="min-h-screen bg-stone-100 p-4 font-sans text-stone-800 flex items-center justify-center text-[16px]">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border-t-8 border-red-700">
          <div className="p-8 text-center bg-stone-50 border-b border-stone-100">
            <h1 className="text-3xl font-black text-red-800 mb-2">🧧 恭喜發財</h1>
            <p className="text-stone-500 font-medium tracking-widest text-sm">台 灣 麻 將 記 帳 系 統</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-stone-600">
                <Users size={18} /> 玩家設定 (初始風家)
              </label>
              <div className="space-y-2">
                {players.map((name, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-12 h-12 bg-amber-50 text-amber-700 flex items-center justify-center rounded-xl font-black text-lg shrink-0 border border-amber-200">
                      {winds[i]}
                    </div>
                    <input
                      type="text"
                      value={name}
                      placeholder={`玩家 ${i+1}`}
                      onChange={(e) => {
                        const newPlayers = [...players];
                        newPlayers[i] = e.target.value;
                        setPlayers(newPlayers);
                      }}
                      className="flex-1 p-3 border-2 border-stone-100 rounded-xl focus:border-red-500 outline-none transition-all font-bold"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-600 block text-center">底</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={baseMoney}
                  onChange={(e) => setBaseMoney(Number(e.target.value))}
                  className="w-full p-4 bg-stone-50 border-2 border-stone-100 rounded-xl focus:border-red-500 outline-none text-center text-xl font-black"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-600 block text-center">台</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={pointMoney}
                  onChange={(e) => setPointMoney(Number(e.target.value))}
                  className="w-full p-4 bg-stone-50 border-2 border-stone-100 rounded-xl focus:border-red-500 outline-none text-center text-xl font-black"
                />
              </div>
            </div>

            <button
              onClick={() => setIsGameStarted(true)}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-100 transition-all text-lg flex items-center justify-center gap-2 active:scale-95"
            >
              對局開始
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-[16px]">
      {/* Header */}
      <div className="bg-stone-800 text-stone-100 p-4 sticky top-0 z-20 shadow-lg border-b border-stone-700">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-black flex items-center gap-2">
              <span className="bg-amber-500 text-stone-900 px-2 py-0.5 rounded text-sm shadow-sm">
                {getRoundStatus(roundWindIdx, currentDealerIdx)}
              </span> 
              計分板
            </h1>
            <button 
              onClick={() => setIsGameStarted(false)} 
              className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors border border-white/5"
            >
              <Settings size={18} className="text-stone-300" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {players.map((name, i) => (
              <div key={i} className="bg-stone-900/40 backdrop-blur-sm rounded-2xl p-2 text-center border border-white/5 shadow-inner">
                <div className="text-[10px] text-stone-400 mb-0.5 font-bold uppercase tracking-tighter">{winds[i]}家</div>
                <div className="text-[12px] font-bold truncate mb-1 text-stone-200">{name || `P${i+1}`}</div>
                <div className={`text-sm font-black truncate ${balances[i] > 0 ? 'text-emerald-400' : balances[i] < 0 ? 'text-rose-500' : 'text-stone-500'}`}>
                  {balances[i] > 0 ? `+${balances[i]}` : balances[i]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Input Area */}
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-5 space-y-6">
          
          {/* 目前莊家 */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-stone-400 block mb-3 uppercase tracking-wider text-center">🚩 目前莊家</label>
              <div className="grid grid-cols-4 gap-2">
                {players.map((name, i) => (
                  <button
                    key={i}
                    onClick={() => {
                        setCurrentDealerIdx(i);
                        setComboCount(0);
                    }}
                    className={`py-3 rounded-xl font-black transition-all border-2 flex flex-col items-center justify-center ${
                        currentDealerIdx === i 
                        ? 'bg-stone-800 border-stone-900 text-stone-100 shadow-md ring-2 ring-stone-800 ring-offset-2' 
                        : 'bg-white border-stone-100 text-stone-400'
                    }`}
                  >
                    <span className="truncate w-full px-1 text-xs">{name || `P${i+1}`}</span>
                    <span className={`text-[10px] font-bold ${currentDealerIdx === i ? 'text-amber-400' : 'text-stone-300'}`}>({winds[i]})</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="w-20 shrink-0">
              <label className="text-xs font-bold text-stone-400 block mb-3 uppercase tracking-wider text-center">連莊</label>
              <div className="flex items-center">
                <button 
                    onClick={() => setComboCount(Math.max(0, comboCount - 1))}
                    className="w-7 h-11 bg-stone-100 rounded-l-xl flex items-center justify-center font-bold active:bg-stone-200"
                >-</button>
                <div className="flex-1 h-11 bg-stone-50 flex items-center justify-center font-black text-red-700 border-y-2 border-stone-100">
                    {comboCount}
                </div>
                <button 
                    onClick={() => setComboCount(comboCount + 1)}
                    className="w-7 h-11 bg-stone-100 rounded-r-xl flex items-center justify-center font-bold active:bg-stone-200"
                >+</button>
              </div>
            </div>
          </div>

          <hr className="border-stone-100" />

          {/* 贏家結算 */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-stone-400 block mb-3 uppercase tracking-wider text-center">🏆 贏家結算</label>
              <div className="grid grid-cols-4 gap-2">
                {players.map((name, i) => (
                  <button
                    key={i}
                    onClick={() => setWinnerIdx(i)}
                    className={`py-3 rounded-xl font-black transition-all border-2 flex flex-col items-center justify-center ${
                      winnerIdx === i 
                        ? 'bg-amber-500 border-amber-600 text-white shadow-md scale-105 z-10 ring-2 ring-amber-500 ring-offset-2' 
                        : 'bg-white border-stone-100 text-stone-400'
                    }`}
                  >
                    <span className="truncate w-full px-1 text-xs">{name || `P${i+1}`}</span>
                    <span className={`text-[10px] font-bold ${winnerIdx === i ? 'text-amber-100' : 'text-stone-300'}`}>({winds[i]})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsSelfDraw(true)}
                className={`py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 border-2 ${
                  isSelfDraw 
                    ? 'bg-red-700 border-red-800 text-white shadow-md' 
                    : 'bg-white border-stone-100 text-stone-400'
                }`}
              >
                自摸
              </button>
              <button
                onClick={() => setIsSelfDraw(false)}
                className={`py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 border-2 ${
                  !isSelfDraw 
                    ? 'bg-red-700 border-red-800 text-white shadow-md' 
                    : 'bg-white border-stone-100 text-stone-400'
                }`}
              >
                放槍
              </button>
            </div>

            {!isSelfDraw && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-bold text-stone-400 block mb-3 uppercase tracking-wider text-center">🎯 誰放槍？</label>
                <div className="grid grid-cols-4 gap-2">
                  {players.map((name, i) => (
                    <button
                      key={i}
                      disabled={winnerIdx === i}
                      onClick={() => setLoserIdx(i)}
                      className={`py-3 rounded-xl font-black transition-all border-2 flex flex-col items-center justify-center ${
                        winnerIdx === i ? 'opacity-20 cursor-not-allowed border-dashed' :
                        loserIdx === i 
                          ? 'bg-stone-700 border-stone-800 text-white shadow-md scale-105 ring-2 ring-stone-700 ring-offset-2' 
                          : 'bg-white border-stone-100 text-stone-400'
                      }`}
                    >
                      <span className="truncate w-full px-1 text-xs">{name || `P${i+1}`}</span>
                      <span className={`text-[10px] font-bold ${loserIdx === i ? 'text-stone-300' : 'text-stone-300'}`}>({winds[i]})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Points & Penalty Input - Unified Sizing */}
          <div className="space-y-4">
            {/* 贏牌台數 */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <label className="text-xs font-bold text-stone-400 block mb-4 uppercase tracking-wider text-center flex items-center justify-center gap-1">
                贏牌台數 <span className="text-[10px] opacity-60">(不含莊家台)</span>
              </label>
              <div className="flex items-center justify-center gap-8">
                  <button 
                      onClick={() => setPoints(Math.max(0, points - 1))}
                      className="w-12 h-12 bg-white border-2 border-stone-300 shadow-sm rounded-full flex items-center justify-center text-stone-700 active:scale-90 active:bg-stone-100 transition-all"
                  >
                      <ChevronDown size={28} strokeWidth={2.5} />
                  </button>
                  
                  <div className="relative">
                      <input
                          type="number"
                          inputMode="numeric"
                          value={points}
                          onChange={(e) => setPoints(Math.max(0, Number(e.target.value)))}
                          className="w-16 text-center text-4xl font-black text-red-700 outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <div className="absolute -right-5 bottom-1 text-xs font-bold text-stone-300">台</div>
                  </div>

                  <button 
                      onClick={() => setPoints(points + 1)}
                      className="w-12 h-12 bg-white border-2 border-stone-300 shadow-sm rounded-full flex items-center justify-center text-stone-700 active:scale-90 active:bg-stone-100 transition-all"
                  >
                      <ChevronUp size={28} strokeWidth={2.5} />
                  </button>
              </div>
            </div>

            {/* 犯規扣台 */}
            <div className="bg-rose-50/30 p-4 rounded-2xl border border-rose-100">
              <label className="text-xs font-bold text-rose-400 block mb-4 uppercase tracking-wider text-center flex items-center justify-center gap-1">
                犯規扣台 <span className="text-[10px] opacity-60">(從贏家總台數扣除)</span>
              </label>
              <div className="flex items-center justify-center gap-8">
                  <button 
                      onClick={() => setPenalty(Math.max(0, penalty - 1))}
                      className="w-12 h-12 bg-white border-2 border-rose-200 shadow-sm rounded-full flex items-center justify-center text-rose-400 active:scale-90 active:bg-rose-50 transition-all"
                  >
                      <ChevronDown size={28} strokeWidth={2.5} />
                  </button>
                  
                  <div className="relative">
                      <input
                          type="number"
                          inputMode="numeric"
                          value={penalty}
                          onChange={(e) => setPenalty(Math.max(0, Number(e.target.value)))}
                          className="w-16 text-center text-4xl font-black text-rose-500 outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <div className="absolute -right-5 bottom-1 text-xs font-bold text-rose-200">台</div>
                  </div>

                  <button 
                      onClick={() => setPenalty(penalty + 1)}
                      className="w-12 h-12 bg-white border-2 border-rose-200 shadow-sm rounded-full flex items-center justify-center text-rose-400 active:scale-90 active:bg-rose-50 transition-all"
                  >
                      <ChevronUp size={28} strokeWidth={2.5} />
                  </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleAddRound}
            className="w-full bg-amber-500 hover:bg-amber-600 text-stone-900 font-black py-5 rounded-2xl shadow-lg transition-all text-xl active:scale-[0.98] border-b-4 border-amber-700"
          >
            確認記帳
          </button>
        </div>

        {/* History List */}
        <div className="space-y-3">
          <div className="flex justify-between items-end px-2">
            <h2 className="text-stone-500 font-black flex items-center gap-2">
              <History size={18} /> 歷史紀錄
            </h2>
            <button 
              onClick={undoLastRound}
              disabled={history.length === 0}
              className="text-xs font-bold bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-stone-500 flex items-center gap-1 disabled:opacity-30 active:bg-stone-50 shadow-sm transition-all"
            >
              <RotateCcw size={14} /> 刪除上筆
            </button>
          </div>

          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="bg-stone-100/50 border-2 border-dashed border-stone-200 rounded-3xl p-10 text-center text-stone-300 font-bold">
                🧧 祝手氣大發！
              </div>
            ) : (
              history.map((round) => (
                <div key={round.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-start mb-3 border-b border-stone-50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-stone-800 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                        {round.status}
                      </span>
                      <span className="font-black text-stone-700 text-sm md:text-base">
                         {round.winner} ({round.winnerWind}) {round.type}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-400 font-bold">
                        {round.timestamp}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center px-1">
                      <div className="text-xs text-stone-500">
                        <span className="font-bold text-red-700">{round.points}</span> 
                        {round.penalty > 0 && <span className="text-rose-400 font-bold">-{round.penalty}</span>} 
                        <span className="ml-1">台</span>
                        {round.combo > 0 && <span className="ml-2 text-amber-600 font-bold">(連{round.combo})</span>}
                      </div>
                      <div className="grid grid-cols-4 gap-4 flex-1 ml-6">
                        {round.changes.map((change, i) => (
                          <div key={i} className="text-center">
                            <div className="text-[9px] text-stone-300 truncate font-bold uppercase tracking-tighter">{players[i]}</div>
                            <div className={`text-[13px] font-black ${change > 0 ? 'text-emerald-600' : change < 0 ? 'text-rose-600' : 'text-stone-200'}`}>
                              {change > 0 ? `+${change}` : change === 0 ? '0' : change}
                            </div>
                          </div>
                        ))}
                      </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer Quick Info */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 pointer-events-none">
          <div className="bg-stone-800/95 backdrop-blur text-stone-100 p-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs pointer-events-auto border border-white/10">
            <AlertCircle size={16} className="text-amber-400 shrink-0" />
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <span>底台: <span className="text-white font-bold">{baseMoney}/{pointMoney}</span></span>
                    <span className="bg-white/10 px-2 py-0.5 rounded border border-white/5">
                        莊家台: <span className="text-amber-400 font-bold">{1 + comboCount * 2}</span>
                    </span>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
