'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Question {
  id: string
  tier: string
  question: string
  options: string[]
  points: number
  order_index: number
}

interface Props {
  token: string
  questions: Question[]
  firstName: string
  jobTitle: string
  assessmentId?: string
}

const DURATION = 30 * 60 // 30 minutes in seconds

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function QuizClient({ token, questions, firstName, jobTitle }: Props) {
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)

  const sections = [
    { label: 'Part 1: Fundamentals', tier: 'fundamentals' },
    { label: 'Part 2: Applied Judgment', tier: 'applied' },
    { label: 'Part 3: KoreLabs Context', tier: 'korelabs' },
  ]

  const groupedQuestions = sections.map((s) =>
    questions.filter((q) => q.tier === s.tier)
  )

  const submitQuiz = useCallback(async (finalAnswers: Record<string, number>) => {
    setSubmitting(true)
    try {
      await fetch(`/api/quiz/submit/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers }),
      })
      setSubmitted(true)
    } catch {
      // Best effort
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }, [token])

  useEffect(() => {
    if (!started || submitted) return

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval)
          submitQuiz(answers)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [started, submitted, answers, submitQuiz])

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#FAFAF8]">
        <div className="max-w-lg w-full">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center mb-6">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="4" cy="4" r="2.5" fill="white" opacity="0.9" />
              <circle cx="10" cy="4" r="2.5" fill="white" opacity="0.6" />
              <circle cx="4" cy="10" r="2.5" fill="white" opacity="0.6" />
              <circle cx="10" cy="10" r="2.5" fill="white" opacity="0.3" />
            </svg>
          </div>
          <h1 className="font-display text-[32px] text-[#1A2A1E] leading-tight mb-4">
            Hi {firstName}, your KoreLabs assessment.
          </h1>
          <p className="text-[#637A6F] mb-8">
            This assessment for the <strong className="text-[#1A2A1E]">{jobTitle}</strong> role is 20 multiple-choice questions across three sections. You have 30 minutes from when you start.
          </p>
          <div className="space-y-3 mb-8">
            {[
              'Answer all 20 questions — no question is skippable',
              'You have exactly 30 minutes once you start',
              'Submit before the timer runs out or your answers will auto-submit',
              'No score is shown — everyone who completes moves forward',
            ].map((note) => (
              <div key={note} className="flex items-start gap-3 text-sm text-[#637A6F]">
                <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 flex-shrink-0" />
                {note}
              </div>
            ))}
          </div>
          <Button size="lg" onClick={() => setStarted(true)}>
            Start assessment
          </Button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#FAFAF8]">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-5 mx-auto">
            <CheckCircle size={32} className="text-brand" />
          </div>
          <h2 className="font-display text-2xl text-[#1A2A1E] mb-3">Assessment submitted.</h2>
          <p className="text-[#637A6F]">
            Our team will review your responses and you will hear from us within a few days.
          </p>
        </div>
      </div>
    )
  }

  const currentSectionQuestions = groupedQuestions[currentSection] ?? []
  const totalAnswered = Object.keys(answers).length
  const allSectionAnswered = currentSectionQuestions.every((q) => answers[q.id] !== undefined)
  const isLastSection = currentSection === sections.length - 1
  const allAnswered = questions.every((q) => answers[q.id] !== undefined)

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#D8E8E0]">
        <div className="container max-w-2xl flex items-center justify-between h-14">
          <span className="text-sm font-medium text-[#1A2A1E]">
            {sections[currentSection].label}
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#637A6F]">
              {totalAnswered}/{questions.length} answered
            </span>
            <span className={`text-sm font-medium tabular-nums ${timeLeft < 300 ? 'text-red-500' : 'text-[#1A2A1E]'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-[#F0F7F3]">
          <div
            className="h-full bg-brand transition-all duration-300"
            style={{ width: `${(totalAnswered / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="container max-w-2xl py-8">
        {/* Section tabs */}
        <div className="flex gap-2 mb-8">
          {sections.map((s, i) => (
            <button
              key={s.tier}
              onClick={() => setCurrentSection(i)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                i === currentSection
                  ? 'bg-brand text-white'
                  : 'bg-white border border-[#D8E8E0] text-[#637A6F]'
              }`}
            >
              {s.label.split(': ')[1]}
              {groupedQuestions[i]?.every((q) => answers[q.id] !== undefined) && i !== currentSection && (
                <span className="ml-1">✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {currentSectionQuestions.map((q, qi) => (
            <div key={q.id} className="p-6 rounded-2xl bg-white border border-[#D8E8E0]">
              <p className="text-xs text-[#9FB5A9] mb-3">Question {qi + 1}</p>
              <p className="text-[15px] text-[#1A2A1E] mb-5 leading-relaxed">{q.question}</p>
              <div className="space-y-2">
                {q.options.map((option, oi) => (
                  <label
                    key={oi}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                      answers[q.id] === oi
                        ? 'border-brand bg-brand-50 text-[#1A2A1E]'
                        : 'border-[#D8E8E0] hover:border-brand/40 text-[#637A6F]'
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={oi}
                      checked={answers[q.id] === oi}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                      className="sr-only"
                    />
                    <span className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center mt-0.5 text-xs ${
                      answers[q.id] === oi ? 'border-brand bg-brand text-white' : 'border-[#D8E8E0]'
                    }`}>
                      {answers[q.id] === oi ? '●' : ''}
                    </span>
                    <span className="text-sm leading-relaxed">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {currentSection > 0 && (
            <Button variant="outline" onClick={() => setCurrentSection((s) => s - 1)}>
              Previous section
            </Button>
          )}
          {!isLastSection ? (
            <Button
              onClick={() => setCurrentSection((s) => s + 1)}
              disabled={!allSectionAnswered}
            >
              Next section
              {!allSectionAnswered && (
                <span className="ml-2 text-xs opacity-70">
                  ({currentSectionQuestions.filter((q) => answers[q.id] === undefined).length} unanswered)
                </span>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => submitQuiz(answers)}
              loading={submitting}
              disabled={!allAnswered}
            >
              Submit assessment
              {!allAnswered && (
                <span className="ml-2 text-xs opacity-70">
                  ({questions.filter((q) => answers[q.id] === undefined).length} unanswered)
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
