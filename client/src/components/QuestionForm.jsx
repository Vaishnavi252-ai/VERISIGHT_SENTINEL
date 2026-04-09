import React, { useEffect, useState } from "react";
import { FaInstagram, FaFacebook, FaXTwitter, FaWhatsapp, FaTiktok, FaSnapchat, FaYoutube, FaTelegram } from 'react-icons/fa6';
import { Globe } from 'lucide-react';

export default function ReportQuestionSlider({ detectionId, mediaType, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [currentError, setCurrentError] = useState('');
  const [showPlatformSelector, setShowPlatformSelector] = useState(false);
  const [platform, setPlatform] = useState('');
  const [customPlatform, setCustomPlatform] = useState('');
  const [showCountryInput, setShowCountryInput] = useState(false);
  const [country, setCountry] = useState('');
  const normalizedMediaType = (() => {
    const mt = (mediaType || '').toLowerCase();
    if (['text', 'url', 'file'].includes(mt)) return mt;
    if (['document', 'doc', 'txt'].includes(mt)) return 'file';
    return mt;
  })();
  const isTextPipeline = ['text', 'url', 'file'].includes(normalizedMediaType);

  useEffect(() => {
    setLoadingQuestions(true);
    setLoadError(null);
    setStatus("idle");
    setCurrent(0);
    setAnswers({});
    setCurrentError('');
    setEmail("");
    setQuestions([]);
    setPlatform("");
    setCustomPlatform("");
    setCountry("");
    setShowPlatformSelector(false);
    setShowCountryInput(false);

    const source = isTextPipeline ? `/api/reports/questions/type/${normalizedMediaType}` : `/api/reports/questions/${detectionId}`;
    fetch(source)
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setQuestions(data.questions);
          if (!isTextPipeline && Array.isArray(data.questions) && data.questions.length > 0) {
            setShowPlatformSelector(true);
          }
        } else {
          setLoadError(data.error || "Unable to load questions");
        }
      })
      .catch(err => setLoadError(err.message || "Unable to load questions"))
      .finally(() => {
        setLoadingQuestions(false);
      });
  }, [detectionId, isTextPipeline, mediaType]);

  const q = questions[current] || { question: '', type: 'long' };
  const progress = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;

  if (loadingQuestions) {
    return (
      <div className="w-full bg-white/5 rounded-xl p-6 border border-cyan-500/10 text-center">
        <div className="animate-pulse text-cyan-300">🤖 Generating questions…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full bg-yellow-900/10 rounded-xl p-6 border border-yellow-800/20">
        <h3 className="text-lg font-semibold text-yellow-200">Unable to load questions</h3>
        <p className="text-sm text-yellow-300 mt-2">{loadError}</p>
        <div className="mt-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-yellow-800/60 rounded-md text-yellow-100"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (status === "submitted") {
    return (
      <div className="w-full bg-white/5 border border-green-500/30 rounded-2xl p-8 text-center">
        <h2 className="text-green-400 text-2xl mb-3">✔ Report Submitted Successfully</h2>
        <p className="text-gray-400">Your report has been securely forwarded and a confirmation email has been sent to your inbox.</p>
        <button
          onClick={onClose}
          className="mt-6 px-6 py-2 bg-purple-600 rounded-lg text-white"
        >
          Close
        </button>
      </div>
    );
  }


  if (showPlatformSelector && !loadingQuestions && !loadError) {
    const platforms = [
      { name: 'Instagram', icon: FaInstagram, color: '#E4405F' },
      { name: 'Facebook', icon: FaFacebook, color: '#1877F2' },
      { name: 'Twitter', icon: FaXTwitter, color: '#000000' },
      { name: 'WhatsApp', icon: FaWhatsapp, color: '#25D366' },
      { name: 'TikTok', icon: FaTiktok, color: '#000000' },
      { name: 'Snapchat', icon: FaSnapchat, color: '#FFFC00' },
      { name: 'YouTube', icon: FaYoutube, color: '#FF0000' },
      { name: 'Telegram', icon: FaTelegram, color: '#0088CC' },
      { name: 'Other', icon: Globe, color: '#9ca3af' },
    ];

    return (
      <div className="w-full max-w-4xl mx-auto bg-white/5 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 shadow-lg shadow-cyan-500/10">
        <h2 className="text-2xl font-bold text-white mb-2">Where did you find this content?</h2>
        <p className="text-sm text-gray-400 mb-6">Select the platform where you encountered this deepfake</p>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-6">
          {platforms.map((p) => {
            const Icon = p.icon;
            const isSelected = platform === p.name;
            return (
              <button
                key={p.name}
                onClick={() => {
                  setPlatform(p.name);
                  if (p.name !== 'Other') setCustomPlatform('');
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10 scale-105'
                    : 'border-white/10 bg-white/5 hover:border-cyan-500/50 hover:bg-white/10'
                }`}
              >
                <Icon 
                  className="w-8 h-8" 
                  style={{ color: isSelected ? '#06b6d4' : p.color }}
                />
                <span className={`text-xs font-medium ${isSelected ? 'text-cyan-400' : 'text-gray-300'}`}>
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>

        {platform === 'Other' && (
          <div className="mb-6">
            <label className="block text-sm text-gray-300 mb-2">Platform Name</label>
            <input
              type="text"
              placeholder="Enter platform name..."
              className="w-full bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:border-cyan-400"
              value={customPlatform}
              onChange={(e) => setCustomPlatform(e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!platform) {
                alert('Please select a platform');
                return;
              }
              if (platform === 'Other' && !customPlatform.trim()) {
                alert('Please enter the platform name');
                return;
              }
              setShowPlatformSelector(false);
              setShowCountryInput(true);
            }}
            disabled={!platform || (platform === 'Other' && !customPlatform.trim())}
            className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // Country input UI
  if (showCountryInput && !loadingQuestions && !loadError) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white/5 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 shadow-lg shadow-cyan-500/10">
        <h2 className="text-2xl font-bold text-white mb-2">What is the location?</h2>
        <p className="text-sm text-gray-400 mb-6">Please enter your country to help us track global deepfake patterns</p>
        
        <div className="mb-6">
          <label className="block text-sm text-gray-300 mb-2">Country Name</label>
          <input
            type="text"
            placeholder="e.g., United States, India, United Kingdom..."
            className="w-full bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:border-cyan-400"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-2">This helps us understand where deepfakes are spreading</p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setShowCountryInput(false);
              setShowPlatformSelector(true);
            }}
            className="px-6 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-white/5"
          >
            ← Back
          </button>
          <button
            onClick={() => {
              if (!country.trim()) {
                alert('Please enter your country');
                return;
              }
              setShowCountryInput(false);
            }}
            disabled={!country.trim()}
            className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full max-w-3xl bg-white/5 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 shadow-lg shadow-cyan-500/10 mx-auto">

        {/* 🔄 Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-gray-400">🧠 Question {current + 1} / {questions.length}</div>
            <div className="text-xs text-gray-400">{Math.round(progress)}%</div>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 🎯 Context + Severity */}
        <div className="flex gap-3 mb-4">
          {q.context && (
            <span className="px-3 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300">
              🎥 {q.context.toUpperCase()}
            </span>
          )}
          {q.severity && (
            <span className={`px-3 py-1 text-xs rounded-full animate-pulse
              ${q.severity === "High"
                ? "bg-red-500/20 text-red-400"
                : "bg-yellow-500/20 text-yellow-300"}`}>
              ⚠ {q.severity} Risk
            </span>
          )}
        </div>

        {/* 🧠 Question */}
        <h3 className="text-white text-lg font-semibold mb-2">
          {q.question} <span className="text-red-400 font-bold">*</span>
        </h3>

        {/* 💡 Why */}
        {q.why && (
          <p className="text-sm text-gray-400 mb-3">{q.why}</p>
        )}

        {/* ✍️ Answer Input (ALWAYS PRESENT) */}
        <div className="mt-2">
          {q.type === "yesno" ? (
            <div className="flex gap-4 flex-wrap">
              {["Yes", "No"].map(v => (
                <button
                  key={v}
                  onClick={() => {
                    setAnswers({ ...answers, [current]: v });
                    setCurrentError('');
                  }}
                  className={`px-5 py-2 rounded-lg border transition text-sm
                    ${answers[current] === v
                      ? "bg-purple-600 text-white border-purple-500"
                      : "border-gray-600 text-gray-300 hover:border-purple-400"}`}
                >
                  {v}
                </button>
              ))}
              <button
                onClick={() => {
                  setAnswers({ ...answers, [current]: "Don't know" });
                  setCurrentError('');
                }}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 text-sm"
              >
                🤷 Skip
              </button>
            </div>
          ) : (q.type === "choice" || q.type === "mcq") && q.options ? (
            <div className="grid gap-3">
              {q.options.map(option => (
                <button
                  key={option}
                  onClick={() => {
                    setAnswers({ ...answers, [current]: option });
                    setCurrentError('');
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                    answers[current] === option
                      ? 'bg-purple-600/30 text-purple-100 border-purple-500'
                      : 'border-gray-600 text-gray-300 hover:border-purple-400 hover:bg-white/5'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              rows={4}
              placeholder="Describe your observation..."
              className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-gray-200 focus:outline-none transition-all duration-200
                ${currentError ? 'border-red-400 ring-2 ring-red-400/30 animate-shake' : 'border-cyan-500/20 focus:border-cyan-400'}`}
              value={answers[current] || ""}
              onChange={e => {
                setAnswers({ ...answers, [current]: e.target.value });
                if (currentError) setCurrentError('');
              }}
            />
          )}
        </div>

        {currentError && (
          <p className="text-red-400 text-sm mt-2 animate-pulse">{currentError}</p>
        )}

        {/* � Country + Email for text/url/file reporting */}
        {current === questions.length - 1 && (
          <>
            {isTextPipeline && (
              <div className="mt-4">
                <label className="block text-sm text-gray-300 mb-2">
                  Country <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., United States, India, United Kingdom..."
                  className="w-full bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:border-cyan-400"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-2">Required for tracking where suspicious text or documents are being reported.</p>
              </div>
            )}
            <div className="mt-4">
              <label className="block text-sm text-gray-300 mb-2">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="your.email@example.com"
                className="w-full bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:border-cyan-400"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-2">Required for receiving updates and PDF report on your submission</p>
            </div>
          </>
        )}

        {/* 🔄 Navigation */}
        <div className="flex justify-between mt-6">
          <button
            disabled={current === 0}
            onClick={() => setCurrent(c => c - 1)}
            className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 disabled:opacity-40 text-sm"
          >
            ← Back
          </button>

          {current < questions.length - 1 ? (
            <button
              onClick={() => {
                const answer = answers[current];
                if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
                  setCurrentError('Please answer this required question');
                  return;
                }
                setCurrentError('');
                setCurrent(c => c + 1);
              }}
              disabled={!answers[current] || (typeof answers[current] === 'string' && answers[current].trim() === '')}
              className={`px-5 py-2 rounded-lg text-white text-sm transition-all ${(!answers[current] || (typeof answers[current] === 'string' && answers[current].trim() === '')) ? 'bg-purple-700/50 opacity-50 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={async () => {
                // Validate all dynamic questions answered
                for (let i = 0; i < questions.length; i++) {
                  const ans = answers[i];
                  if (!ans || (typeof ans === 'string' && ans.trim() === '')) {
                    alert(`Please answer question ${i + 1}: "${questions[i].question.substring(0, 50)}..."`);
                    setCurrent(i); // Jump to first empty
                    setCurrentError('Please answer this required question');
                    return;
                  }
                }

                // Validate country for text/url/file submissions
                if (isTextPipeline && (!country || !country.trim())) {
                  alert('Please provide your country before submitting the report');
                  return;
                }
                // Validate email is provided
                if (!email || !email.trim()) {
                  alert('Please provide your email address to submit the report');
                  return;
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  alert('Please provide a valid email address');
                  return;
                }

                // Prepare payload
                const finalPlatform = platform === 'Other' ? customPlatform : platform;
                const payload = {
                  detection_id: detectionId,
                  type: normalizedMediaType,
                  platform: finalPlatform || null,
                  country: country || null,
                  reporter_email: email,
                  answers: questions.map((qq, i) => ({ question: qq.question, answer: answers[i] || null }))
                };

                setStatus('submitting');
                try {
                  const res = await fetch('/api/reports/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  const j = await res.json();
                  if (j.status === 'success') {
                    setStatus('submitted');
                    // Show confirmation about email if it was attempted
                    if (j.email_sent === false) {
                      setTimeout(() => {
                        alert('Report submitted successfully, but we couldn\'t send the confirmation email. Please check your email later.');
                      }, 1000);
                    }
                  } else {
                    alert(j.error || 'Submit failed');
                    setStatus('idle');
                  }
                } catch (e) {
                  alert('Submit failed: ' + e.message);
                  setStatus('idle');
                }
              }}
              disabled={!email || !email.trim() || status === 'submitting'}
              className="px-5 py-2 rounded-lg bg-green-600 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? 'Submitting...' : 'Submit Report 🚀'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
