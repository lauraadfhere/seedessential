"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/components/locale-link";
import { quizSteps, type Product } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { Button, cn } from "@/components/ui";
import { useCart } from "@/components/cart-provider";
import { mergeLiveCatalog } from "@/lib/catalog";
import { useSearchHistory, normalizeSearchTerm } from "@/lib/search-history";

function matchesQuery(p: Product, query: string) {
  const q = query.toLowerCase();
  return `${p.name} ${p.short} ${p.description} ${p.category}`.toLowerCase().includes(q);
}

export default function DiscoverPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<Product[] | null>(null);
  const { history, remember, forget, clear } = useSearchHistory();

  useEffect(() => {
    let active = true;
    fetch("/api/catalog/products", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: Product[]) => {
        if (active) setCatalog(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const liveProducts = useMemo(() => mergeLiveCatalog(catalog), [catalog]);
  const searchResults = useMemo(() => {
    const term = normalizeSearchTerm(query);
    if (!term) return [];
    return liveProducts.filter((p) => matchesQuery(p, term)).slice(0, 12);
  }, [query, liveProducts]);

  function submitSearch(term: string) {
    const clean = normalizeSearchTerm(term);
    if (!clean) return;
    setQuery(clean);
    remember(clean);
  }

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
  const recommendations = useMemo(() => recommend(answers, liveProducts), [answers, liveProducts]);
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

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch(query);
        }}
        className="mx-auto mt-8 max-w-2xl"
      >
        <label htmlFor="discover-search" className="sr-only">Search plants and equipment</label>
        <div className="ui-field flex items-center gap-2 !py-0">
          <input
            id="discover-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={80}
            placeholder="Search plants & equipment"
            className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-neutral-400"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="text-xs font-semibold text-neutral-500 hover:text-foreground">
              Clear
            </button>
          )}
          <button type="submit" className="border border-[#40533d] bg-[#40533d] px-4 py-1.5 text-xs font-semibold text-white">
            Search
          </button>
        </div>
        {history.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-neutral-500">Recent:</span>
            {history.map((term) => (
              <span key={term} className="inline-flex items-center border border-rule bg-white">
                <button type="button" onClick={() => submitSearch(term)} className="px-3 py-1 hover:text-accent-strong">
                  {term}
                </button>
                <button type="button" aria-label={`Remove ${term}`} onClick={() => forget(term)} className="pr-2 text-neutral-400 hover:text-foreground">
                  ×
                </button>
              </span>
            ))}
            <button type="button" onClick={clear} className="font-semibold text-neutral-500 underline hover:text-foreground">
              Clear history
            </button>
          </div>
        )}
        {query.trim() && (
          <div className="mt-6">
            <p className="text-sm text-neutral-500">
              {searchResults.length} result{searchResults.length !== 1 && "s"} for &ldquo;{normalizeSearchTerm(query) ?? query}&rdquo;
            </p>
            {searchResults.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {searchResults.map((p) => (
                  <ProductCard key={p.slug} product={p} />
                ))}
              </div>
            ) : (
              <p className="mt-4 border border-dashed border-rule p-6 text-center text-sm text-neutral-500">
                No match. Try another word, or take the quiz below.
              </p>
            )}
          </div>
        )}
      </form>

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

          <div className="network-card p-8">
            <h2 className="text-2xl font-semibold">{current.question}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {current.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => choose(opt.value)}
                  className={cn(
                    "border p-4 text-left font-medium transition hover:border-[#40533d]",
                    answers[current.id] === opt.value
                      ? "border-[#40533d] bg-panel"
                      : "border-rule",
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
          <div className="border border-[#18231b] bg-black p-8 text-white">
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
            <Button href="/discover" variant="outline" shape="rect" onClick={(event) => { event.preventDefault(); reset(); }}>
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

function recommend(answers: Record<string, string>, catalog: Product[]) {
  const goal = answers.goal;
  const location = answers.location;

  let list = [...catalog].filter((p) => p.inStock);

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
  const chosen = list.length >= 4 ? list : catalog.filter((p) => p.inStock);
  return chosen.slice(0, 8);
}
