import { useEffect, useState } from "react";
import type { TrainingLesson } from "./sales-training-data";

// The real Module 6 assessment from the EmpirialDesigns Sales Agent & Client
// Acquisition Mini Course manual — one question per pillar, converted from
// the manual's open Q&A format to multiple choice using the facilitator
// answer key as the correct option. Score 4/5+ to pass, matching the manual.
export const EXAM_QUESTIONS = [
  {
    question: "Sales Fundamentals (Gitomer) — What should a salesperson focus on instead of \"pushing\" a sale?",
    options: [
      "Push harder and repeat the pitch until they say yes",
      "Give people a real reason to want to buy — build trust and lower their perceived risk",
      "Offer the lowest price immediately to remove hesitation",
    ],
    answer: 1,
  },
  {
    question: "Prospecting & Leads (Iannarino) — What's the first small \"commitment\" every salesperson needs before pitching anything?",
    options: [
      "The commitment for time — a small yes to keep the conversation going",
      "A signed contract",
      "A deposit payment",
    ],
    answer: 0,
  },
  {
    question: "Communication (Victor Antonio) — Name the three value levers every buyer ultimately cares about.",
    options: [
      "Price, features, and speed of delivery",
      "Trust, likability, and charisma",
      "Increasing revenue, reducing costs, and expanding reach or market share",
    ],
    answer: 2,
  },
  {
    question: "Closing Deals (Hormozi) — What are the four elements of the Value Equation?",
    options: [
      "Price, Product, Promotion, Place",
      "Discovery, Pitch, Objection, Close",
      "Dream Outcome, Perceived Likelihood of Achievement, Time Delay, and Effort & Sacrifice",
    ],
    answer: 2,
  },
  {
    question: "Business Growth (Gitomer) — What does \"the sale begins after the sale\" mean?",
    options: [
      "The real relationship-building — follow-up, referrals, ongoing service — happens after the first purchase",
      "You should always upsell immediately at the moment of closing",
      "Commission is only paid 30 days after the invoice",
    ],
    answer: 0,
  },
] as const;

export const COURSE_STORAGE_KEY = "empirial-sales-agent-course";

/**
 * Course-completion tracking, shared between the Academy overview page and
 * each lesson's detail page. Client-local (localStorage) for now — there's
 * no per-agent Firestore field for this yet, same limitation the old
 * inline accordion on agent.scripts.tsx had.
 */
export function useCourseProgress(lessons: TrainingLesson[]) {
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => {
    try {
      const saved = window.localStorage.getItem(COURSE_STORAGE_KEY);
      return new Set<string>(saved ? JSON.parse(saved).lessons ?? [] : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify({ lessons: [...completedLessons] }));
    } catch {
      // The course remains usable even if browser storage is unavailable.
    }
  }, [completedLessons]);

  const toggleLesson = (id: string) => {
    setCompletedLessons((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completedCount = lessons.filter((lesson) => completedLessons.has(lesson.id)).length;
  const courseComplete = lessons.length > 0 && completedCount === lessons.length;

  return { completedLessons, toggleLesson, completedCount, courseComplete };
}
