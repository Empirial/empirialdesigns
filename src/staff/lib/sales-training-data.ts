import { useQuery } from "@tanstack/react-query";
import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore";

import { getMockStaffProfile } from "./auth";
import { db } from "./firebase";

export type TrainingLesson = {
  id: string;
  title: string;
  duration: string;
  summary: string;
  points: string[];
  order: number;
  // Added for the real EmpirialDesigns Sales Agent & Client Acquisition Mini
  // Course (see docs/CRM_STAFF_PORTAL.md) — the source manual is full prose
  // per module, not just bullet points, so these carry the full lesson text,
  // its hands-on activity and closing takeaway. All optional so older/custom
  // lessons (including anything uploaded via the JSON importer in
  // admin.scripts.tsx) keep working with just title/summary/points.
  body?: string;
  // The source manual's "Activity" was written for a live, facilitator-led
  // session ("pair up two trainees", "ask the trainee directly") — it
  // doesn't work as self-serve web content, so the lesson page renders a
  // real quiz instead when `quiz` is present. `activity` is kept for any
  // lesson that hasn't been given quiz questions yet (falls back to plain
  // text), and for the facilitator-notes use case if this course is ever
  // run live again.
  activity?: string;
  quiz?: { question: string; options: string[]; answer: number }[];
  keyTakeaway?: string;
  mentors?: string[];
};

