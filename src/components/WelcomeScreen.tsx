"use client";

import { IconSparkles } from "./icons";

interface Props {
  onSelectSuggestion: (question: string) => void;
}

const SUGGESTIONS = [
  "Prove sin²θ + cos²θ = 1 step by step",
  "Explain Newton's second law with an example",
  "Balance the equation: Fe + O₂ → Fe₂O₃",
  "Difference between mitosis and meiosis?",
];

export default function WelcomeScreen({ onSelectSuggestion }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
        <IconSparkles className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-zinc-900 sm:text-3xl">
        AnswerDe
      </h1>
      <p className="mt-2 max-w-md text-sm text-zinc-500 sm:text-base">
        Aapka friendly AI tutor for Class 10–12. Apna doubt Hinglish mein
        poochho — step-by-step jawab milega. 🎯
      </p>

      <div className="mt-8 grid w-full max-w-lg gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSelectSuggestion(q)}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm text-zinc-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/60"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
