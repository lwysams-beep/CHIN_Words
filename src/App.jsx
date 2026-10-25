
import { useState, useRef, useEffect } from 'react';
import './App.css';

const words = [
  '蘋果',
  '香蕉',
  '兔子',
  '學校',
  '太陽',
  '蝴蝶',
  '朋友',
  '老師',
  '家庭',
  '快樂',
];

function cleanText(text) {
  return text.replace(/[\s，。！？、,.!?；;：:「」『』]/g, '');
}

export default function App() {
  const [index, setIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [message, setMessage] = useState('請先聽讀音，再自己讀一次。');
  const [recognized, setRecognized] = useState('');
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [result, setResult] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  const recognitionRef = useRef(null);
  const awardedRef = useRef(new Set());

  const currentWord = words[index];

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
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
      setMessage('正在聆聽，請清楚讀出詞語……');
    };

    
recognition.onresult = (event) => {
  const alternatives = Array.from(event.results[0])
    .map((item) => cleanText(item.transcript));

  const answer = alternatives[0] || '';
  setRecognized(event.results[0][0].transcript);

  const matched = alternatives.some(
    (text) => text === cleanText(currentWord)
  );

  if (matched) {
    setResult('correct');
    setMessage('🎉 答啱喇！正確！啱咗！');
    setCelebrate(true);

    window.setTimeout(() => {
      setCelebrate(false);
    }, 3000);

    speakFeedback('答啱喇！正確！啱咗！');

    const key = `${index}`;

    if (!awardedRef.current.has(key)) {
      awardedRef.current.add(key);
      setStars((value) => value + 1);
    }
  } else {
    setResult('retry');
    setMessage('唔緊要！再試多次，你一定得！');
    setCelebrate(false);

    speakFeedback('錯咗但唔緊要，再試多次！');
  }
};


    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setMessage('請在瀏覽器設定中允許使用麥克風。');
      } else if (event.error === 'no-speech') {
        setMessage('未聽到聲音，請再按一次錄音。');
      } else {
        setMessage(`語音辨識未能完成（${event.error}），請再試一次。`);
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
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

    if (cantoneseVoice) utterance.voice = cantoneseVoice;

    utterance.onstart = () => setMessage('請仔細聆聽標準讀音。');
    utterance.onend = () => setMessage('輪到你了！按「開始錄音」讀一次。');
    utterance.onerror = () => setMessage('語音播放未能完成，請再試一次。');

    window.speechSynthesis.speak(utterance);
  }

  function startRecording() {
    if (!supported || !recognitionRef.current) {
      setMessage('目前瀏覽器不支援語音識別，請改用支援的瀏覽器。');
      return;
    }

    try {
      setRecognized('');
      setResult('');
      recognitionRef.current.start();
    } catch {
      setMessage('語音功能正在準備，請稍候再按一次。');
    }
  }

  function nextWord() {
    if (listening) recognitionRef.current?.stop();

    setIndex((value) => (value + 1) % words.length);
    setRecognized('');
    setResult('');
    setMessage('請先聽讀音，再自己讀一次。');
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
            className="record-button"
            onClick={startRecording}
            disabled={listening || !supported}
          >
            {listening ? '🎙️ 正在聆聽…' : '🎙️ 開始錄音'}
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

        <button className="next-button" onClick={nextWord}>
          下一個詞語 →
        </button>
      </section>

      <footer>
        <span>慢慢讀、清楚讀，你一定會進步！</span>
      </footer>
    </main>
  );
}