export const DEFAULT_SALES_LESSONS: TrainingLesson[] = [
  {
    id: "module-0-welcome",
    title: "Module 0 · Welcome & Course Overview",
    duration: "3 min",
    summary:
      "Understand what this course covers, why client acquisition matters at EmpirialDesigns, and what “passing” looks like.",
    points: [
      "This course maps directly onto the Certified Sales Professional certificate: Sales Fundamentals, Prospecting & Leads, Communication, Closing Deals, Business Growth.",
      "Five modules, each with a short teaching section and a hands-on activity — the activity matters as much as the teaching.",
      "A five-question assessment covers all five pillars. Score 4/5 or better to earn the Certified Sales Professional certificate.",
    ],
    body:
      `Welcome to the EmpirialDesigns Sales Agent & Client Acquisition Mini Course. Over the next forty-five minutes, you're going to build the foundation you need to represent EmpirialDesigns on real calls, with real business owners, and turn those conversations into paying clients. This isn't a course to memorise and forget. Every pillar in it maps directly onto the certificate you're working toward — Sales Fundamentals, Prospecting & Leads, Communication, Closing Deals, and Business Growth. Those five pillars aren't decorative. They're the five things that actually determine whether you close a deal or lose one, and each is built on the thinking of a real, proven sales expert rather than a generic script pulled from nowhere.

Here's how the next forty-five minutes work: five modules, each with a short teaching section followed by a hands-on activity. The activities matter as much as the teaching, arguably more — sales is a skill built by doing it, not by hearing about it once and nodding along. At the end, you'll sit a short five-question assessment covering all five pillars and the frameworks behind them. Score four out of five or better, and you're certified as an EmpirialDesigns Sales Professional, with a signed certificate to show for it.

Before we start, sit with one honest question: what's the one thing that's made you feel unsure or hesitant on a sales call before? Hold onto your answer. We're going to address it, piece by piece, as we move through the five modules ahead.`,
    activity:
      `Take two minutes. Ask the trainee directly: “What's one thing that's stopped you from feeling confident on a sales call before?” Don't rush past the answer — write it down. Whatever they name — fear of rejection, not knowing what to say when someone pushes back, feeling pushy — will very likely be addressed directly in one of the next five modules. Noting it now gives you a natural moment to circle back at the end of the course and show them exactly how it was covered.`,
    quiz: [
      {
        question: "What score do you need on the final assessment to earn the Certified Sales Professional certificate?",
        options: ["3 out of 5 (60%)", "4 out of 5 (80%)", "A perfect 5 out of 5 (100%)"],
        answer: 1,
      },
      {
        question: "The course's five pillars are Sales Fundamentals, Prospecting & Leads, Communication, Closing Deals, and…",
        options: ["Business Growth", "Product Knowledge", "Time Management"],
        answer: 0,
      },
    ],
    keyTakeaway:
      "Five pillars, five modules, one certificate. The activities build the skill — don't skip them.",
    order: 1,
  },
  {
    id: "module-1-fundamentals",
    title: "Module 1 · Sales Fundamentals",
    duration: "8 min",
    summary:
      "Ground your approach to selling in buyer psychology and the philosophy that people love to buy — they simply don't like being sold to.",
    points: [
      "[Gitomer] People don't like to be sold, but they love to buy — give them a real reason to want to buy, don't push a pitch until they cave.",
      "[Gitomer] Nearly every objection is a disguised risk concern — lower the risk with proof and examples, and objections often dissolve on their own.",
      "[Sales Feed] People decide emotionally first, then build the logical case afterward — open the emotional door, then hand over the logical reasons.",
      "[Sales Feed] Drop sales folklore like “always be closing” if it doesn't match how people actually decide.",
      "[Gitomer] Passion is visible and can't be faked — believe in the value first, the script is just the vehicle.",
    ],
    body:
      `[GITOMER] Jeffrey Gitomer, a veteran of the sales industry for over three decades, built his entire philosophy around one simple but easily forgotten idea: people don't like to be sold, but they love to buy. Read that twice, because it changes how you should think about every single call you make. Your job on a call is never to push a pitch at someone until they cave in. Your job is to give them a real, honest, specific, well-communicated reason to want to buy from you. Shift your mindset that way, and your tone changes automatically — you stop pushing and start inviting.

[GITOMER] His second insight is just as practical: nearly every objection a prospect raises is really a disguised risk concern. When someone says “I need to think about it,” they usually mean “I'm not sure this will actually work for me,” or “I don't want to look foolish for saying yes to the wrong thing,” or simply “I don't want to waste money.” Hear the real risk hiding underneath the objection, and you can address it directly — with proof, with examples of similar businesses you've helped, with a clear explanation of what happens if something goes wrong. Lower the risk, and a surprising number of objections dissolve on their own.

[SALES FEED] Sales Feed, a research-driven sales education brand built on studies of buyer psychology and decision-making science, backs this up from a different angle. Their research consistently shows that people make buying decisions emotionally first, and only afterward build the logical case that justifies the decision to themselves and to others. This isn't a manipulation tactic — it's simply how the human brain works. For the business owners you'll be calling, the emotional trigger is usually the fear of losing customers to a competitor, or the discomfort of looking unprofessional online. The logical justification that follows is usually about price, features, or timelines. Speak to both: open the emotional door first, then hand them the logical reasons afterward so they can justify the decision to themselves, their partner, or their accountant.

[SALES FEED] Sales Feed also pushes back hard against sales folklore — tactics that sound smooth and confident but don't hold up once you look at how people genuinely make decisions. “Always be closing” is a classic example: hammering toward a close at every opportunity, regardless of where the prospect actually is in their thinking, tends to create pressure and resistance rather than trust. If a tactic doesn't match how people actually decide, drop it, no matter how often you've heard it repeated elsewhere.

[GITOMER] Finally, remember Gitomer's point about passion: it's visible, and it can't be faked convincingly for long. If you don't genuinely believe that what EmpirialDesigns builds will help the business owner on the other end of the phone, they will sense it within the first thirty seconds, no matter how polished your script sounds. Believe in the value first — the script is just the vehicle that carries it.`,
    activity:
      `Pair up two trainees, or reflect solo if working one-on-one. Give two minutes: “Think of something you bought recently — anything, big or small. What made it feel like you chose to buy it, rather than feeling sold to?” Have them identify the emotional trigger first, then the logical justification they used afterward. Debrief as a group: most people notice the emotional trigger came first, even when they insist they're “logical buyers.”`,
    quiz: [
      {
        question: "According to Gitomer, nearly every objection a prospect raises is really a disguised…",
        options: ["Risk concern", "Attempt to negotiate a discount", "Sign they're not interested at all"],
        answer: 0,
      },
      {
        question: "According to Sales Feed's research, in what order do people actually make buying decisions?",
        options: ["Logically first, then justify emotionally", "Emotionally first, then build the logical case afterward", "Purely on price, with no emotional component"],
        answer: 1,
      },
    ],
    keyTakeaway:
      "People buy because they want to, not because they're pushed. Give them a real reason, lower their risk, and let logic follow emotion.",
    mentors: ["Jeffrey Gitomer", "Sales Feed"],
    order: 2,
  },
  {
    id: "module-2-prospecting",
    title: "Module 2 · Prospecting & Leads",
    duration: "8 min",
    summary:
      "Learn how to find, qualify, and approach the right prospects before ever picking up the phone to pitch.",
    points: [
      "[Iannarino] Closing starts with prospecting — earn the “commitment for time” (the small yes to keep talking) before you pitch anything.",
      "Open with a specific, honest reason for the call, not a mini-pitch — “I noticed your business doesn't show up when I searched for [service] near [area]” beats “We build websites for businesses.”",
      "Lead sources: referrals, local directories, community groups, drive-bys, warm introductions — each carries a different level of trust.",
      "[Sales Feed] Qualify on real urgency the prospect already feels, not manufactured pressure like countdown timers or fake scarcity.",
      "[Iannarino] Use the Sales Playbook's Industry Playbook Cards — know the pain point and opening hook line before you dial.",
    ],
    body:
      `[IANNARINO] Anthony Iannarino, author of The Lost Art of Closing and one of the most respected voices in B2B sales strategy, makes a point a lot of salespeople miss: closing starts with prospecting. You cannot close a deal you never opened, and every sale is really a chain of small commitments, not one big dramatic yes at the end. The very first commitment you need from any prospect — before you've pitched a single feature — is what Iannarino calls the commitment for time: the small yes that says “okay, I'll give you two minutes.” Skip past earning that and launch straight into your pitch, and you've built the entire call on a foundation that was never actually agreed to.

In practical terms for EmpirialDesigns agents, this means your opening line on any call isn't a mini-pitch. It's a request, framed around a specific, honest reason you're calling this particular business today. “I noticed your business doesn't show up when I searched for [service] near [area]” earns attention and, often, that first small yes to keep talking. A generic “We build websites for businesses” does not.

Where do these leads actually come from? Referrals from happy clients, local business listings and directories, community and small-business social media groups, physical drive-bys or site visits where you can see the gap firsthand, and warm introductions through people who already know and trust you. Each source carries a different level of trust already attached to it — a referral starts miles ahead of a cold call, and you should treat it that way in how confidently you open the conversation.

[SALES FEED] Sales Feed's research adds an important layer to qualifying a lead. It's tempting to qualify purely on budget and decision-making authority — does this person have the money, and can they say yes? But their research points to something equally important: is this prospect already feeling the pain point strongly enough, right now, to want to act? Urgency you try to manufacture on a call — countdown timers, fake scarcity — rarely converts as well as urgency the prospect already feels because they just lost a booking, or a competitor just outranked them on Google. Listen for that real urgency in discovery, and lean into it honestly rather than inventing pressure that isn't there.

[IANNARINO] Iannarino frames the whole activity of prospecting as an act of value creation rather than an interruption. Every call should hand the prospect something useful — an insight about their own business they hadn't quite articulated — rather than simply announcing what EmpirialDesigns sells. This is exactly why the Sales Playbook's Industry Playbook Cards exist: before you dial a plumber, a guesthouse owner, or a salon owner, you should already know their most common pain point and have an opening hook line ready that's specific to their world, not the generic company pitch.`,
    activity:
      `Give the trainee three real or hypothetical local businesses to work through — a plumber, a guesthouse, and a hair salon. For each, have them open the Sales Playbook, find the matching Industry Card, identify the pain point that fits, and read out loud the opening hook line they'd use. Then push one step further: for each business, have them name the specific small “commitment for time” they'd ask for before pitching anything at all — the exact first question or line that earns permission to keep talking.`,
    quiz: [
      {
        question: "What does Iannarino call the very first small \"yes\" you need from a prospect, before pitching anything?",
        options: ["The commitment for time", "A verbal agreement to buy", "Their email address"],
        answer: 0,
      },
      {
        question: "Per Sales Feed's research, what should you qualify a lead on instead of manufactured pressure like countdown timers?",
        options: ["Their job title", "Real urgency the prospect already feels", "How quickly they answer the phone"],
        answer: 1,
      },
    ],
    keyTakeaway:
      "Earn the right to keep talking before you pitch. Lead with insight, not a feature list, and qualify on real urgency, not manufactured pressure.",
    mentors: ["Anthony Iannarino", "Sales Feed"],
    order: 3,
  },
  {
    id: "module-3-communication",
    title: "Module 3 · Communication",
    duration: "8 min",
    summary:
      "Master the structure of a sales call and handle objections with genuine confidence, not memorised deflection.",
    points: [
      "[Antonio] Buyers ultimately care about three things: increasing revenue, reducing costs, or expanding reach — translate every feature into one of the three.",
      "Every call follows the same shape: Opening, Discovery, Pitch, Objection Handling, Close — don't rush past Discovery.",
      "Objection formula: Acknowledge the concern, Reframe around the real risk, Return a question to check they're still with you.",
      "[Antonio] Silence is a tool, not a gap to fill — state the price, then let the silence do some of the work.",
      "[Gitomer] Never argue about price — bring it back to value, and never discount unprompted.",
    ],
    body:
      `[ANTONIO] Victor Antonio built a career — twenty years as a top sales executive followed by years as a sales trainer and consultant — around a deceptively simple observation: however complex the business, buyers ultimately care about only three things. Increasing their revenue. Reducing their costs. Or expanding their reach and market share. Every feature of every EmpirialDesigns service can and should be translated into one of those three levers on a call. A quote request form isn't just “a feature” — it's a way to capture revenue that would otherwise be lost. Automated AI replies aren't just “nice to have” — they reduce the cost of a staff member's time. Local SEO isn't just visibility — it directly expands market reach into searches you weren't winning before. Make that translation explicit on every call, and your pitch stops sounding like a features list and starts sounding like a business case.

Every call, regardless of which of the six services you're pitching, should follow the same underlying shape: Opening, Discovery, Pitch, Objection Handling, Close. The single most common mistake new agents make is rushing past discovery to get to the pitch faster. Resist that urge. Discovery is where you find out what actually matters to this specific business owner, and everything you say in the pitch afterward should be built from what you learned there, not recited from memory regardless of who's listening.

When an objection comes up — and it will, on almost every call — use the same three-step formula every time: Acknowledge the concern honestly, Reframe it in a way that addresses the real risk underneath it, then Return the question to check the prospect is genuinely with you before moving on.

“That's a fair point — here's how we usually think about it... Does that make sense?”

The return question matters more than it might seem. It turns a monologue back into a conversation and gives you a genuine read on whether you've actually resolved the concern, or just talked over it.

[ANTONIO] Victor Antonio also teaches a negotiation principle that's easy to forget in the moment: silence is a tool, not a gap to be filled. Once you've stated your case, or stated a price, resist the very human urge to keep talking to fill the quiet. In negotiation psychology, whoever speaks first after a price is on the table often ends up conceding something — offering a discount nobody asked for, or over-explaining in a way that undermines the value you just built. Say the number, and let the silence do some of the work for you.

[GITOMER] Jeffrey Gitomer's advice pairs naturally with this: never argue about price. The moment a call turns into a back-and-forth over whether the price is “fair,” you've already lost the value frame you built earlier in the call. Instead, bring the conversation back to the value delivered — what specifically changes for their business once this is live. And resist the instinct to discount your way to a yes. A quick, unprompted discount quietly signals to the prospect that your original number wasn't the real value in the first place, which can do more damage to trust than the objection itself ever could.`,
    activity:
      `Run this as a role-play in pairs, three minutes total. One trainee plays the prospect and raises two objections drawn from the Sales Playbook for any service of their choice. The other plays the agent and works through Acknowledge, Reframe, Return for each one. Once both objections have been handled, add the negotiation layer: have the “agent” state a price or next step out loud, and then both trainees practise sitting in three full seconds of real silence before either one speaks again. It will feel uncomfortable the first time — that discomfort is exactly the muscle this activity is building.`,
    quiz: [
      {
        question: "Victor Antonio says every buyer ultimately cares about increasing revenue, reducing costs, and…",
        options: ["Expanding reach or market share", "Getting the lowest possible price", "Working with a well-known brand"],
        answer: 0,
      },
      {
        question: "What's the three-step formula for handling an objection?",
        options: ["Agree, Discount, Close", "Acknowledge, Reframe, Return", "Interrupt, Correct, Move on"],
        answer: 1,
      },
    ],
    keyTakeaway:
      "Translate features into revenue, cost, or reach. Handle objections with Acknowledge, Reframe, Return. And don't be afraid of silence — it's doing work for you.",
    mentors: ["Victor Antonio", "Jeffrey Gitomer"],
    order: 4,
  },
  {
    id: "module-4-closing",
    title: "Module 4 · Closing Deals",
    duration: "8 min",
    summary:
      "Apply proven closing frameworks that turn well-run conversations into signed, paying clients.",
    points: [
      "[Hormozi] Value Equation: Value = (Dream Outcome × Perceived Likelihood of Achievement) ÷ (Time Delay × Effort & Sacrifice) — raise value without touching price.",
      "[Iannarino] Ten Commitments: closing is the last in a chain of small yeses (time, exploring, considering change, collaborating, consensus, deciding), not one dramatic ask.",
      "Two closes: the assumptive close (“Should I get your business details now...”) for clear buying signals, and the soft close (“Would it help if I sent two or three examples...”) when they're not quite ready.",
      "[Antonio] Never trade a concession for nothing — get something back (a faster decision, a testimonial, a referral).",
    ],
    body:
      `[HORMOZI] Alex Hormozi, the entrepreneur and author behind $100M Offers, built one of the most widely used frameworks in modern sales and marketing: the Value Equation. It states that Value equals Dream Outcome multiplied by Perceived Likelihood of Achievement, divided by Time Delay multiplied by Effort and Sacrifice. In plain terms: people don't just weigh what an outcome is worth to them, they weigh how confident they are it'll actually happen, how long it'll take, and how much work it's going to cost them personally to get there. Crucially, Hormozi's insight is that you can dramatically increase how valuable your offer feels without ever touching the price, by working on the other three elements instead.

Applied directly to EmpirialDesigns' services, this becomes very concrete. The Dream Outcome is the transformation itself — not “a website” but “customers finding you first, every time they search.” Perceived Likelihood of Achievement is built through proof: showing example sites, mentioning the walkthrough and testing every project goes through before handover, pointing to real businesses like theirs that you've already helped. Time Delay is attacked directly by specifics like “5 to 10 working days” rather than a vague “soon” — the shorter and more concrete the timeline sounds, the higher the perceived value. And Effort and Sacrifice drops the moment you say “we handle it, you just approve it,” removing friction from the client's side of the deal, which is often worth more to them than a discount would be.

[IANNARINO] Anthony Iannarino's Ten Commitments framework, from The Lost Art of Closing, reinforces why this approach works better than one single dramatic ask at the end of a call. Iannarino argues that closing was never really about a final moment of pressure — it's the last in a series of smaller commitments a prospect makes along the way: the commitment to give you time, to explore the idea, to consider changing what they currently do, to collaborate with you on the details, to build consensus with a partner or colleague if needed, and eventually, to decide. Earn each of those smaller yeses genuinely through the call — through discovery, through the pitch, through resolving objections properly — and the final close stops feeling like a leap. It starts feeling like the obvious next step both people already know is coming.

With that foundation in place, you have two practical closing moves to choose from. The assumptive close treats the sale as already decided and moves straight into logistics: “Should I get your business details now so we can start on your Home and Contact pages this week?” This works well once you've picked up clear buying signals — questions about timelines, about what happens after signup, about specific pricing detail. The soft close is for a prospect who isn't quite ready to commit fully yet, offering a smaller, lower-risk next step instead: “Would it help if I sent two or three example sites, so you have something real to look at before deciding?” Neither close is inherently better — the skill is in reading which one the moment calls for.

[ANTONIO] One more principle from Victor Antonio belongs here: never trade a concession for nothing. If a prospect pushes for a lower price, or asks you to add something extra to the scope, that's a legitimate negotiation moment, and you can absolutely say yes — but get something back in return. A faster decision today instead of “I'll think about it.” A written testimonial once the project is live. An introduction to another business owner who might need the same thing. Every concession given away for free quietly teaches a prospect that your original offer had room to move, which weakens your position on the very next call with them.`,
    activity:
      `Each trainee picks one of the six EmpirialDesigns services from the Sales Playbook and delivers a thirty-second close, live, to the group or trainer — either an assumptive close or a soft close, their choice, depending on the scenario they imagine themselves in. Immediately afterward, have them name out loud which lever of Hormozi's Value Equation their close leaned on hardest — did they sell the outcome, the proof, the speed, or the ease? There's no wrong answer, but naming it builds the habit of noticing which lever you're pulling on every real call going forward.`,
    quiz: [
      {
        question: "What are the four elements of Hormozi's Value Equation?",
        options: [
          "Price, Product, Promotion, Place",
          "Dream Outcome, Perceived Likelihood of Achievement, Time Delay, and Effort & Sacrifice",
          "Discovery, Pitch, Objection, Close",
        ],
        answer: 1,
      },
      {
        question: "Per Victor Antonio, if a prospect pushes for a concession, what should you always get in return?",
        options: ["Nothing — just give it to keep the deal moving", "Something back — a faster decision, a testimonial, a referral", "A written apology for negotiating"],
        answer: 1,
      },
    ],
    keyTakeaway:
      "Raise perceived value through outcome, proof, speed, and ease — not just price. Earn the small commitments along the way, and the final close takes care of itself.",
    mentors: ["Alex Hormozi", "Anthony Iannarino", "Victor Antonio"],
    order: 5,
  },
  {
    id: "module-5-growth",
    title: "Module 5 · Business Growth",
    duration: "6 min",
    summary:
      "Build long-term client relationships that contribute to consistent, compounding business growth — not just one-off wins.",
    points: [
      "[Iannarino] The sale is the start of the relationship, not the end — AI Automation and SEO are recurring, monthly relationships, not once-off transactions.",
      "[Gitomer] “The sale begins after the sale” — the real business-building work happens after the invoice is paid.",
      "Build a simple check-in habit after every handover: “How's the site working for you? Getting the enquiries you were hoping for?”",
      "Track your numbers — calls made, conversion rate, average deal size. Sales is a numbers game you can only improve once you can see the score.",
    ],
    body:
      `[IANNARINO] It's tempting to treat a signed deal as the finish line. Anthony Iannarino's account management philosophy pushes back hard on that instinct: the sale is the start of the relationship, not the end of it. The agents who consistently outperform their peers over the long run aren't necessarily the ones who close the most first-time deals — they're the ones who become a trusted advisor to their clients rather than staying a one-time vendor. At EmpirialDesigns, that distinction carries real financial weight, because several of the six services — AI Automation, SEO & Social Media Management — are monthly, recurring relationships, not once-off transactions. A client who trusts you as an advisor renews. A client who only remembers you as “the person who built the site” doesn't.

[GITOMER] Jeffrey Gitomer captures the same idea from a different angle with a phrase worth remembering word for word: the sale begins after the sale. The real business-building work — the follow-up message a week later, the referral you ask for once a client is genuinely happy, the small ongoing service touches that keep you top of mind — happens after the invoice is paid, not during the pitch that got you there. Too many agents treat the moment of closing as the finish line and then go quiet. That silence is exactly where relationships, and future revenue, quietly die.

In practice, this means building a simple check-in habit after every handover. A short message — “How's the site working for you? Getting the enquiries you were hoping for?” — does two things at once: it builds real trust by showing you actually care whether the thing worked, and it naturally opens the door to upsell conversations later, whether that's suggesting the SEO package once they mention wanting more traffic, or the AI Automation Starter tier once they mention a task eating their time.

None of this works without visibility into your own numbers. Track how many calls you make, what percentage convert, and your average deal size. Sales, for all the psychology and framework behind it, is still fundamentally a numbers game — and it's a game you can only improve once you can actually see the score.

Finally, remember that every call you make represents more than just your own commission. EmpirialDesigns' own positioning — “Change Is Inevitable” — isn't just a tagline on a certificate. It's the actual reason a business owner should want to pick up the phone for you: to help them modernise before change happens to them instead of for them.`,
    activity:
      `Ask the trainee to name one real or hypothetical client relationship from their own experience, and describe how they'd turn it into either a trusted-advisor relationship in Iannarino's sense, or a referral source in Gitomer's sense, within their first month working with that client. Push for specifics: what exact message would they send, and when?`,
    quiz: [
      {
        question: "What does Gitomer mean by \"the sale begins after the sale\"?",
        options: [
          "You should always upsell immediately at the moment of closing",
          "The real relationship-building — follow-up, referrals, ongoing service — happens after the first purchase",
          "Commission is only paid once a second sale is made",
        ],
        answer: 1,
      },
      {
        question: "Which two of EmpirialDesigns' six services are recurring, monthly relationships rather than once-off?",
        options: ["Business Website and Poster Design", "Application Development and Custom Software Development", "AI Automation and SEO & Social Media Management"],
        answer: 2,
      },
    ],
    keyTakeaway:
      "The close is the beginning, not the end. Follow up, check in, and ask for referrals — that's where long-term revenue actually comes from.",
    mentors: ["Anthony Iannarino", "Jeffrey Gitomer"],
    order: 6,
  },
];

