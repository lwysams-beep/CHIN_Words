
import { useState, useRef, useEffect } from 'react';
import './App.css';

const words = [
  '請教',
  '澆水',
  '曬',
  '參加',
  '派發',
  '用心',
  '興奮',
  '照料',
  '盼望',
  '翠綠',
  '健康',
  '成長',
  '廣闊',
  '奔跑',
  '後悔',
  '自私',
  '如果',
  '客氣',
  '趕走',
  '命令',
  '理會',
  '願意',
  '答應',
  '自由',
  '摔倒',
  '好心',
  '可怕',
  '表演',
  '慌忙',
  '逃走',
  '急忙',
  '扶',
  '受傷',
  '充滿',
  '掌聲',
];


function shuffleArray(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

const shuffledWords = shuffleArray(words);


const praises = ['答啱喇！', '正確！', '啱咗！'];

function cleanText(text) {
  return text.replace(/[\s，。！？、,.!?；;：:「」『』]/g, '');
}

export default function App() {
  const [index, setIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [message, setMessage] = useState('按「開始遊戲」啟動聲音及麥克風。');
  const [recognized, setRecognized] = useState('');
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState('');
  const [celebrate, setCelebrate] = useState(false);

  const recognitionRef = useRef(null);
  const indexRef = useRef(0);
  const startedRef = useRef(false);
  const replayRequestedRef = useRef(false);
  const pausedRef = useRef(false);
  const outcomeRef = useRef('');
  const feedbackRef = useRef('');
  const awardedRef = useRef(new Set());
  const timerRef = useRef(null);
  const celebrationTimerRef = useRef(null);

  const currentWord = shuffledWords[index];
  const maxCount = Math.max(correctCount, wrongCount, 1);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  function clearTimer() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function speakFeedback(text, callback) {
    if (!('speechSynthesis' in window)) {
      callback?.();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-HK';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    const voice = window.speechSynthesis.getVoices().find(
      (item) => item.lang.toLowerCase() === 'zh-hk'
    );

    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      if (!pausedRef.current) callback?.();
    };

    utterance.onerror = () => {
      if (!pausedRef.current) callback?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  function startRecording() {
    if (!startedRef.current || pausedRef.current) return;

    const recognition = recognitionRef.current;

    if (!recognition) {
      setMessage('語音識別尚未準備好，請重新整理頁面。');
      return;
    }

    try {
      outcomeRef.current = '';
      recognition.start();
    } catch {
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        if (!pausedRef.current) startRecording();
      }, 700);
    }
  }

  function speakWordAndRecord(word) {
    if (pausedRef.current || !startedRef.current) return;

    if (!('speechSynthesis' in window)) {
      startRecording();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'zh-HK';
    utterance.rate = 0.75;

    const voice = window.speechSynthesis.getVoices().find(
      (item) => item.lang.toLowerCase() === 'zh-hk'
    );

    if (voice) utterance.voice = voice;

    setMessage('請仔細聆聽詞語讀音……');

    utterance.onend = () => {
      if (!pausedRef.current) startRecording();
    };

    utterance.onerror = () => {
      if (!pausedRef.current) startRecording();
    };

    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      setMessage('此瀏覽器不支援語音識別，建議使用桌面版 Chrome。');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-HK';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setListening(true);
      setRecognized('');
      setMessage('🔴 正在錄音，請讀出詞語……');
    };

    recognition.onresult = (event) => {
      const alternatives = Array.from(event.results[0]).map(
        (item) => cleanText(item.transcript)
      );

      const target = cleanText(shuffledWords[indexRef.current]);
      const matched = alternatives.some((text) => text === target);

      setRecognized(event.results[0][0].transcript);

      if (matched) {
        const praise =
          praises[Math.floor(Math.random() * praises.length)];

        outcomeRef.current = 'correct';
        feedbackRef.current = praise;

        setCorrectCount((value) => value + 1);
        setResult('correct');
        setMessage(`🎉 ${praise}`);
        setCelebrate(true);

        window.clearTimeout(celebrationTimerRef.current);
        celebrationTimerRef.current = window.setTimeout(() => {
          setCelebrate(false);
        }, 2000);

        const key = String(indexRef.current);

        if (!awardedRef.current.has(key)) {
          awardedRef.current.add(key);
          setStars((value) => value + 1);
        }
      } else {
        outcomeRef.current = 'wrong';
        feedbackRef.current = '錯咗但唔緊要，再試多次！';

        setWrongCount((value) => value + 1);
        setResult('retry');
        setMessage('唔緊要！再試多次，你一定得！');
        setCelebrate(false);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted') return;

      if (event.error === 'not-allowed') {
        outcomeRef.current = 'permission-error';
        setMessage('請允許瀏覽器使用麥克風。');
      } else if (event.error === 'no-speech') {
        outcomeRef.current = 'retry';
        setMessage('未聽到聲音，準備重新錄音……');
      } else {
        outcomeRef.current = 'retry';
        setMessage('語音辨識未能完成，準備再試……');
      }
    };

    recognition.onend = () => {
      setListening(false);
      
if (replayRequestedRef.current) {
  replayRequestedRef.current = false;

  if (!pausedRef.current && startedRef.current) {
    speakWordAndRecord(shuffledWords[indexRef.current]);
  }

  return;
}


      const outcome = outcomeRef.current;
      outcomeRef.current = '';

      if (pausedRef.current || !startedRef.current) return;

      if (outcome === 'permission-error') return;

      

      if (outcome === 'correct') {
        speakFeedback(feedbackRef.current, () => {
          if (pausedRef.current) return;
      
          const nextIndex = (indexRef.current + 1) % shuffledWords.length;
      
          indexRef.current = nextIndex;
          setIndex(nextIndex);
          setRecognized('');
          setResult('');
          setMessage('🔴 正在準備錄音……');
      
          timerRef.current = window.setTimeout(() => {
            if (!pausedRef.current) {
              startRecording();
            }
          }, 200);
        });
      }
      

      
      else if (outcome === 'wrong' || outcome === 'retry') {
        const feedback =
          outcome === 'wrong'
            ? feedbackRef.current
            : '再試多次，你一定得！';

        speakFeedback(feedback, () => {
          timerRef.current = window.setTimeout(() => {
            if (!pausedRef.current) startRecording();
          }, 300);
        });
      }
    };

    recognitionRef.current = recognition;

    return () => {
      clearTimer();
      window.clearTimeout(celebrationTimerRef.current);
      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  
function beginGame() {
  if (!supported) return;

  startedRef.current = true;
  pausedRef.current = false;
  setStarted(true);
  setPaused(false);
  setMessage('🔴 正在準備錄音……');

  startRecording();
}


  

function replayWord() {
  if (!startedRef.current || pausedRef.current) return;

  clearTimer();
  outcomeRef.current = '';
  window.speechSynthesis?.cancel();

  const recognition = recognitionRef.current;

  if (listening && recognition) {
    replayRequestedRef.current = true;

    try {
      recognition.stop();
      setMessage('準備重聽詞語……');
    } catch {
      replayRequestedRef.current = false;
      setListening(false);
      speakWordAndRecord(shuffledWords[indexRef.current]);
    }
  } else {
    speakWordAndRecord(shuffledWords[indexRef.current]);
  }
}



  function togglePause() {
    if (!startedRef.current) return;

    if (!pausedRef.current) {
      pausedRef.current = true;
      setPaused(true);
      clearTimer();
      window.speechSynthesis?.cancel();
      outcomeRef.current = '';
      recognitionRef.current?.abort();
      setListening(false);
      setMessage('⏸️ 已暫停，按「繼續」恢復練習。');
    } else {
      pausedRef.current = false;
      setPaused(false);
      setMessage('繼續練習……');
      speakWordAndRecord(words[indexRef.current]);
    }
  }

  return (
    <main className="app">
      
{celebrate && (
  <div className="fireworks-layer" aria-hidden="true">
    {[20, 50, 80].map((position, burstIndex) => (
      <div
        className="firework-burst"
        key={burstIndex}
        style={{
          left: `${position}%`,
          top: `${30 + (burstIndex % 2) * 15}%`,
        }}
      >
        {Array.from({ length: 24 }, (_, i) => (
          <span
            className="firework-particle"
            key={i}
            style={{
              "--angle": `${i * 15}deg`,
              "--hue": `${(i * 37 + burstIndex * 80) % 360}`,
              animationDelay: `${burstIndex * 0.18}s`,
            }}
          />
        ))}
      </div>
    ))}
  </div>
)}


      <header className="header">
        <div>
          <p className="subtitle">廣東話朗讀練習</p>
          <h1>識字大冒險</h1>
        </div>
        <div className="star-count">⭐ {stars}</div>
      </header>

      <div className="progress">
        第 {index + 1} 個詞語，共 {words.length} 個
      </div>

      {!started ? (
        <section className="reading-card start-card">
          <div className="word">{currentWord}</div>
          <p className="feedback">
            首次使用請按下方按鈕，啟動語音及麥克風。
          </p>
          <button
            className="start-button"
            onClick={beginGame}
            disabled={!supported}
          >
            🔊 開始遊戲（啟動聲音）
          </button>
        </section>
      ) : (
        <div className="game-layout">
          <section className="reading-card">

            <div className="word" key={currentWord}>
              {currentWord}
            </div>

            <div className="buttons">
              <button
                className="listen-button"
                onClick={replayWord}
                disabled={paused}
              >
                🔊 重聽讀音
              </button>

              <button
                className={`record-button ${listening ? 'recording' : ''}`}
                onClick={() => {
                  if (listening) {
                    setMessage('正在辨識你的讀音……');
                    recognitionRef.current?.stop();
                  }
                }}
                disabled={!supported || !listening || paused}
              >
                ⏹️ 停止錄音
              </button>
            </div>

            <button
              className="pause-button"
              onClick={togglePause}
            >
              {paused ? '▶️ 繼續練習' : '⏸️ 暫停練習'}
            </button>

            {!supported && (
              <p className="warning">
                請使用支援語音識別的桌面版 Chrome。
              </p>
            )}

            <div className={`feedback ${result}`} aria-live="polite">
              {message}
            </div>

            {recognized && (
              <div className="recognized">
                <p>系統聽到你讀：</p>
                <strong>{recognized}</strong>
              </div>
            )}
          </section>

          <aside className="stats-panel">
            <h2>答題統計</h2>
            <p className="stats-subtitle">即時更新</p>

            <div className="bar-chart">
              <div className="bar-column">
                <strong className="bar-number">{correctCount}</strong>
                <div className="bar-track">
                  <div
                    className="bar-fill correct-bar"
                    style={{
                      height: `${(correctCount / maxCount) * 100}%`,
                    }}
                  />
                </div>
                <span className="bar-label">答對</span>
              </div>

              <div className="bar-column">
                <strong className="bar-number">{wrongCount}</strong>
                <div className="bar-track">
                  <div
                    className="bar-fill wrong-bar"
                    style={{
                      height: `${(wrongCount / maxCount) * 100}%`,
                    }}
                  />
                </div>
                <span className="bar-label">答錯</span>
              </div>
            </div>

            <p className="stats-note">
              綠色：答對次數
              <br />
              紅色：答錯次數
            </p>
          </aside>
        </div>
      )}

      <footer>
        <span>慢慢讀、清楚讀，你一定會進步！</span>
      </footer>
    </main>
  );
}
