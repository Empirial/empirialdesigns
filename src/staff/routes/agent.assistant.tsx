import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { SectionCard } from "@staff/components/shared/section-card";
import { Pill } from "@staff/components/shared/status-badge";
import { Button } from "@staff/components/ui/button";
import { Textarea } from "@staff/components/ui/textarea";
import { ScrollArea } from "@staff/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@staff/components/ui/select";
import { useMyLeads } from "@staff/lib/leads";
import { toast } from "sonner";
import {
  Send,
  Sparkles,
  MessageSquareText,
  Mail,
  PhoneCall,
  FileText,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@staff/lib/utils";
import { getCannedResponse, SUGGESTED_PROMPTS, type LeadContext } from "@staff/components/agent-assistant/canned-responses";
import { ChatBubble, TypingBubble, type ChatMessage } from "@staff/components/agent-assistant/assistant-message";

export const Route = createFileRoute("/agent/assistant")({
  head: () => ({
    meta: [
      { title: "AI Sales Assistant — Meridian CRM" },
      {
        name: "description",
        content: "Get instant help with objection handling, cold call openers, follow-up emails and closing tips.",
      },
      { property: "og:title", content: "AI Sales Assistant — Meridian CRM" },
      {
        property: "og:description",
        content: "A simulated AI assistant for sales agents selling websites and digital services to SMEs.",
      },
    ],
  }),
  component: PageAgentAssistant,
});

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm your AI sales assistant. Ask me about handling objections, writing follow-up emails, cold call openers, or closing a deal — or pick a suggested prompt on the left to get started.\n\n- Attach one of your leads under Context for tailored advice\n- Try one of the quick-action cards above the chat",
};

const TOOL_CARDS = [
  {
    icon: MessageSquareText,
    title: "Objection Handler",
    description: "Overcome price & competitor pushback",
    prompt: "How do I handle the 'too expensive' objection?",
  },
  {
    icon: Mail,
    title: "Email Writer",
    description: "Draft a polished follow-up email",
    prompt: "Draft a follow-up email for my lead",
  },
  {
    icon: PhoneCall,
    title: "Call Opener",
    description: "30-second scripts that hook attention",
    prompt: "Write a 30-second cold call opener",
  },
  {
    icon: FileText,
    title: "Deal Summariser",
    description: "Quick recap before your next call",
    prompt: "Summarise this lead for my next call",
  },
];

function PageAgentAssistant() {
  const { data: myLeads = [] } = useMyLeads();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachedLeadId, setAttachedLeadId] = useState<string | undefined>(undefined);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const attachedLead = myLeads.find((l) => l.id === attachedLeadId);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || isTyping) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    const leadContext: LeadContext | undefined = attachedLead
      ? { business: attachedLead.business, industry: attachedLead.industry, status: attachedLead.status }
      : undefined;

    window.setTimeout(() => {
      const reply = getCannedResponse(content, leadContext);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
      setIsTyping(false);
      textareaRef.current?.focus();
    }, 900);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function newChat() {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setAttachedLeadId(undefined);
    toast.success("Started a new chat");
  }

  return (
    <AppShell>
      <PageHeader
        title="AI Sales Assistant"
        subtitle="Get instant coaching on objections, scripts, emails and deal summaries."
        crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "AI Assistant" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="neutral" size="sm">
              Demo assistant · simulated responses
            </Pill>
            <Button variant="outline" onClick={newChat}>
              <RotateCcw className="h-4 w-4" />
              New chat
            </Button>
          </div>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
        {TOOL_CARDS.map((tool) => (
          <button
            key={tool.title}
            onClick={() => send(tool.prompt)}
            className="surface-card group flex items-start gap-3 rounded-xl border border-border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="gradient-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm">
              <tool.icon className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{tool.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{tool.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
        <div className="order-2 space-y-4 xl:sticky xl:top-20">
          <SectionCard title="Suggested prompts" description="Tap to send instantly">
            <div className="space-y-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-left text-xs leading-relaxed text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Context" description="Attach a lead for tailored replies">
            <div className="space-y-3">
              <Select
                value={attachedLeadId ?? "none"}
                onValueChange={(v) => setAttachedLeadId(v === "none" ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Attach a lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No lead attached</SelectItem>
                  {myLeads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.business}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {attachedLead && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Replies will reference {attachedLead.business}'s industry and pipeline status.
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        <SectionCard
          noPadding
          className="order-1 flex h-[min(660px,calc(100vh-250px))] min-h-[520px] flex-col"
          title="Conversation"
          description="Ask for coaching, then refine the answer with a follow-up question."
          action={<Pill tone="neutral" size="sm">{messages.length - 1} messages</Pill>}
        >
          <ScrollArea className="min-h-0 flex-1 px-5 py-5 sm:px-6">
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
              {isTyping && <TypingBubble />}
              <div ref={scrollEndRef} />
            </div>
          </ScrollArea>

          <div className="mt-auto shrink-0 border-t border-border bg-card/60 p-3 sm:p-4">
            {attachedLead && (
              <div className="mb-3 flex w-fit items-center gap-2 rounded-full border border-border bg-secondary/50 py-1 pl-3 pr-1 text-xs">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="font-medium">{attachedLead.business}</span>
                <span className="hidden text-muted-foreground sm:inline">
                  · {attachedLead.industry} · {attachedLead.status}
                </span>
                <button
                  onClick={() => setAttachedLeadId(undefined)}
                  className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Remove attached lead"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about objections, scripts, emails, closing…"
                rows={2}
                className={cn("resize-none bg-background")}
              />
              <Button onClick={() => send()} disabled={!input.trim() || isTyping} className="h-10 w-10 shrink-0 p-0" aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Press Enter to send · Shift + Enter for a new line</p>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
