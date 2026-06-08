'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { CheckCircle, Video, RefreshCw, ChevronRight, Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Question {
  id: string
  question: string
  maxSeconds: number
}

interface Props {
  quizToken: string
  firstName: string
  roleTitle: string
  questions: Question[]
}

type RecordingState = 'idle' | 'countdown' | 'recording' | 'preview' | 'uploading' | 'done_question'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ]
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

export function VideoRecorder({ quizToken, firstName, roleTitle, questions }: Props) {
  const [started, setStarted] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [countdown, setCountdown] = useState(3)
  const [timeLeft, setTimeLeft] = useState(0)
  const [retakeUsed, setRetakeUsed] = useState<boolean[]>(questions.map(() => false))
  const [blobs, setBlobs] = useState<Blob[]>([])
  const [durations, setDurations] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [allDone, setAllDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraGranted, setCameraGranted] = useState(false)
  const [recordStartTime, setRecordStartTime] = useState<number>(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const question = questions[currentQ]
  const isLastQuestion = currentQ === questions.length - 1

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
      }
      setCameraGranted(true)
    } catch {
      setError('Camera and microphone access is required. Please allow access and try again.')
    }
  }, [])

  useEffect(() => {
    return () => {
      stopStream()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [stopStream])

  const startCountdown = useCallback(async () => {
    if (!cameraGranted) await startCamera()
    setRecordingState('countdown')
    setCountdown(3)
    let c = 3
    const iv = setInterval(() => {
      c -= 1
      setCountdown(c)
      if (c <= 0) {
        clearInterval(iv)
        beginRecording()
      }
    }, 1000)
  }, [cameraGranted, startCamera])

  const beginRecording = useCallback(() => {
    if (!streamRef.current) return

    chunksRef.current = []
    const mimeType = getSupportedMimeType()
    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : {})

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' })
      const duration = Math.round((Date.now() - recordStartTime) / 1000)
      setBlobs((prev) => {
        const next = [...prev]
        next[currentQ] = blob
        return next
      })
      setDurations((prev) => {
        const next = [...prev]
        next[currentQ] = duration
        return next
      })
      // Show preview
      if (previewRef.current) {
        previewRef.current.src = URL.createObjectURL(blob)
        previewRef.current.muted = false
      }
      setRecordingState('preview')
    }

    recorder.start(100)
    recorderRef.current = recorder
    setRecordStartTime(Date.now())
    setRecordingState('recording')
    setTimeLeft(question.maxSeconds)

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          stopRecording()
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [streamRef, currentQ, question, recordStartTime])

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    recorderRef.current?.stop()
  }, [])

  const retake = useCallback(async () => {
    setRetakeUsed((prev) => {
      const next = [...prev]
      next[currentQ] = true
      return next
    })
    if (previewRef.current) previewRef.current.src = ''
    // Restart camera if needed
    if (!streamRef.current) await startCamera()
    else if (videoRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.muted = true
    }
    await startCountdown()
  }, [currentQ, startCamera, startCountdown])

  const uploadCurrent = useCallback(async () => {
    const blob = blobs[currentQ]
    if (!blob) return

    setRecordingState('uploading')

    const fd = new FormData()
    fd.append('quiz_token', quizToken)
    fd.append('question_index', String(currentQ))
    fd.append('video', blob, `q${currentQ}.webm`)
    fd.append('duration_seconds', String(durations[currentQ] ?? 0))

    try {
      const res = await fetch('/api/video/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const json = await res.json()

      if (json.complete || isLastQuestion) {
        stopStream()
        setAllDone(true)
      } else {
        setRecordingState('done_question')
      }
    } catch {
      setError('Upload failed. Please try again.')
      setRecordingState('preview')
    }
  }, [blobs, currentQ, durations, quizToken, isLastQuestion, stopStream])

  const nextQuestion = useCallback(async () => {
    // Upload current before advancing
    if (!blobs[currentQ]) return

    setSubmitting(true)
    const fd = new FormData()
    fd.append('quiz_token', quizToken)
    fd.append('question_index', String(currentQ))
    fd.append('video', blobs[currentQ], `q${currentQ}.webm`)
    fd.append('duration_seconds', String(durations[currentQ] ?? 0))

    try {
      const res = await fetch('/api/video/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      setCurrentQ((q) => q + 1)
      setRecordingState('idle')
      if (previewRef.current) previewRef.current.src = ''
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [blobs, currentQ, quizToken, durations])

  const submitAll = useCallback(async () => {
    await uploadCurrent()
  }, [uploadCurrent])

  // ─── Intro screen ───────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#FAFAF8]">
        <div className="max-w-lg w-full">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center mb-6">
            <Video size={18} className="text-white" />
          </div>
          <h1 className="font-display text-[32px] text-[#1A2A1E] leading-tight mb-4">
            One more step, {firstName}.
          </h1>
          <p className="text-[#637A6F] mb-6">
            Record a short video introduction for the <strong className="text-[#1A2A1E]">{roleTitle}</strong> role.
            You will answer 3 questions — up to 90 seconds each.
          </p>
          <div className="space-y-3 mb-8">
            {[
              `${questions.length} questions — up to 90 seconds each`,
              'Record directly in your browser — no software needed',
              'One retake allowed per question',
              'Your video is private and only seen by the hiring team',
            ].map((note) => (
              <div key={note} className="flex items-start gap-3 text-sm text-[#637A6F]">
                <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 flex-shrink-0" />
                {note}
              </div>
            ))}
          </div>
          <Button size="lg" onClick={() => { setStarted(true); startCamera() }}>
            Start recording
          </Button>
        </div>
      </div>
    )
  }

  // ─── All done ───────────────────────────────────────────────────────────────
  if (allDone) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#FAFAF8]">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-5 mx-auto">
            <CheckCircle size={32} className="text-brand" />
          </div>
          <h2 className="font-display text-2xl text-[#1A2A1E] mb-3">Thank you, {firstName}.</h2>
          <p className="text-[#637A6F]">
            Our hiring team will review your application and be in touch if your profile matches what we are looking for.
          </p>
        </div>
      </div>
    )
  }

  // ─── Recording interface ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#D8E8E0]">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
          <span className="text-sm font-medium text-[#1A2A1E]">
            Video introduction — Question {currentQ + 1} of {questions.length}
          </span>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <span
                key={i}
                className={`w-6 h-1.5 rounded-full transition-colors ${
                  i < currentQ ? 'bg-brand' : i === currentQ ? 'bg-brand/40' : 'bg-[#D8E8E0]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Question text */}
        <div className="bg-white rounded-2xl border border-[#D8E8E0] p-6 mb-6">
          <p className="text-xs text-[#9FB5A9] mb-2 uppercase tracking-wide font-medium">Question {currentQ + 1}</p>
          <p className="text-[17px] text-[#1A2A1E] leading-relaxed">{question.question}</p>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {/* Camera / Preview area */}
        <div className="relative bg-[#1A2A1E] rounded-2xl overflow-hidden aspect-video mb-6">
          {/* Live camera feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${recordingState === 'preview' || recordingState === 'done_question' ? 'hidden' : 'block'}`}
          />

          {/* Preview playback */}
          <video
            ref={previewRef}
            controls
            playsInline
            className={`w-full h-full object-cover ${recordingState === 'preview' || recordingState === 'done_question' ? 'block' : 'hidden'}`}
          />

          {/* Countdown overlay */}
          {recordingState === 'countdown' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-white font-display text-8xl font-bold">{countdown}</span>
            </div>
          )}

          {/* Recording indicator */}
          {recordingState === 'recording' && (
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-sm font-medium tabular-nums">{formatTime(timeLeft)}</span>
            </div>
          )}

          {/* No camera placeholder */}
          {!cameraGranted && recordingState === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 gap-3">
              <MicOff size={32} />
              <p className="text-sm">Camera access required</p>
            </div>
          )}

          {/* Uploading overlay */}
          {recordingState === 'uploading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center text-white">
                <svg className="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm">Uploading…</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {recordingState === 'idle' && (
            <Button size="lg" onClick={startCountdown} className="flex items-center gap-2">
              <Video size={16} />
              {cameraGranted ? 'Start recording' : 'Allow camera & record'}
            </Button>
          )}

          {recordingState === 'countdown' && (
            <Button size="lg" disabled className="opacity-50">
              Get ready…
            </Button>
          )}

          {recordingState === 'recording' && (
            <Button
              size="lg"
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              Stop recording
            </Button>
          )}

          {recordingState === 'preview' && (
            <>
              {!retakeUsed[currentQ] && (
                <button
                  onClick={retake}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D8E8E0] text-sm text-[#637A6F] hover:border-[#4a9270] hover:text-[#1A2A1E] transition-colors"
                >
                  <RefreshCw size={14} />
                  Retake
                </button>
              )}

              {!isLastQuestion ? (
                <Button
                  size="lg"
                  onClick={nextQuestion}
                  loading={submitting}
                  className="flex items-center gap-2"
                >
                  Next question
                  <ChevronRight size={16} />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={submitAll}
                  loading={submitting}
                  className="flex items-center gap-2"
                >
                  Submit all videos
                  <CheckCircle size={16} />
                </Button>
              )}
            </>
          )}
        </div>

        {/* Camera permission hint */}
        {!cameraGranted && (
          <p className="text-xs text-[#9FB5A9] mt-3">
            When prompted, click <strong>Allow</strong> to grant camera and microphone access.
          </p>
        )}
      </div>
    </div>
  )
}
