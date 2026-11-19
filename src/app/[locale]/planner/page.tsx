"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/components/locale-link";
import { PageHero } from "@/components/page-hero";
import { DeepCard, DeepInput, DeepSelect, DeepButton } from "@/components/deep-ui";
import { useAccount } from "@/components/header-parts";
import { useSearchParams } from "next/navigation";

type Project = {
  id: string;
  name: string;
  projectType: string;
  location: string;
  budget: number;
  progress: number;
  createdAt: string;
};

const PROJECT_TYPES = [
  { value: "balcony", label: "Balcony" },
  { value: "backyard", label: "Backyard" },
  { value: "vegetable_garden", label: "Vegetable garden" },
  { value: "orchard", label: "Orchard" },
  { value: "indoor", label: "Indoor" },
  { value: "farm", label: "Farm" },
  { value: "other", label: "Other" },
];

export default function Planner() {
  const { account, ready: accountReady } = useAccount();
  const accountLoading = !accountReady;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("other");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");
  const search = useSearchParams();

  useEffect(() => {
    if (search.get("new") === "1") setShowForm(true);
  }, [search]);

  async function load() {
    setFailed(false);
    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      if (!response.ok) throw new Error("load");
      setProjects(await response.json());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (account) load();
    else if (!accountLoading) setLoading(false);
  }, [account, accountLoading]);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          projectType: type,
          location: location.trim(),
          budget: Number(budget) || 0,
        }),
      });
      if (!response.ok) throw new Error("save");
      setName("");
      setLocation("");
      setBudget("");
      setType("other");
      setShowForm(false);
      setMessage("Project created.");
      await load();
    } catch {
      setMessage("Could not create the project. Please sign in and try again.");
    } finally {
      setSaving(false);
    }
  }

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.projectType.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q),
    );
  }, [projects, filter]);

  const totals = useMemo(
    () => ({
      count: projects.length,
      avg: projects.length ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) : 0,
      budget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
    }),
    [projects],
  );

  return (
    <main className="network-surface font-barlow">
      <PageHero
        eyebrow="Garden planner"
        title="Bring your garden project to life"
        text="Plan each garden, track progress and budget, and open a project to manage its tasks and care schedule."
      >
        {account ? (
          <DeepButton onClick={() => setShowForm((v) => !v)} variant="primary">
            {showForm ? "Close" : "Create a project"}
          </DeepButton>
        ) : (
          <DeepButton href="/sign-in" variant="primary">Sign in to plan</DeepButton>
        )}
      </PageHero>

      <section className="section py-10">
        {message && (
          <p role="status" className="mb-6 text-sm font-semibold text-[#40533d]">
            {message}
          </p>
        )}

        {showForm && account && (
          <DeepCard variant="form" className="mb-8 p-6">
            <form onSubmit={create} className="grid gap-6 sm:grid-cols-2">
              <DeepInput label="Project name" value={name} onChange={setName} placeholder="My rooftop garden" required autoFocus />
              <DeepSelect label="Project type" value={type} onChange={setType} options={PROJECT_TYPES} />
              <DeepInput label="Location (optional)" value={location} onChange={setLocation} placeholder="Algiers" />
              <DeepInput label="Budget (optional)" type="number" min={0} value={budget} onChange={setBudget} placeholder="0" />
              <div className="flex gap-3 sm:col-span-2">
                <DeepButton type="submit" disabled={!name.trim()} loading={saving}>
                  {saving ? "Creating…" : "Create project"}
                </DeepButton>
                <DeepButton type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </DeepButton>
              </div>
            </form>
          </DeepCard>
        )}

        {!accountLoading && !account && (
          <DeepCard className="p-10 text-center">
            <p className="text-lg font-semibold">Sign in to start planning</p>
            <p className="mt-2 text-sm text-[#607060]">Your projects, tasks and budgets are private to your account.</p>
          </DeepCard>
        )}

        {account && (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <DeepCard className="p-5"><p className="text-xs uppercase tracking-wider text-neutral-500">Projects</p><p className="mt-1 text-2xl font-bold">{totals.count}</p></DeepCard>
              <DeepCard className="p-5"><p className="text-xs uppercase tracking-wider text-neutral-500">Average progress</p><p className="mt-1 text-2xl font-bold">{totals.avg}%</p></DeepCard>
              <DeepCard className="p-5"><p className="text-xs uppercase tracking-wider text-neutral-500">Total budget</p><p className="mt-1 text-2xl font-bold">${totals.budget}</p></DeepCard>
            </div>

            {projects.length > 0 && (
              <div className="mb-6 max-w-md">
                <DeepInput label="Filter projects" value={filter} onChange={setFilter} placeholder="Search by name, type or location" />
              </div>
            )}

            {loading ? (
              <p className="text-sm text-[#607060]">Loading your projects…</p>
            ) : failed ? (
              <DeepCard className="p-8 text-center">
                <p className="font-semibold">We could not load your projects.</p>
                <div className="mt-4"><DeepButton variant="outline" onClick={load}>Try again</DeepButton></div>
              </DeepCard>
            ) : projects.length === 0 ? (
              <DeepCard className="p-12 text-center">
                <p className="text-lg font-semibold">No projects yet</p>
                <p className="mt-2 text-sm text-[#607060]">Create your first garden project to start planning.</p>
              </DeepCard>
            ) : visible.length === 0 ? (
              <DeepCard className="p-8 text-center text-sm text-[#607060]">No projects match “{filter}”.</DeepCard>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {visible.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <DeepCard hover className="p-6 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="font-semibold text-[#111]">{project.name}</h2>
                          <p className="mt-1 text-sm capitalize text-neutral-500">{project.projectType.replace(/_/g, " ")}</p>
                        </div>
                        <span className="text-sm font-semibold text-[#638260]">{project.progress}%</span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">
                        <div className="h-full bg-[#006d44] transition-all" style={{ width: `${project.progress}%` }} />
                      </div>
                      {project.location && <p className="mt-3 text-sm text-[#607060]">📍 {project.location}</p>}
                      {project.budget > 0 && <p className="mt-1 text-sm text-[#607060]">💰 ${project.budget} budget</p>}
                      <p className="mt-3 text-xs text-neutral-500">Created {new Date(project.createdAt).toLocaleDateString()}</p>
                    </DeepCard>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
