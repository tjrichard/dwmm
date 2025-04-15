import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { throttle, generateRandomColor } from "../utils/helpers";

interface RealtimeCursorsProps {
  roomName: string;
  userId: string; // userId로 변경
  username: string; // 표시용 닉네임
  throttleMs?: number;
}

interface Cursor {
  id: string;
  x: number;
  y: number;
  color: string;
  text?: string;
  isFading?: boolean;
  username?: string; // 표시용 닉네임
}

// 커서 상태를 중복 없이 관리하기 위한 헬퍼 함수
function upsertCursor(cursors: Cursor[], newCursor: Cursor): Cursor[] {
  // 같은 id가 있으면 교체, 없으면 추가
  const idx = cursors.findIndex((c) => c.id === newCursor.id);
  if (idx === -1) return [...cursors, newCursor];
  const updated = [...cursors];
  updated[idx] = newCursor;
  return updated;
}

export function RealtimeCursors({
  roomName,
  userId,
  username,
  throttleMs = 5,
}: RealtimeCursorsProps) {
  const [cursors, setCursors] = useState<Cursor[]>([]);
  const [lastMouse, setLastMouse] = useState<{ x: number; y: number }>({
    x: 100,
    y: 100,
  });
  const cursorRefs = useRef(new Map<string, HTMLDivElement>());
  const channelRef = useRef<any>(null);
  // 내 커서 상태를 별도로 관리하여 setCursors의 불필요한 렌더링 방지
  const myCursorRef = useRef<Cursor>({
    id: userId,
    username,
    x: 100,
    y: 100,
    color: generateRandomColor(userId),
    text: "",
  });

  // mousemove 이벤트에서 내 커서 상태를 즉시 반영 (state set 최소화)
  const throttledTrack = useRef(
    throttle((payload: any) => {
      if (channelRef.current) channelRef.current.track(payload);
    }, throttleMs)
  ).current;

  function handleMouseMove(e: MouseEvent) {
    const x = e.clientX;
    const y = e.clientY;
    setLastMouse({ x, y });
    // 내 커서 정보만 직접 업데이트, setCursors는 다른 유저의 presence sync에서만 호출
    myCursorRef.current = {
      ...myCursorRef.current,
      x,
      y,
    };
    throttledTrack({
      ...myCursorRef.current,
      x,
      y,
    });
    // 내 커서만 직접 DOM 위치 이동 (최적화)
    const el = cursorRefs.current.get(userId);
    if (el) {
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    }
  }

  // presence sync 이벤트에서 커서 상태를 중복 없이 갱신 (내 커서는 직접 관리)
  function syncCursors() {
    const state = channelRef.current.presenceState();
    const updatedCursors: Cursor[] = [];
    Object.entries(state).forEach(([id, presences]) => {
      const presence = presences[0];
      if (!presence) return;
      // 내 커서는 별도 관리
      if (presence.id === userId) return;
      updatedCursors.push({
        id: presence.id,
        username: presence.username,
        x: presence.x ?? 0,
        y: presence.y ?? 0,
        color: presence.color ?? generateRandomColor(presence.id ?? id),
        text: presence.text ?? "",
      });
    });
    // 내 커서는 항상 첫 번째에 추가
    setCursors([myCursorRef.current, ...updatedCursors]);
  }

  function removeCursor({ key }: { key: string }) {
    setCursors((prev) => prev.filter((cursor) => cursor.id !== key && cursor.id !== userId));
  }

  useEffect(() => {
    const channel = supabase.channel(`realtime-cursors:${roomName}`);
    channelRef.current = channel;

    channel.subscribe(async (status: any) => {
      if (status === "SUBSCRIBED") {
        channel.track(myCursorRef.current);
      }
    });

    channel.on("presence", { event: "sync" }, syncCursors);
    channel.on("presence", { event: "leave" }, removeCursor);

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName, throttleMs, userId, username]);

  // body 커서 숨김
  useEffect(() => {
    document.body.style.cursor = "none";
    return () => {
      document.body.style.cursor = "default";
    };
  }, []);

  // 최초 렌더링 시 내 커서만 먼저 표시
  useEffect(() => {
    setCursors([myCursorRef.current]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="realtime-cursors">
      {cursors.map((cursor) => (
        <div
          key={cursor.id}
          id={cursor.id}
          ref={(el) => {
            if (el) cursorRefs.current.set(cursor.id, el);
          }}
          className="cursor"
          style={{
            left: cursor.x,
            top: cursor.y,
            position: "absolute",
            willChange: "transform",
            transition: cursor.id === userId ? "none" : "left 0.08s linear, top 0.08s linear",
            zIndex: cursor.id === userId ? 10 : 1,
          }}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 31 32"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="m8.2752 29.917-8.1579-27.193c-0.42306-1.4102 1.0436-2.6438 2.3605-1.9854l27.24 13.62c1.513 0.7566 1.0854 3.0226-0.5993 3.1758l-12.824 1.1658c-0.6647 0.0605-1.2306 0.5087-1.4417 1.1419l-3.3744 10.123c-0.5188 1.5563-2.7316 1.5227-3.2029-0.0485z"
              fill={cursor.color}
            />
          </svg>
          {cursor.text && (
            <span
              className="cursor-text-preview"
              style={{
                marginLeft: 8,
                background: "rgba(255,255,255,0.9)",
                borderRadius: 4,
                padding: "2px 8px",
                fontSize: 14,
                position: "absolute",
                left: 32,
                top: 0,
                pointerEvents: "none",
                transition: "opacity 0.5s",
                opacity: 1,
              }}
            >
              {cursor.text}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
