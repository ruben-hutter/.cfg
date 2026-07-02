import type { Plugin } from "@opencode-ai/plugin"

type Urgency = "low" | "normal" | "critical"

function notify(opts: {
  summary: string
  body?: string
  icon?: string
  urgency?: Urgency
  transient?: boolean
}) {
  const args = ["notify-send", "--app-name=Opencode"]
  if (opts.icon) args.push(`--icon=${opts.icon}`)
  args.push(`--urgency=${opts.urgency ?? "normal"}`)
  if (opts.transient) args.push("--transient")
  args.push(opts.summary)
  if (opts.body) args.push(opts.body)
  try {
    Bun.spawn(args, { stdout: "ignore", stderr: "ignore" })
  } catch {}
}

const activePrompts = new Map<string, Set<string>>()

function trackPrompt(
  sessionID: string,
  promptID: string,
  opts: { summary: string; body?: string; icon?: string }
) {
  const existed = activePrompts.has(sessionID)
  let set = activePrompts.get(sessionID)
  if (!set) {
    set = new Set()
    activePrompts.set(sessionID, set)
  }
  set.add(promptID)
  if (!existed) {
    notify({ ...opts, urgency: "normal", transient: true })
  }
}

function untrackPrompt(sessionID: string, promptID: string) {
  const set = activePrompts.get(sessionID)
  if (!set) return
  set.delete(promptID)
  if (set.size === 0) activePrompts.delete(sessionID)
}

function clearSession(sessionID: string) {
  activePrompts.delete(sessionID)
}

async function getSessionName(fallback: string): Promise<string> {
  if (process.env.TMUX) {
    try {
      const proc = Bun.spawn(["tmux", "display-message", "-p", "#S"], { stdout: "pipe" })
      const output = await new Response(proc.stdout).text()
      const name = output.trim()
      if (name) return name
    } catch {}
  }
  return fallback
}

export default (async ({ project }) => {
  const projectName = await getSessionName(project.worktree?.replace(/.*\//, "") || "opencode")

  return {
    event: async ({ event }) => {
      const props = event.properties as Record<string, unknown>
      const sessionID = props?.sessionID as string | undefined

      if (event.type === "session.idle") {
        if (sessionID) clearSession(sessionID)
        notify({
          summary: `${projectName}: Opencode finished`,
          body: "Session is idle and waiting for input",
          icon: "task-complete",
          urgency: "normal",
          transient: true,
        })
      }

      if (event.type === "question.asked") {
        if (!sessionID) return
        const body =
          (props.message as string) ??
          (props.text as string) ??
          "Your input is needed"
        trackPrompt(sessionID, props.id as string, {
          summary: `${projectName}: Opencode has a question`,
          body,
          icon: "dialog-question",
        })
      }

      if (event.type === "question.replied" || event.type === "question.rejected") {
        if (!sessionID) return
        untrackPrompt(sessionID, props.requestID as string)
      }

      if (event.type === "permission.asked") {
        if (!sessionID) return
        trackPrompt(sessionID, props.id as string, {
          summary: `${projectName}: Opencode needs approval`,
          body: (props.title as string) ?? "A tool requires your permission",
          icon: "dialog-password",
        })
      }

      if (event.type === "permission.replied") {
        if (!sessionID) return
        untrackPrompt(sessionID, props.requestID as string)
      }
    },
    "chat.message": async () => {
      notify({
        summary: `${projectName}: Opencode activity`,
        icon: "mail-message-new",
        urgency: "low",
        transient: true,
      })
    },
  }
}) satisfies Plugin
