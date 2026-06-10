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

const sessionStates = new Map<string, string>()

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

export default (async () => {
  return {
    event: async ({ event }) => {
      const props = event.properties as Record<string, unknown>
      const sessionID = props?.sessionID as string | undefined
      if (!sessionID) return

      if (event.type === "session.idle") {
        sessionStates.set(sessionID, "idle")
        await blink1Flash(sessionColor(sessionID), 3, 300)
      }

      if (event.type === "session.status") {
        const status = props?.status as { type?: string } | undefined
        if (status?.type === "busy" && sessionStates.get(sessionID) !== "busy") {
          sessionStates.set(sessionID, "busy")
          await blink1Flash(sessionColor(sessionID), 1, 200)
        }
      }
    },
  }
}) satisfies Plugin
