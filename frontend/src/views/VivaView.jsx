import { AnimatePresence, motion } from 'framer-motion';
import { CircleCheck, CircleX, Eye, EyeOff, RotateCcw, Trophy } from 'lucide-react';
import { useState } from 'react';
import Button from '../components/Button';
import Segmented from '../components/Segmented';
import { QUIZ, VIVA_QUESTIONS } from '../content/viva';

function QuestionCard({ item, index, graph, open, onToggle }) {
  const extra = graph ? item.live?.(graph) : null;
  const answerId = `viva-answer-${item.id}`;
  return (
    <li className={`card viva-card ${open ? 'open' : ''}`}>
      <div className="viva-q">
        <span className="viva-num">Q{index + 1}</span>
        <h3>{item.q}</h3>
        <Button
          variant="ghost"
          size="sm"
          icon={open ? EyeOff : Eye}
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={answerId}
        >
          {open ? 'Hide answer' : 'Show answer'}
        </Button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={answerId}
            className="viva-a"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <p>{item.a}</p>
            {extra && <p className="viva-live">In this project: {extra}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function Questions({ graph }) {
  const [open, setOpen] = useState(() => new Set());
  const allOpen = open.size === VIVA_QUESTIONS.length;
  const toggle = (id) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <div className="viva-toolbar">
        <span className="muted small">
          {VIVA_QUESTIONS.length} questions · try to answer aloud before revealing
        </span>
        <Button
          variant="secondary"
          size="sm"
          icon={allOpen ? EyeOff : Eye}
          onClick={() => setOpen(allOpen ? new Set() : new Set(VIVA_QUESTIONS.map((q) => q.id)))}
        >
          {allOpen ? 'Hide all answers' : 'Show all answers'}
        </Button>
      </div>
      <ol className="viva-list">
        {VIVA_QUESTIONS.map((item, i) => (
          <QuestionCard key={item.id} item={item} index={i} graph={graph} open={open.has(item.id)} onToggle={() => toggle(item.id)} />
        ))}
      </ol>
    </>
  );
}

function Quiz() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const finished = index >= QUIZ.length;

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
  };

  if (finished) {
    const ratio = score / QUIZ.length;
    return (
      <motion.div className="card quiz-card quiz-done" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
        <Trophy size={36} aria-hidden="true" />
        <h2>
          You scored {score} / {QUIZ.length}
        </h2>
        <p className="muted">
          {ratio === 1
            ? 'Perfect. You are ready for the viva.'
            : ratio >= 0.7
              ? 'Well done. Review the questions you missed in the Questions tab.'
              : 'Keep practicing: the How It Works page walks through every idea.'}
        </p>
        <Button icon={RotateCcw} onClick={restart}>
          Try again
        </Button>
      </motion.div>
    );
  }

  const item = QUIZ[index];
  const answered = picked !== null;

  return (
    <div className="card quiz-card">
      <div className="card-title-row">
        <span className="step-counter">
          Question {index + 1} / {QUIZ.length}
        </span>
        <span className="pill">Score {score}</span>
      </div>
      <div className="progress thin" role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={QUIZ.length} aria-valuenow={index}>
        <motion.div className="progress-fill" animate={{ width: `${(index / QUIZ.length) * 100}%` }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={index} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
          <h2 className="quiz-q">{item.q}</h2>
          <div className="quiz-options" role="group" aria-label="Answer options">
            {item.options.map((option, i) => {
              const state = !answered ? '' : i === item.answer ? 'correct' : i === picked ? 'wrong' : 'dim';
              return (
                <button
                  key={option}
                  type="button"
                  className={`quiz-option ${state}`}
                  disabled={answered}
                  aria-pressed={picked === i}
                  onClick={() => {
                    setPicked(i);
                    if (i === item.answer) setScore((s) => s + 1);
                  }}
                >
                  <span className="quiz-letter">{String.fromCharCode(65 + i)}</span>
                  {option}
                  {state === 'correct' && <CircleCheck size={18} aria-label="correct answer" />}
                  {state === 'wrong' && <CircleX size={18} aria-label="your answer, incorrect" />}
                </button>
              );
            })}
          </div>
          {answered && (
            <motion.p className={`quiz-feedback ${picked === item.answer ? 'ok' : 'bad'}`} role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {picked === item.answer ? 'Correct. ' : 'Not quite. '}
              {item.why}
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="hero-actions">
        <Button
          onClick={() => {
            setIndex((i) => i + 1);
            setPicked(null);
          }}
          disabled={!answered}
        >
          {index + 1 === QUIZ.length ? 'See score' : 'Next question'}
        </Button>
        <Button variant="ghost" icon={RotateCcw} onClick={restart}>
          Restart
        </Button>
      </div>
    </div>
  );
}

export default function VivaView({ cs }) {
  const [mode, setMode] = useState('questions');
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Viva Mode</span>
          <h1>Prepare for the Viva</h1>
          <p className="muted">Common examiner questions with short answers, and a quick quiz to test yourself.</p>
        </div>
        <Segmented
          ariaLabel="Viva mode"
          options={[
            { value: 'questions', label: 'Questions' },
            { value: 'quiz', label: 'Quiz Me' },
          ]}
          value={mode}
          onChange={setMode}
        />
      </header>
      {mode === 'questions' ? <Questions graph={cs.graph} /> : <Quiz />}
    </div>
  );
}
