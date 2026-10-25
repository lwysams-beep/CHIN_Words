
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
  '容氣',
  '趕走',
  '命令',
  '理會',
  '願意',
  '答應',
  '自由',
  '戴',
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

const praises = ['答啱喇！', '正確！', '啱咗！'];

function cleanText(text) {
  return text.replace(/[\s，。！？、,.!?；;：:「」『』]/g, '');
}

export default function App() {
  const [index, setIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [message, setMessage] = useState('準備錄音……');
  const [recognized, setRecognized] = useState('');
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [result, setResult] = useState('');
  const [celebrate, setCelebrate] = useState(false);

  const recognitionRef = useRef(null);
  const awardedRef = useRef(new Set());
  const retryTimerRef = useRef(null);
  const nextTimerRef = useRef(null);
  const shouldRetryRef = useRef(false);
  const shouldAdvanceRef = useRef(false);

  const currentWord = words[index];

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      setMessage('這個瀏覽器不支援語音識別，請嘗試使用桌面版 Chrome。');
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
      setResult('');
      setMessage('🔴 正在錄音，請清楚讀出詞語……');
    };

    recognition.onresult = (event) => {
      const alternatives = Array.from(event.results[0]).map((item) =>
        cleanText(item.transcript)
      );

      setRecognized(event.results[0][0].transcript);

      const matched = alternatives.some(
        (text) => text === cleanText(currentWord)
      );

      if (matched) {
        const praise =
          praises[Math.floor(Math.random() * praises.length)];

        setResult('correct');
        setMessage(`🎉 ${praise}`);
        setCelebrate(true);

        window.setTimeout(() => {
          setCelebrate(false);
        }, 3000);

        speakFeedback(praise);

        const key = `${index}`;

        shouldRetryRef.current = false;
        shouldAdvanceRef.current = true;

        nextTimerRef.current = window.setTimeout(() => {
          setIndex((value) => (value + 1) % words.length);
        }, 1800);

        if (!awardedRef.current.has(key)) {
          awardedRef.current.add(key);
          setStars((value) => value + 1);
        }
      } else {
        setResult('retry');
        setMessage('唔緊要！再試多次，你一定得！');
        setCelebrate(false);

        speakFeedback('錯咗但唔緊要，再試多次！');
        shouldAdvanceRef.current = false;
        shouldRetryRef.current = true;
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setMessage('請允許瀏覽器使用麥克風，然後重新開始。');
      } else if (event.error === 'no-speech') {
        setMessage('未聽到聲音，請按「下一個詞語」再試。');
      } else if (event.error !== 'aborted') {
        setMessage(`語音辨識未能完成（${event.error}），請再試一次。`);
      }
    };

    recognition.onend = () => {
      setListening(false);
    
      if (shouldAdvanceRef.current) {
        shouldAdvanceRef.current = false;
        return;
      }
    
      if (shouldRetryRef.current) {
        shouldRetryRef.current = false;
    
        retryTimerRef.current = window.setTimeout(() => {
          try {
            recognition.start();
          } catch {
            setMessage('請稍候，再重新開始錄音。');
            shouldRetryRef.current = true;
          }
        }, 800);
      }
    };

    recognitionRef.current = recognition;

    // 每次進入詞語畫面，自動開始錄音
    const autoStartTimer = window.setTimeout(() => {
      try {
        recognition.start();
      } catch {
        setMessage('未能自動開始錄音，請按「下一個詞語」再試。');
      }
    }, 400);

    return () => {
      window.clearTimeout(retryTimerRef.current);
window.clearTimeout(nextTimerRef.current);

shouldRetryRef.current = false;
shouldAdvanceRef.current = false;
      window.clearTimeout(autoStartTimer);
      recognition.abort();

      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };
  }, [currentWord, index]);

  function speakFeedback(text) {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-HK';
    utterance.rate = 0.9;
    utterance.pitch = 1.15;

    const voices = window.speechSynthesis.getVoices();
    const cantoneseVoice = voices.find(
      (voice) => voice.lang.toLowerCase() === 'zh-hk'
    );

    if (cantoneseVoice) {
      utterance.voice = cantoneseVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  function speakWord() {
    if (!('speechSynthesis' in window)) {
      setMessage('這個瀏覽器暫時不支援語音播放。');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(currentWord);
    utterance.lang = 'zh-HK';
    utterance.rate = 0.75;

    const voices = window.speechSynthesis.getVoices();
    const cantoneseVoice = voices.find(
      (voice) => voice.lang.toLowerCase() === 'zh-hk'
    );

    if (cantoneseVoice) {
      utterance.voice = cantoneseVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  
function stopRecording() {
  const recognition = recognitionRef.current;

  if (!recognition || !listening) return;

  setMessage('正在辨識你的讀音，請稍候……');

  try {
    recognition.stop();
  } catch (error) {
    setMessage('停止錄音時出現問題，請再試一次。');
  }
}


  function nextWord() {
    recognitionRef.current?.abort();
    setListening(false);
    setRecognized('');
    setResult('');
    setCelebrate(false);
    setMessage('準備錄音……');

    window.speechSynthesis?.cancel();

    setIndex((value) => (value + 1) % words.length);
  }

  return (
    <main className="app">
      {celebrate && (
        <div className="confetti-layer" aria-hidden="true">
          {Array.from({ length: 70 }, (_, i) => (
            <span
              className="confetti"
              key={i}
              style={{
                left: `${(i * 37) % 100}%`,
                animationDelay: `${(i % 10) * 0.08}s`,
                animationDuration: `${1.8 + (i % 8) * 0.2}s`,
                '--drift': `${((i * 17) % 160) - 80}px`,
                '--spin': `${360 + (i % 5) * 360}deg`,
              }}
            />
          ))}
        </div>
      )}

      <header className="header">
        <div>
          <p className="subtitle">廣東話朗讀練習</p>
          <h1>識字大冒險</h1>
        </div>

        <div className="star-count" aria-label={`已獲得 ${stars} 顆星星`}>
          ⭐ {stars}
        </div>
      </header>

      <div className="progress">
        第 {index + 1} 個詞語，共 {words.length} 個
      </div>

      <section className="reading-card">
        <p className="instruction">請讀出以下詞語</p>

        <div className="word" key={currentWord}>
          {currentWord}
        </div>

        <div className="buttons">
          <button className="listen-button" onClick={speakWord}>
            🔊 聽讀音
          </button>

          <button
            className={`record-button ${listening ? 'recording' : ''}`}
            onClick={stopRecording}
            disabled={!supported || !listening}
          >
            ⏹️ 停止錄音
          </button>
        </div>

        {!supported && (
          <p className="warning">
            這個瀏覽器不支援內置語音識別，請嘗試使用桌面版 Chrome。
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

      <footer>
        <span>慢慢讀、清楚讀，你一定會進步！</span>
      </footer>
    </main>
  );
}
