import type { Plugin } from "@opencode-ai/plugin"

const PALETTE = [
  "FF0000",
  "00FF00",
  "0066FF",
  "FFDD00",
  "00FFFF",
  "FF00FF",
  "FF8800",
  "FFFFFF",
]

const BLINK1_URL = "http://localhost:8934"

function sessionColor(sessionId: string): string {
  let hash = 0
  for (let i = 0; i < sessionId.length; i++) {
    hash = ((hash << 5) - hash + sessionId.charCodeAt(i)) | 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

async function blink1Flash(rgb: string, count: number, millis = 300) {
  try {
    await fetch(
      `${BLINK1_URL}/blink1/blink?rgb=${rgb}&count=${count}&millis=${millis}`
    )
  } catch {}
}

async function blink1Off() {
  try {
    await fetch(`${BLINK1_URL}/blink1/off`)
  } catch {}
}

const BLINK_INTERVAL = 1300
const activePrompts = new Map<string, Set<string>>()
const sessionQueue: string[] = []
let blinkTimer: ReturnType<typeof setInterval> | null = null

function activeSession(): string | undefined {
  return sessionQueue.length > 0 ? sessionQueue[0] : undefined
}

function startTimer() {
  if (blinkTimer) return
  const sessionID = activeSession()
  if (!sessionID) return
  const color = sessionColor(sessionID)
  blink1Flash(color, 5, 200)
  blinkTimer = setInterval(() => blink1Flash(color, 5, 200), BLINK_INTERVAL)
}

function stopTimer() {
  if (blinkTimer) {
    clearInterval(blinkTimer)
    blinkTimer = null
    blink1Off()
  }
}

function trackPrompt(sessionID: string, promptID: string) {
  let set = activePrompts.get(sessionID)
  if (!set) {
    set = new Set()
    activePrompts.set(sessionID, set)
    sessionQueue.push(sessionID)
  }
  set.add(promptID)
  if (activeSession() === sessionID) startTimer()
}

function untrackPrompt(sessionID: string, promptID: string) {
  const set = activePrompts.get(sessionID)
  if (!set) return
  set.delete(promptID)
  if (set.size === 0) {
    activePrompts.delete(sessionID)
    const idx = sessionQueue.indexOf(sessionID)
    if (idx !== -1) sessionQueue.splice(idx, 1)
    if (blinkTimer && !activeSession()) {
      stopTimer()
    } else if (blinkTimer) {
      stopTimer()
      startTimer()
    }
  }
}

function clearSession(sessionID: string) {
  if (!activePrompts.has(sessionID)) return
  activePrompts.delete(sessionID)
  const idx = sessionQueue.indexOf(sessionID)
  if (idx !== -1) sessionQueue.splice(idx, 1)
  if (blinkTimer) {
    stopTimer()
    startTimer()
  }
}

export default (async () => {
  return {
    event: async ({ event }) => {
      const props = event.properties as Record<string, unknown>
      const sessionID = props?.sessionID as string | undefined

      if (event.type === "session.idle") {
        if (sessionID) clearSession(sessionID)
        if (!sessionID) return
        await blink1Flash(sessionColor(sessionID), 3, 300)
      }

      if (event.type === "question.asked") {
        if (!sessionID) return
        trackPrompt(sessionID, props.id as string)
      }

      if (event.type === "question.replied" || event.type === "question.rejected") {
        if (!sessionID) return
        untrackPrompt(sessionID, props.requestID as string)
      }

      if (event.type === "permission.asked") {
        if (!sessionID) return
        trackPrompt(sessionID, props.id as string)
      }

      if (event.type === "permission.replied") {
        if (!sessionID) return
        untrackPrompt(sessionID, props.requestID as string)
      }
    },
    "chat.message": async (input) => {
      await blink1Flash(sessionColor(input.sessionID), 1, 500)
    },
  }
}) satisfies Plugin