const STORAGE_KEY = "empirial-sales-training-lessons";

function storedLessons(): TrainingLesson[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SALES_LESSONS;
    const parsed = JSON.parse(stored) as TrainingLesson[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SALES_LESSONS;
  } catch {
    return DEFAULT_SALES_LESSONS;
  }
}

function sortLessons(lessons: TrainingLesson[]) {
  return [...lessons].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function useSalesTrainingLessons() {
  return useQuery({
    queryKey: ["salesTrainingLessons"],
    queryFn: async () => {
      if (getMockStaffProfile()) return sortLessons(storedLessons());
      const snap = await getDocs(collection(db, "salesTrainingLessons"));
      const lessons = snap.docs.map((lesson) => ({ id: lesson.id, ...lesson.data() }) as TrainingLesson);
      return lessons.length ? sortLessons(lessons) : DEFAULT_SALES_LESSONS;
    },
  });
}

// Strips undefined values (e.g. an admin clearing the optional body/activity/
// keyTakeaway/mentors fields added for the Sales Course) — the Firestore SDK
// throws on `undefined` field values by default, unlike a plain object merge.
function withoutUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export async function saveSalesTrainingLesson(lesson: Omit<TrainingLesson, "id"> & { id?: string }) {
  if (getMockStaffProfile()) {
    const lessons = storedLessons();
    const id = lesson.id ?? `lesson-${Date.now()}`;
    const next = lesson.id
      ? lessons.map((item) => (item.id === id ? { ...lesson, id } : item))
      : [...lessons, { ...lesson, id }];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortLessons(next)));
    return;
  }
  if (lesson.id) {
    const { id, ...data } = lesson;
    await setDoc(doc(db, "salesTrainingLessons", id), { ...withoutUndefined(data), updatedAt: serverTimestamp() }, { merge: true });
  } else {
    await addDoc(collection(db, "salesTrainingLessons"), { ...withoutUndefined(lesson), updatedAt: serverTimestamp() });
  }
}

export async function deleteSalesTrainingLesson(id: string) {
  if (getMockStaffProfile()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedLessons().filter((lesson) => lesson.id !== id)));
    return;
  }
  await deleteDoc(doc(db, "salesTrainingLessons", id));
}

export async function replaceSalesTrainingLessons(lessons: TrainingLesson[]) {
  if (getMockStaffProfile()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortLessons(lessons)));
    return;
  }
  const existing = await getDocs(collection(db, "salesTrainingLessons"));
  if (existing.size + lessons.length > 450) throw new Error("This course is too large to upload at once.");
  const batch = writeBatch(db);
  existing.docs.forEach((lesson) => batch.delete(lesson.ref));
  lessons.forEach(({ id, ...lesson }) => batch.set(doc(collection(db, "salesTrainingLessons")), { ...lesson, updatedAt: serverTimestamp() }));
  await batch.commit();
}
