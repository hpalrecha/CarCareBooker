import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import { MessageCircle, X, Send } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { PHONE } from "@/lib/local-business";

/**
 * Floating AI chat widget — replaces the WhatsApp-only floating button as the default
 * contact action (server/services/chatbot.ts has the backend).
 *
 * Position/visibility rules are copied from the FAB it replaces (contact-fab.tsx): a 54px
 * circle bottom-right, hidden on /admin, lifted above the service page's own sticky booking
 * bar (`fixed right-4 z-[45]` in service-landing.tsx) on /service/*.
 *
 * WhatsApp is not removed as a channel — it's one tap away inside the open panel — it just
 * stops being the only floating action.
 *
 * SECURITY: `content` is always rendered as plain text (React's default escaping, no
 * dangerouslySetInnerHTML, no markdown-to-HTML step). The model's own output is never
 * trusted as safe HTML. `bookingUrl` on a proposed slot is server-built and already
 * server-validated (see chatbot.ts) before it ever reaches this component.
 */

const WHATSAPP_URL = `https://wa.me/${PHONE.replace(/^\+/, "")}`;
const PHONE_DISPLAY = PHONE.replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2");

interface ProposedSlot {
  serviceId: string;
  slug: string;
  serviceTitle: string;
  date: string;
  time: string;
  bookingUrl: string;
}

interface WidgetMessage {
  role: "user" | "assistant";
  content: string;
  proposedSlot?: ProposedSlot | null;
}

const GREETING: WidgetMessage = {
  role: "assistant",
  content:
    "Hi! I'm the P91 Car Care assistant. Ask me about services, pricing, hours, or tell me " +
    "what you'd like to book and I'll help you find a slot.",
};

function formatSlot(slot: ProposedSlot): string {
  const date = new Date(`${slot.date}T00:00:00`);
  const dateLabel = Number.isNaN(date.getTime())
    ? slot.date
    : date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  return `${slot.serviceTitle} — ${dateLabel} at ${slot.time}`;
}

export function ChatWidget() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const onServicePage = location.startsWith("/service/");

  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [open, messages, isLoading]);

  if (location.startsWith("/admin")) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || "Something went wrong. Please try again or WhatsApp us.");
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, proposedSlot: data.proposedSlot ?? null },
      ]);
    } catch {
      setError("Network error — please try again or WhatsApp us.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div
          className={
            "fixed right-[18px] z-50 flex w-[min(360px,calc(100vw-36px))] flex-col overflow-hidden " +
            "rounded-2xl border border-medium-gray bg-white shadow-[0_12px_40px_rgba(0,0,0,.25)] " +
            (onServicePage ? "bottom-[164px]" : "bottom-[84px]")
          }
          style={{ height: "min(70vh, 480px)" }}
          role="dialog"
          aria-label="Chat with P91 Car Care"
          data-testid="panel-chat-widget"
        >
          <div className="flex items-center justify-between border-b border-medium-gray px-4 py-3">
            <span className="text-sm font-semibold text-[var(--txt)]">P91 Car Care Assistant</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-md p-1 text-gray-400 hover:text-neon-green"
              data-testid="button-close-chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={
                    "max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm " +
                    (m.role === "user"
                      ? "bg-neon-green text-deep-black"
                      : "bg-medium-gray text-[var(--txt)]")
                  }
                >
                  {m.content}
                  {m.proposedSlot && (
                    <div className="mt-2 border-t border-black/10 pt-2">
                      <div className="mb-1.5 text-xs text-[var(--txt-2)]">{formatSlot(m.proposedSlot)}</div>
                      <Link
                        href={m.proposedSlot.bookingUrl}
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center rounded-full bg-neon-green px-3 py-1.5 text-xs font-semibold text-deep-black hover:bg-neon-green/90"
                        data-testid="link-chat-book-slot"
                      >
                        Book this slot
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-xl bg-medium-gray px-3 py-2 text-sm text-[var(--txt-2)]">
                  Thinking…
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-medium-gray p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about services, hours, booking…"
              maxLength={2000}
              disabled={isLoading}
              className="flex-1 rounded-full border border-medium-gray bg-white px-3 py-2 text-sm text-[var(--txt)] placeholder:text-gray-400 focus:border-neon-green focus:outline-none"
              data-testid="input-chat-message"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send"
              className="grid h-9 w-9 flex-none place-items-center rounded-full bg-neon-green text-deep-black disabled:opacity-40"
              data-testid="button-send-chat"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 border-t border-medium-gray py-2 text-xs text-gray-400 hover:text-neon-green"
            data-testid="link-chat-whatsapp-fallback"
          >
            <SiWhatsapp className="h-3.5 w-3.5" aria-hidden="true" />
            Prefer WhatsApp? Chat with us at {PHONE_DISPLAY}
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Chat with P91 Car Care"}
        aria-expanded={open}
        data-testid="button-chat-widget-toggle"
        className={
          "fixed right-[18px] z-50 grid h-[54px] w-[54px] place-items-center rounded-full " +
          "bg-neon-green text-deep-black shadow-[0_6px_22px_rgba(0,0,0,.5)] " +
          "transition-transform hover:scale-105 print:hidden " +
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white " +
          (onServicePage ? "bottom-24" : "bottom-[18px]")
        }
      >
        {open ? <X className="h-7 w-7" aria-hidden="true" /> : <MessageCircle className="h-7 w-7" aria-hidden="true" />}
      </button>
    </>
  );
}

export default ChatWidget;
