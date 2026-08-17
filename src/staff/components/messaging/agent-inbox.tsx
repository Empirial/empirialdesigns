import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useAgents } from "@staff/lib/agents-data";
import { firebaseAuth, getMockStaffProfile } from "@staff/lib/auth";
import { db } from "@staff/lib/firebase";
import { cn } from "@staff/lib/utils";
import { Button } from "@staff/components/ui/button";
import { Textarea } from "@staff/components/ui/textarea";

type Message = { id: string; agentUid: string; senderUid: string; body: string; sentAt: Date | null };

function dateLabel(date: Date | null) {
  if (!date) return "Today";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function isNewDay(message: Message, previous?: Message) {
  return !previous || !message.sentAt || !previous.sentAt || message.sentAt.toDateString() !== previous.sentAt.toDateString();
}

export function AgentInbox({ admin, initialAgentId }: { admin: boolean; initialAgentId?: string }) {
  const { data: agents = [] } = useAgents({ enabled: admin });
  const mockProfile = getMockStaffProfile();
  const myUid = firebaseAuth.currentUser?.uid;
  const [selectedAgentId, setSelectedAgentId] = useState(initialAgentId ?? "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const agentId = admin ? selectedAgentId : myUid ?? "";
  const selectedAgent = useMemo(() => agents.find((agent) => agent.id === agentId), [agents, agentId]);

  useEffect(() => {
    if (admin && initialAgentId) setSelectedAgentId(initialAgentId);
  }, [admin, initialAgentId]);

  useEffect(() => {
    if (!agentId || mockProfile) { setMessages([]); return; }
    return onSnapshot(
      query(collection(db, "agentMessages"), where("agentUid", "==", agentId), orderBy("sentAt", "asc")),
      (snapshot) => setMessages(snapshot.docs.map((doc) => {
        const data = doc.data();
        return { id: doc.id, agentUid: data.agentUid, senderUid: data.senderUid, body: data.body ?? "", sentAt: data.sentAt?.toDate?.() ?? null };
      })),
      (error) => toast.error(error.message || "Couldn't load this conversation."),
    );
  }, [agentId, mockProfile]);

  useEffect(() => {
    const messagesPane = messagesRef.current;
    if (messagesPane) messagesPane.scrollTo({ top: messagesPane.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    const message = body.trim();
    if (!message || !agentId) return;
    if (!myUid || mockProfile) { toast.info("Messaging is available with a live staff account."); return; }
    setSending(true);
    try {
      await addDoc(collection(db, "agentMessages"), { agentUid: agentId, senderUid: myUid, body: message, sentAt: serverTimestamp() });
      setBody("");
      toast.success("Message sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't send the message.");
    } finally { setSending(false); }
  }

  return (
    <div className={cn("surface-card grid h-[calc(100dvh-7rem)] min-h-[540px] grid-cols-1 overflow-hidden p-0", admin && "md:grid-cols-[240px_minmax(0,1fr)]")}>
      {admin ? <aside className="border-b border-border bg-muted/25 p-3 md:border-b-0 md:border-r">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Agents</p>
        <div className="space-y-1">{agents.map((agent) => <button key={agent.id} onClick={() => setSelectedAgentId(agent.id)} className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm", agent.id === agentId ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted")}>
          <span className={cn("size-2 rounded-full", agent.online ? "bg-success" : "bg-muted-foreground")} /><span className="truncate">{agent.name}</span>
        </button>)}</div>
      </aside> : null}
      <section className="flex min-h-0 min-w-0 flex-col">
        <div className="border-b border-border bg-background px-5 py-4"><p className="font-semibold">{admin ? selectedAgent?.name ?? "Choose an agent" : "Message your admin"}</p><p className="text-xs text-muted-foreground">Private admin ↔ agent conversation</p></div>
        <div ref={messagesRef} className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-contain bg-muted/[0.08] p-5">{!agentId ? <p className="text-sm text-muted-foreground">Choose an agent to begin.</p> : messages.length ? messages.map((message, index) => <Fragment key={message.id}>{isNewDay(message, messages[index - 1]) ? <div className="my-2 flex items-center gap-3 text-[11px] font-medium text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border"><span>{dateLabel(message.sentAt)}</span></div> : null}<div className={cn("w-fit max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm", message.senderUid === myUid ? "ml-auto bg-primary text-primary-foreground" : "mr-auto bg-background text-foreground ring-1 ring-border")}>{message.body}<p className="mt-1.5 text-[10px] opacity-70">{message.sentAt?.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }) ?? "Sending…"}</p></div></Fragment>) : <p className="m-auto text-sm text-muted-foreground">No messages yet. Start the conversation below.</p>}</div>
        <div className="flex items-end gap-3 border-t border-border bg-background p-4"><Textarea value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} disabled={!agentId || sending} placeholder="Write a message…" className="min-h-12 max-h-32 flex-1 resize-none" /><Button size="icon" className="size-12 shrink-0 rounded-xl" disabled={!body.trim() || !agentId || sending} onClick={() => void send()} aria-label="Send message"><Send className="size-4" /></Button></div>
      </section>
    </div>
  );
}
