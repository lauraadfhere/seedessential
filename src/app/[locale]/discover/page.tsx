"use client";

import { useState } from "react";
import { Link } from "@/components/locale-link";
import { quizSteps, products } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { Button, cn } from "@/components/ui";
import { useCart } from "@/components/cart-provider";

export default function DiscoverPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const current = quizSteps[step];

  function choose(value: string) {
    const next = { ...answers, [current.id]: value };
    setAnswers(next);
    if (step < quizSteps.length - 1) {
      setStep(step + 1);
    } else {
      setDone(true);
    }
  }

  function reset() {
    setAnswers({});
    setStep(0);
    setDone(false);
  }

  // Simple scoring: recommend plants matching goal/location heuristics.
  const recommendations = recommend(answers);
  const { addProducts } = useCart();

  return (
    <main className="section py-10">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-brand text-neutral-400">
          Plant Discovery
        </p>
        <h1 className="mt-2 text-4xl font-semibold uppercase tracking-wide">
          Find the right plant
        </h1>
        <p className="mt-3 text-neutral-500">
          Answer 5 quick questions and we&apos;ll match plants and equipment to
          your space, light and goal.
        </p>
      </div>

      {!done ? (
        <div className="mx-auto mt-10 max-w-2xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-neutral-400">
              <span>
                Step {step + 1} of {quizSteps.length}
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-foreground transition-all"
                style={{ width: `${((step + 1) / quizSteps.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-8">
            <h2 className="text-2xl font-semibold">{current.question}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {current.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => choose(opt.value)}
                  className={cn(
                    "rounded-xl border p-4 text-left font-medium transition hover:border-foreground",
                    answers[current.id] === opt.value
                      ? "border-foreground bg-neutral-50"
                      : "border-neutral-200",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="mt-6 text-sm font-medium text-neutral-500 hover:text-foreground"
              >
                ← Back
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mx-auto mt-10 max-w-4xl">
          <div className="rounded-3xl bg-black p-8 text-white">
            <p className="text-xs font-bold uppercase tracking-brand text-neutral-400">
              Your personalised solution
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              We found a great match for your space
            </h2>
            <p className="mt-3 max-w-lg text-neutral-400">
              Based on a <strong className="text-white">{answers.location}</strong>{" "}
              spot with <strong className="text-white">{answers.sun}</strong> light
              for <strong className="text-white">{answers.goal}</strong>, here&apos;s
              a starter kit you can buy in one click.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/cart" shape="rect" size="lg" variant="light" onClick={(event) => { event.preventDefault(); addProducts(recommendations); }}>
                Add solution to cart
              </Button>
              <Button href="/experts" variant="outline-dark" shape="rect" size="lg">
                Have an expert confirm it
              </Button>
            </div>
          </div>

          <h3 className="mt-10 text-xl font-semibold">Recommended for you</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recommendations.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href="#" variant="outline" shape="rect" onClick={reset}>
              Start over
            </Button>
            <Link
              href="/planner"
              className="text-sm font-semibold text-accent-strong hover:underline"
            >
              Save this as a garden project →
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

function recommend(answers: Record<string, string>) {
  const goal = answers.goal;
  const location = answers.location;

  let list = [...products].filter((p) => p.inStock);

  if (goal === "food" || goal === "fruit") {
    list = list.filter(
      (p) =>
        ["vegetables", "herbs", "seeds", "fruit-trees"].includes(p.category) ||
        p.kind === "equipment",
    );
  } else if (goal === "decoration") {
    list = list.filter(
      (p) =>
        ["indoor-plants", "flowers", "succulents"].includes(p.category) ||
        p.kind === "equipment",
    );
  }

  if (location === "indoor") {
    list = list.filter(
      (p) => p.category === "indoor-plants" || p.kind === "equipment",
    );
  }

  // Ensure at least a plant + a few equipment items are present.
  const chosen = list.length >= 4 ? list : products.filter((p) => p.inStock);
  return chosen.slice(0, 8);
}
