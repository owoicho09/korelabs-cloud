import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[#1A2A1E]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-xl border text-[#1A2A1E] bg-white text-sm',
            'placeholder:text-[#9FB5A9] transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand',
            error
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-[#D8E8E0] hover:border-[#B0CBBC]',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-[#637A6F]">{hint}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  wordCount?: { current: number; min: number; max: number }
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, wordCount, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[#1A2A1E]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-xl border text-[#1A2A1E] bg-white text-sm',
            'placeholder:text-[#9FB5A9] transition-colors duration-150 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand',
            error
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-[#D8E8E0] hover:border-[#B0CBBC]',
            className
          )}
          {...props}
        />
        <div className="flex justify-between items-start">
          <div>
            {hint && !error && <p className="text-xs text-[#637A6F]">{hint}</p>}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          {wordCount && (
            <p className={cn(
              'text-xs tabular-nums',
              wordCount.current < wordCount.min ? 'text-amber-500' : 'text-[#9FB5A9]',
              wordCount.current > wordCount.max ? 'text-red-500' : ''
            )}>
              {wordCount.current} / {wordCount.max} words
            </p>
          )}
        </div>
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
