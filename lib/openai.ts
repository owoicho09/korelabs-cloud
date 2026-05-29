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
  type: 'acknowledgment' | 'assessment' | 'interview_invite' | 'reminder_24h' | 'reminder_1h' | 'pass'
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
  const { type, applicantName, roleTitle, whyKorelabs } = params

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
  }
}
