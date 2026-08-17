export interface LeadContext {
  business: string;
  industry: string;
  status: string;
}

function leadLine(lead?: LeadContext | null): string {
  if (!lead) return "";
  return `\n\nSince you've attached **${lead.business}** (${lead.industry}, currently "${lead.status}"), tailor the language above to their situation — reference their industry directly and use their current status to set the tone (e.g. a warmer nudge if they're already "Interested", or a re-introduction if they're "Not Called" yet).`;
}

interface Topic {
  keywords: string[];
  response: (lead?: LeadContext | null) => string;
}

const topics: Topic[] = [
  {
    keywords: ["too expensive", "price", "pricing", "cost", "afford", "objection"],
    response: (lead) =>
      `Price objections almost always mean the prospect hasn't yet connected the cost to a clear return. Don't discount immediately — reframe first.\n\nTry: "I hear you — a website is an investment, not an expense. Most of our SME clients see it pay for itself within 2-3 new customers a month. What would one extra customer a week be worth to your business?"\n\n- Anchor on value, not price: mention leads, bookings, or sales the site will generate.\n- Offer a phased package (starter site now, e-commerce or booking add-ons later) so the entry cost feels lower.\n- Use a local comparison: "A single boosted Facebook post can cost more per month than our basic hosting plan, with none of the long-term asset."\n- If they still hesitate, ask what budget they *do* have and propose the closest matching package rather than walking away.${leadLine(lead)}`,
  },
  {
    keywords: ["cold call", "opener", "30-second", "phone script", "cold-call"],
    response: (lead) =>
      `A strong opener earns you 15 seconds of attention — use it to be specific and local, not generic.\n\n"Hi [Name], it's [Your name] from Meridian Digital here in Limpopo. I noticed [Business] doesn't have a website / your site hasn't been updated in a while — we've helped a few businesses around [Town] get found on Google and turn that into bookings. Do you have 30 seconds for me to explain how?"\n\n- Lead with something you noticed about *their* business, not your company.\n- Say the town or area name — it builds instant local trust.\n- End with a low-commitment question, not a pitch.\n- If they say "not interested," don't argue — ask "No problem, would it be alright if I sent a quick example of what we built for a similar business?" to keep the door open.${leadLine(lead)}`,
  },
  {
    keywords: ["follow-up email", "follow up email", "email", "follow-up"],
    response: (lead) => {
      const biz = lead?.business ?? "[Business Name]";
      return `Subject: Quick follow-up — ${biz}'s new website\n\nHi [Contact Name],\n\nJust checking in after our chat about getting ${biz} online. I know things get busy, so here's a quick recap:\n\n- A modern, mobile-friendly website that works as hard as you do\n- Google visibility so local customers can actually find you\n- A simple monthly plan with no big upfront costs\n\nI'd love to get 15 minutes on a call this week to show you a couple of examples we've built for similar businesses. Would Tuesday or Wednesday afternoon suit you better?\n\nLooking forward to it,\n[Your Name]\nMeridian Digital${leadLine(lead)}`;
    },
  },
  {
    keywords: ["closing", "close the deal", "close deal", "how do i close"],
    response: (lead) =>
      `Closing works best when it feels like a natural next step, not a hard sell.\n\n- Summarise the value you've agreed on: "So to recap, we're building you a 5-page site with online bookings and Google Business setup for R X/month."\n- Use an assumptive close: "I can have the design draft to you by Friday — shall I get the onboarding form sent over now?"\n- Offer two good options instead of yes/no: "Would you prefer to start with the Starter package now and add e-commerce in month two, or go straight for the full package?"\n- Create gentle urgency honestly: mention your current build slot availability rather than fake discounts.\n- Always end the call with a concrete next action and a date attached to it.${leadLine(lead)}`,
  },
  {
    keywords: ["competitor", "already have a website", "already have", "existing website"],
    response: (lead) =>
      `"We already have a website" is one of the easiest objections to turn into an opportunity — most SME sites in the region are outdated or not built for mobile or Google search.\n\n"That's great that you're already online! Can I ask — when was it last updated, and are you seeing customers come through it?" This usually reveals the gap without you having to criticise their current site.\n\n- Offer a free, no-obligation site audit (load speed, mobile view, Google ranking) — it's a low-pressure way in.\n- Focus on what's missing: online bookings, WhatsApp integration, updated content, security certificates.\n- Position it as a refresh/upgrade rather than a replacement, which feels less like criticism.${leadLine(lead)}`,
  },
  {
    keywords: ["industry pitch", "pitch", "industry", "sme pitch"],
    response: (lead) => {
      const industry = lead?.industry ?? "local SMEs";
      return `For ${industry}, the pitch should connect directly to how their customers actually search and buy:\n\n- Lead with the outcome: more enquiries, more bookings, more walk-ins — not "a website."\n- Show a relevant example or mock-up if you have one from a similar business.\n- Mention mobile-first design — most South African customers browse on their phones first.\n- Reference Google Business Profile setup as part of the package; local search is often the biggest win for SMEs.\n- Keep the first conversation to 3 clear benefits max — don't overload them with features.${leadLine(lead)}`;
    },
  },
  {
    keywords: ["summarise", "summarize", "summary", "lead summary", "recap"],
    response: (lead) => {
      if (!lead) {
        return `Attach a lead from the Context panel and I'll pull together a quick summary of their business, industry and current pipeline status so you can prep for your next call.`;
      }
      return `Here's a quick summary for **${lead.business}**:\n\n- Industry: ${lead.industry}\n- Current status: ${lead.status}\n- Suggested next step: ${
        lead.status === "Not Called"
          ? "Make the first outreach call using a short, localised opener."
          : lead.status === "Interested"
            ? "Send a follow-up email with a proposal or pricing options while momentum is warm."
            : lead.status === "Proposal Sent"
              ? "Follow up to answer objections and move toward closing."
              : "Check in to confirm details and keep the relationship warm."
      }\n\nWant me to draft the outreach message for this lead?`;
    },
  },
];

export function getCannedResponse(input: string, lead?: LeadContext | null): string {
  const lower = input.toLowerCase();
  for (const topic of topics) {
    if (topic.keywords.some((k) => lower.includes(k))) {
      return topic.response(lead);
    }
  }
  return `Good question. While I don't have a specific script for that yet, here's some general guidance:\n\n- Keep your message short and focused on one clear outcome for the customer.\n- Always speak to their business by name and mention something specific you noticed about them.\n- End every interaction with a clear next step and a date.\n\nTry rephrasing with a keyword like "pricing," "cold call," "follow-up email," "closing," "competitor," or "summarise lead" and I can give you a more tailored answer.${leadLine(lead)}`;
}

export const SUGGESTED_PROMPTS: string[] = [
  "Draft a follow-up email for Tshivenda Construction",
  "How do I handle 'we already have a website'?",
  "Write a 30-second opener for a dental practice",
  "How do I handle the 'too expensive' objection?",
  "Give me tips on closing a hesitant lead",
  "Pitch our services to a retail store owner",
  "Summarise this lead for my next call",
  "How do I follow up after no response for a week?",
];
