
import React, { useState, useEffect } from 'react';
import { QuizCategory, QuizQuestion, QuizResult } from '../types';
import { generateQuizQuestions } from '../services/geminiService';
import { Play, CheckCircle, XCircle, Clock, BookOpen, ChevronDown, ChevronUp, Trophy, RotateCcw } from 'lucide-react';

const CATEGORIES: QuizCategory[] = ['Farmasi Klinis', 'Farmasi Industri', 'Manajemen Farmasi'];
const TIME_PER_QUESTION = 60; // seconds

export const Farmaquiz: React.FC = () => {
  const [status, setStatus] = useState<'MENU' | 'LOADING' | 'QUIZ' | 'RESULT'>('MENU');
  const [category, setCategory] = useState<QuizCategory>('Farmasi Klinis');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  
  // Quiz State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [score, setScore] = useState(0);

  // Expanded explanations in Result view
  const [expandedReview, setExpandedReview] = useState<number | null>(null);

  // Timer Effect
  useEffect(() => {
    let timer: any;
    if (status === 'QUIZ' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (status === 'QUIZ' && timeLeft === 0) {
      handleNextQuestion(-1); // Auto-skip if timeout (-1 means no answer/wrong)
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  const startQuiz = async (cat: QuizCategory) => {
    setCategory(cat);
    setStatus('LOADING');
    try {
      const q = await generateQuizQuestions(cat);
      setQuestions(q);
      setCurrentQIndex(0);
      setUserAnswers([]);
      setTimeLeft(TIME_PER_QUESTION);
      setStatus('QUIZ');
    } catch (e) {
      alert("Gagal membuat soal. Mohon cek koneksi atau coba lagi.");
      setStatus('MENU');
    }
  };

  const handleNextQuestion = (answerIndex: number) => {
    // Record answer
    const newAnswers = [...userAnswers, answerIndex];
    setUserAnswers(newAnswers);

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setTimeLeft(TIME_PER_QUESTION);
    } else {
      finishQuiz(newAnswers);
    }
  };

  const finishQuiz = (finalAnswers: number[]) => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (q.correctAnswer === finalAnswers[idx]) correct++;
    });
    setScore(Math.round((correct / questions.length) * 100));
    setStatus('RESULT');
  };

  const toggleReview = (idx: number) => {
    setExpandedReview(expandedReview === idx ? null : idx);
  };

  // --- RENDERERS ---

  if (status === 'MENU') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100">Farmaquiz Interaktif</h1>
          <p className="text-slate-500 dark:text-slate-400">Asah kompetensi apoteker dengan latihan soal berbasis AI Standard UKAI.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => startQuiz(cat)}
              className="group relative overflow-hidden glass-panel p-6 rounded-2xl hover:shadow-lg transition-all text-left border border-slate-200 dark:border-slate-700 hover:border-primary/50"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BookOpen size={64} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{cat}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                20 Soal Pilihan Ganda<br/>
                Waktu: 1 Menit/Soal<br/>
                Pembahasan Mendalam
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                Mulai Latihan <Play size={14} />
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (status === 'LOADING') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <h2 className="text-xl font-medium text-slate-700 dark:text-slate-200">Menyiapkan Bank Soal...</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">AI sedang menyusun kasus klinis dan referensi UKAI.</p>
      </div>
    );
  }

  if (status === 'QUIZ') {
    const currentQ = questions[currentQIndex];
    const progress = ((currentQIndex + 1) / questions.length) * 100;
    
    return (
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{category}</span>
            <span className="text-lg font-semibold text-slate-800 dark:text-white">
              Soal {currentQIndex + 1} <span className="text-slate-400 font-normal text-sm">/ {questions.length}</span>
            </span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${timeLeft < 10 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-700'} dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200`}>
            <Clock size={16} />
            <span className="font-mono font-bold">{timeLeft}s</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mb-8">
          <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>

        {/* Question Card */}
        <div className="glass-panel p-8 rounded-2xl mb-6">
          <p className="text-lg text-slate-800 dark:text-slate-100 leading-relaxed font-medium mb-8">
            {currentQ.question}
          </p>

          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleNextQuestion(idx)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-primary/5 hover:border-primary/50 dark:hover:bg-slate-700 transition-all flex items-start gap-3 group"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-slate-700 dark:text-slate-300 text-sm mt-0.5">{opt.replace(/^[A-D]\.\s*/, '')}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'RESULT') {
    const correctCount = userAnswers.filter((ans, idx) => ans === questions[idx].correctAnswer).length;

    return (
      <div className="max-w-4xl mx-auto pb-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/20 mb-4">
            <div className="text-center">
              <span className="block text-3xl font-bold">{score}</span>
              <span className="text-[10px] opacity-80 uppercase tracking-widest">Skor</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Quiz Selesai!</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Benar {correctCount} dari {questions.length} soal
          </p>
          
          <button 
            onClick={() => setStatus('MENU')}
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-full font-medium text-sm hover:bg-slate-900 transition-colors"
          >
            <RotateCcw size={16} /> Kembali ke Menu
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white px-2">Pembahasan & Referensi</h3>
          
          {questions.map((q, idx) => {
            const isCorrect = userAnswers[idx] === q.correctAnswer;
            const isOpen = expandedReview === idx;

            return (
              <div key={q.id} className={`glass-panel rounded-xl overflow-hidden border transition-all ${isCorrect ? 'border-green-200 dark:border-green-900/30' : 'border-red-200 dark:border-red-900/30'}`}>
                <button 
                  onClick={() => toggleReview(idx)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'}`}>
                      {isCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{q.question}</h4>
                      <p className={`text-xs mt-0.5 ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {isCorrect ? 'Jawaban Benar' : 'Jawaban Salah'}
                      </p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>

                {isOpen && (
                  <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-900/20 text-sm">
                    <p className="text-slate-700 dark:text-slate-300 mb-4 font-medium">{q.question}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                         <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Jawaban Kamu</span>
                         <span className={`font-medium ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                           {userAnswers[idx] === -1 ? 'Tidak Menjawab' : q.options[userAnswers[idx]]}
                         </span>
                      </div>
                      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                         <span className="block text-xs font-bold text-green-600/70 dark:text-green-400/70 uppercase mb-1">Kunci Jawaban</span>
                         <span className="font-bold text-green-700 dark:text-green-400">
                           {q.options[q.correctAnswer]}
                         </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2 mb-2">
                           <Trophy size={14} className="text-amber-500" /> Pembahasan Analitis
                        </h5>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-justify">
                          {q.explanation}
                        </p>
                      </div>
                      
                      <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
                        <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2 mb-1">
                           <BookOpen size={14} /> Referensi Valid
                        </h5>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                          {q.reference}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};
