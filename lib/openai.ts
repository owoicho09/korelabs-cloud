import OpenAI from 'openai'

let _client: OpenAI | null = null

function getClient(): OpenAI | null {
  if (_client) return _client
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  _client = new OpenAI({ apiKey: key })
  return _client
}

interface PersonaliseEmailParams {
  type: 'acknowledgment' | 'assessment' | 'interview_invite' | 'reminder_24h' | 'reminder_1h' | 'pass' | 'nudge_1' | 'nudge_2' | 'video_reminder' | 'under_review' | 'onboarding'
  applicantName: string
  roleTitle: string
  whyKorelabs?: string
  context?: string
}

export async function personaliseEmail(params: PersonaliseEmailParams): Promise<string> {
  const client = getClient()
  if (!client) return getDefaultEmailBody(params)

  const systemPrompt = `You are writing a concise, warm, and genuinely human email on behalf of KoreLabs Cloud — a European AI infrastructure company.
The email should sound like it was written by a thoughtful human, not a template. Be specific, warm, and direct. No filler phrases. No corporate language. 2-4 sentences maximum.
Return only the body paragraph(s) — no subject line, no greeting, no sign-off.`

  const userPrompt = buildEmailPrompt(params)

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 200,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content?.trim() ?? getDefaultEmailBody(params)
  } catch {
    return getDefaultEmailBody(params)
  }
}

function buildEmailPrompt(params: PersonaliseEmailParams): string {
  const { type, applicantName, roleTitle, whyKorelabs, context } = params

  switch (type) {
    case 'acknowledgment':
      return `Write a short, warm acknowledgment for ${applicantName} who applied for the ${roleTitle} role at KoreLabs Cloud. Two sentences maximum. Tell them: their application has been received and will be carefully reviewed by the team, and they should expect to hear back within a few days. Do not reference anything specific from their application. Keep it simple, genuine, and human.`

    case 'assessment':
      return `Write an enthusiastic but professional note to ${applicantName} who applied for ${roleTitle}.
Tell them the team has reviewed their application and wants to learn more about how they think through a short technical assessment. Keep it energetic but not sycophantic.`

    case 'interview_invite':
      return `Write a warm invitation to ${applicantName} who applied for ${roleTitle} at KoreLabs to schedule a conversation with the team.
They have completed the assessment. Tell them the team was impressed and wants to meet them. Keep it genuine and specific to the role.`

    case 'reminder_24h':
      return `Write a brief, friendly reminder to ${applicantName} that their interview for the ${roleTitle} role at KoreLabs is tomorrow. Keep it warm and human — mention you are looking forward to the conversation.`

    case 'reminder_1h':
      return `Write a very short, warm note to ${applicantName} reminding them their interview for ${roleTitle} at KoreLabs starts in about an hour. Just a quick note — include the Zoom link reminder.`

    case 'pass':
      return `Write a warm, encouraging note to ${applicantName} who interviewed for ${roleTitle} at KoreLabs letting them know they have passed to the next stage. Be enthusiastic but genuine.`

    case 'nudge_1':
      return `Write a warm, non-pressuring reminder to ${applicantName} that their assessment link for the ${roleTitle} role at KoreLabs is still open and waiting for them. This is a gentle nudge, not urgent. Keep it to 2 sentences. Make them feel welcomed back, not chased.`

    case 'nudge_2':
      return `Write a final, honest nudge to ${applicantName} that their assessment link for the ${roleTitle} role at KoreLabs will expire soon. This is their last reminder. Be direct but warm — acknowledge that life gets busy and this is genuinely their last chance. 2-3 sentences max.`

    case 'video_reminder':
      return `Write a brief, encouraging note to ${applicantName} who just completed the ${roleTitle} assessment at KoreLabs. Remind them there is one last step: a short 3-question video introduction. Tell them it takes about 5 minutes and they can do it from their browser. Make it feel low-pressure and exciting, not like homework.`

    case 'under_review':
      return `Write a warm confirmation to ${applicantName} that their full application for the ${roleTitle} role at KoreLabs — including their assessment and video introduction — has been received and is now being reviewed by the hiring team. Tell them the team will be in touch if their profile is a match. Keep it genuine and human, not a form letter.`

    case 'onboarding':
      return `Write a warm, personal, and exciting welcome message to ${applicantName} who has been accepted for the ${roleTitle} role at KoreLabs Cloud.${whyKorelabs ? ` Their reason for joining: "${whyKorelabs.slice(0, 150)}".` : ''} Tell them the team is delighted to move forward and that someone will be in touch within 1-2 business days with everything they need to get started. Make it feel genuine, like it was written by a real person who is thrilled to have them join. ${context ?? ''}`
  }
}

function getDefaultEmailBody(params: PersonaliseEmailParams): string {
  const { type, applicantName, roleTitle } = params

  switch (type) {
    case 'acknowledgment':
      return `Thank you for your application and genuine interest in joining KoreLabs Cloud, ${applicantName}. We have received your application and it will be carefully reviewed by our team — expect to hear from us in just a few days.`

    case 'assessment':
      return `We have reviewed your application for ${roleTitle}, ${applicantName}, and we would like to learn more about how you think. We have prepared a short technical assessment — it should take around 30 minutes to complete.`

    case 'interview_invite':
      return `We are pleased to invite you to a conversation with the KoreLabs team, ${applicantName}. Your application and assessment for the ${roleTitle} role have impressed us, and we would love to learn more about you.`

    case 'reminder_24h':
      return `Just a quick reminder that your interview for the ${roleTitle} role at KoreLabs is tomorrow. We are looking forward to the conversation, ${applicantName}.`

    case 'reminder_1h':
      return `Your interview for ${roleTitle} at KoreLabs starts in about an hour, ${applicantName}. We will see you shortly.`

    case 'pass':
      return `We have great news, ${applicantName} — you have progressed to the next stage of our process for the ${roleTitle} role. We will be in touch with the details.`

    case 'nudge_1':
      return `Just a quick note to let you know your assessment link for the ${roleTitle} role at KoreLabs is still open, ${applicantName}. Whenever you are ready, the link is waiting for you — no rush.`

    case 'nudge_2':
      return `This is your last reminder, ${applicantName} — your assessment link for the ${roleTitle} role at KoreLabs will expire soon. If you are still interested, now is the time. We would love to see your application come through.`

    case 'video_reminder':
      return `Great news — you are almost done with your application for ${roleTitle}, ${applicantName}. The last step is a short 3-question video introduction you can record straight from your browser. It takes around 5 minutes and there is no pressure to be perfect.`

    case 'under_review':
      return `Thank you for completing your full application for the ${roleTitle} role, ${applicantName}. Your assessment and video introduction are now with our hiring team. We will be in touch if your profile matches what we are looking for.`

    case 'onboarding':
      return `We have reviewed your application and we are delighted to move forward with you for the ${roleTitle} role, ${applicantName}. A member of our team will be in touch within 1–2 business days with everything you need to get started. Welcome to KoreLabs Cloud.`
  }
}
