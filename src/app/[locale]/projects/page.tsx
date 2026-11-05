"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/components/locale-link";
import { PageHero } from "@/components/page-hero";
import { RequireAuth } from "@/components/require-auth";
import { DeepCard, DeepInput, DeepSelect, DeepButton } from "@/components/deep-ui";

type Project = {
  id: string;
  name: string;
  projectType: string;
  location: string;
  budget: number;
  progress: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

function ProjectsBody() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectType, setNewProjectType] = useState("other");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createProject(event: React.FormEvent) {
    event.preventDefault();
    if (!newProjectName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName,
          projectType: newProjectType,
        }),
      });

      if (response.ok) {
        await fetchProjects();
        setShowCreateForm(false);
        setNewProjectName("");
        setNewProjectType("other");
      }
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <main className="network-surface font-barlow">
        <div className="section py-20">Loading your projects…</div>
      </main>
    );
  }

  return (
    <main className="network-surface font-barlow">
      <PageHero
        eyebrow="Garden projects"
        title="Your growing workspace"
        text="Track plants, tasks, budgets and care schedules. Connect expert advice and shop recommendations to each project."
      >
        <DeepButton onClick={() => setShowCreateForm(true)} variant="primary">
          Create a project
        </DeepButton>
      </PageHero>

      <section className="section py-10">
        {showCreateForm && (
          <DeepCard variant="form" className="mb-8 p-6">
            <form onSubmit={createProject} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <DeepInput
                  label="Project name"
                  value={newProjectName}
                  onChange={setNewProjectName}
                  placeholder="My rooftop garden"
                  required
                  autoFocus
                />
                <DeepSelect
                  label="Project type"
                  value={newProjectType}
                  onChange={setNewProjectType}
                  options={[
                    { value: "balcony", label: "Balcony" },
                    { value: "backyard", label: "Backyard" },
                    { value: "vegetable_garden", label: "Vegetable Garden" },
                    { value: "orchard", label: "Orchard" },
                    { value: "indoor", label: "Indoor" },
                    { value: "farm", label: "Farm" },
                    { value: "other", label: "Other" },
                  ]}
                />
              </div>
              <div className="flex gap-3">
                <DeepButton type="submit" disabled={creating || !newProjectName.trim()} loading={creating}>
                  {creating ? "Creating…" : "Create project"}
                </DeepButton>
                <DeepButton
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </DeepButton>
              </div>
            </form>
          </DeepCard>
        )}

        {projects.length === 0 ? (
          <DeepCard className="p-12 text-center">
            <p className="text-lg font-semibold">No projects yet</p>
            <p className="mt-2 text-sm text-[#607060]">
              Create a project to start organizing your garden plans and track your growing journey.
            </p>
          </DeepCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div key={project.id}>
              <Link href={`/projects/${project.id}`}>
                <DeepCard hover className="rounded-[1.75rem] p-6 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-semibold text-[#111]">{project.name}</h2>
                      <p className="mt-1 text-sm text-neutral-500 capitalize">
                        {project.projectType.replace("_", " ")}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#638260]">{project.progress}%</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full bg-[#006d44] transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  {project.location && (
                    <p className="mt-3 text-sm text-[#607060]">📍 {project.location}</p>
                  )}
                  {project.budget > 0 && (
                    <p className="mt-1 text-sm text-[#607060]">💰 ${project.budget} budget</p>
                  )}
                  <p className="mt-3 text-xs text-neutral-500">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </DeepCard>
              </Link>
              {/* Legacy duplicate card removed:
                  <div>
                    <h2 className="font-semibold text-[#111]">{project.name}</h2>
                    <p className="mt-1 text-sm text-neutral-500 capitalize">
                      {project.projectType.replace("_", " ")}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#638260]">{project.progress}%</span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full bg-[#006d44] transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                {project.location && (
                  <p className="mt-3 text-sm text-[#607060]">📍 {project.location}</p>
                )}
                {project.budget > 0 && (
                  <p className="mt-1 text-sm text-[#607060]">💰 ${project.budget} budget</p>
                )}
                <p className="mt-3 text-xs text-neutral-500">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </p>
              */}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function ProjectsPage() {
  return (
    <RequireAuth loadingLabel="Loading your projects…">
      <ProjectsBody />
    </RequireAuth>
  );
}
