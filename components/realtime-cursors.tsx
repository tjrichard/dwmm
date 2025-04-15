import React, { useEffect, useRef, useState } from "react"
import { supabase } from "../lib/supabase"
import { throttle, generateRandomColor } from "../utils/helpers"

interface RealtimeCursorsProps {
  roomName: string
  username: string
  throttleMs?: number
}

export function RealtimeCursors({ roomName, username, throttleMs = 5 }: RealtimeCursorsProps) {
  const [cursors, setCursors] = useState<{ id: string; x: number; y: number; color: string; text?: string }[]>([])
  const [activeInput, setActiveInput] = useState<{ id: string; x: number; y: number } | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const cursorRefs = useRef(new Map<string, HTMLDivElement>())
  const channelRef = useRef<any>(null)

  useEffect(() => {
    const channel = supabase.channel(`realtime-cursors:${roomName}`)
    channelRef.current = channel

    channel.on("presence", { event: "sync" }, syncCursors)
    channel.on("presence", { event: "leave" }, removeCursor)
    channel.subscribe()

    const throttledMouseMove = throttle(handleMouseMove, throttleMs)
    window.addEventListener("mousemove", throttledMouseMove)
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("mousemove", throttledMouseMove)
      window.removeEventListener("keydown", handleKeyDown)
      channel.unsubscribe()
    }
  }, [roomName, throttleMs])

  useEffect(() => {
    if (activeInput && inputRef.current) inputRef.current.focus()
  }, [activeInput])

  function syncCursors() {
    const state = channelRef.current.presenceState()
    const updatedCursors = Object.entries(state).map(([id, presences]) => {
      const presence = presences[0]
      return {
        id,
        x: presence?.x || 0,
        y: presence?.y || 0,
        color: presence?.color || generateRandomColor(id),
        text: presence?.text || "",
      }
    })
    setCursors((prev) => (JSON.stringify(prev) === JSON.stringify(updatedCursors) ? prev : updatedCursors))
  }

  function removeCursor({ key }: { key: string }) {
    setCursors((prev) => prev.filter((cursor) => cursor.id !== key))
  }

  function handleMouseMove(e: MouseEvent) {
    if (channelRef.current) channelRef.current.track({ x: e.clientX, y: e.clientY })
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "/" && !activeInput) {
      const cursor = cursors.find((c) => c.id === username)
      if (cursor) setActiveInput({ id: cursor.id, x: cursor.x, y: cursor.y })
    }
  }

  function handleInputSubmit(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!activeInput) return
    if (e.key === "Enter") {
      const text = e.currentTarget.value
      setCursors((prev) =>
        prev.map((cursor) => (cursor.id === activeInput.id ? { ...cursor, text } : cursor))
      )
      if (channelRef.current) channelRef.current.track({ text })
      setActiveInput(null)
    } else if (e.key === "Escape") {
      setActiveInput(null)
    }
  }

  return (
    <div className="realtime-cursors">
      {cursors.map((cursor) => (
        <div
          key={cursor.id}
          ref={(el) => el && cursorRefs.current.set(cursor.id, el)}
          className="cursor"
          style={{ left: cursor.x, top: cursor.y, position: "absolute", color: cursor.color }}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke={cursor.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            <path d="M13 13l6 6" />
          </svg>
          {cursor.text && <span>{cursor.text}</span>}
        </div>
      ))}
      {activeInput && (
        <input
          ref={inputRef}
          className="absolute border border-gray-300 p-1"
          style={{ left: activeInput.x, top: activeInput.y }}
          onKeyDown={handleInputSubmit}
        />
      )}
    </div>
  )
}
