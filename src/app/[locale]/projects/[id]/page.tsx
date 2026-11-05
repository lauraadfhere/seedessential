"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

type Task = {
  id: string;
  title: string;
  dueDate: string | null;
  taskType: string;
  completedAt: string | null;
  isCompleted: boolean;
};

function ProjectDetailBody() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskType, setNewTaskType] = useState("other");
  const [creatingTask, setCreatingTask] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchTasks();
  }, [params.id]);

  async function fetchProject() {
    try {
      const response = await fetch(`/api/projects`);
      if (response.ok) {
        const projects = await response.json();
        const foundProject = projects.find((p: Project) => p.id === params.id);
        if (foundProject) {
          setProject(foundProject);
        } else {
          router.push("/projects");
        }
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTasks() {
    try {
      const response = await fetch(`/api/projects/${params.id}/tasks`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }

  async function createTask(event: React.FormEvent) {
    event.preventDefault();
    if (!newTaskTitle.trim()) return;

    setCreatingTask(true);
    try {
      const response = await fetch(`/api/projects/${params.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          dueDate: newTaskDueDate || null,
          taskType: newTaskType,
        }),
      });

      if (response.ok) {
        await fetchTasks();
        setShowTaskForm(false);
        setNewTaskTitle("");
        setNewTaskDueDate("");
        setNewTaskType("other");
      }
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setCreatingTask(false);
    }
  }

  async function toggleTaskCompletion(taskId: string, completed: boolean) {
    try {
      const response = await fetch(`/api/projects/${params.id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? { ...task, isCompleted: completed, completedAt: data.completedAt }
              : task
          )
        );
        if (project) {
          setProject({ ...project, progress: data.projectProgress });
        }
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  }

  async function deleteTask(taskId: string) {
    try {
      const response = await fetch(`/api/projects/${params.id}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        setTasks((prev) => prev.filter((task) => task.id !== taskId));
        if (project) {
          setProject({ ...project, progress: data.projectProgress });
        }
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  }

  if (loading) {
    return (
      <main className="network-surface font-barlow">
        <div className="section py-20">Loading project details…</div>
      </main>
    );
  }

  if (!project) {
    return null;
  }

  const completedTasks = tasks.filter((t) => t.isCompleted);
  const pendingTasks = tasks.filter((t) => !t.isCompleted);

  return (
    <main className="network-surface font-barlow">
      <PageHero
        eyebrow="Project details"
        title={project.name}
        text={`${project.projectType.replace("_", " ")} · ${project.progress}% complete`}
      />

      <section className="section py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
          <div className="space-y-8">
            {/* Progress Overview */}
            <DeepCard variant="default" className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Project progress</h2>
                <span className="text-2xl font-bold text-[#006d44]">{project.progress}%</span>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full bg-[#006d44] transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-[#607060]">Completed</p>
                  <p className="text-2xl font-bold text-[#111]">{completedTasks.length}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#607060]">Remaining</p>
                  <p className="text-2xl font-bold text-[#111]">{pendingTasks.length}</p>
                </div>
              </div>
            </DeepCard>

            {/* Tasks */}
            <DeepCard variant="default" className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Tasks</h2>
                <DeepButton onClick={() => setShowTaskForm(true)} variant="outline">
                  Add task
                </DeepButton>
              </div>

              {showTaskForm && (
                <DeepCard variant="default" className="mt-4 p-4">
                  <form onSubmit={createTask} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DeepInput
                        label="Task title"
                        value={newTaskTitle}
                        onChange={setNewTaskTitle}
                        placeholder="Water the tomatoes"
                        required
                        autoFocus
                      />
                      <DeepInput
                        label="Due date"
                        type="date"
                        value={newTaskDueDate}
                        onChange={setNewTaskDueDate}
                      />
                    </div>
                    <DeepSelect
                      label="Task type"
                      value={newTaskType}
                      onChange={setNewTaskType}
                      options={[
                        { value: "planting", label: "Planting" },
                        { value: "watering", label: "Watering" },
                        { value: "feeding", label: "Feeding" },
                        { value: "pruning", label: "Pruning" },
                        { value: "maintenance", label: "Maintenance" },
                        { value: "other", label: "Other" },
                      ]}
                    />
                    <div className="flex gap-3">
                      <DeepButton
                        type="submit"
                        disabled={creatingTask || !newTaskTitle.trim()}
                        loading={creatingTask}
                      >
                        {creatingTask ? "Adding…" : "Add task"}
                      </DeepButton>
                      <DeepButton
                        type="button"
                        variant="outline"
                        onClick={() => setShowTaskForm(false)}
                      >
                        Cancel
                      </DeepButton>
                    </div>
                  </form>
                </DeepCard>
              )}

              <div className="mt-6 space-y-3">
                {tasks.length === 0 ? (
                  <p className="text-center text-sm text-[#607060]">No tasks yet. Add your first task above.</p>
                ) : (
                  <>
                    {pendingTasks.length > 0 && (
                      <div>
                        <p className="mb-3 text-sm font-semibold text-[#607060]">Pending tasks</p>
                        {pendingTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 rounded-xl bg-[#f8faf8] p-3"
                          >
                            <input
                              type="checkbox"
                              checked={task.isCompleted}
                              onChange={() => toggleTaskCompletion(task.id, true)}
                              className="mt-1 h-5 w-5 rounded border-[#dce5dc]"
                            />
                            <div className="flex-1">
                              <p className="font-semibold">{task.title}</p>
                              <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#607060]">
                                {task.dueDate && (
                                  <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                                )}
                                <span className="capitalize">{task.taskType}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="text-xs font-bold text-red-700 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {completedTasks.length > 0 && (
                      <div>
                        <p className="mb-3 text-sm font-semibold text-[#607060]">Completed</p>
                        {completedTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 rounded-xl bg-[#eef3ed] p-3 opacity-75"
                          >
                            <input
                              type="checkbox"
                              checked={task.isCompleted}
                              onChange={() => toggleTaskCompletion(task.id, false)}
                              className="mt-1 h-5 w-5 rounded border-[#dce5dc]"
                            />
                            <div className="flex-1">
                              <p className="font-semibold line-through">{task.title}</p>
                              <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#607060]">
                                {task.dueDate && (
                                  <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                                )}
                                <span className="capitalize">{task.taskType}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="text-xs font-bold text-red-700 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </DeepCard>
          </div>

          {/* Project Details */}
          <aside className="space-y-6">
            <DeepCard variant="default" className="p-6">
              <h2 className="font-semibold">Project details</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-[#607060]">Type</p>
                  <p className="capitalize">{project.projectType.replace("_", " ")}</p>
                </div>
                {project.location && (
                  <div>
                    <p className="font-semibold text-[#607060]">Location</p>
                    <p>{project.location}</p>
                  </div>
                )}
                {project.budget > 0 && (
                  <div>
                    <p className="font-semibold text-[#607060]">Budget</p>
                    <p>${project.budget}</p>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-[#607060]">Created</p>
                  <p>{new Date(project.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </DeepCard>

            {project.notes && (
              <DeepCard variant="default" className="p-6">
                <h2 className="font-semibold">Notes</h2>
                <p className="mt-3 text-sm text-[#607060]">{project.notes}</p>
              </DeepCard>
            )}

            <DeepCard variant="default" className="p-6">
              <p className="text-sm font-semibold">Connect with experts</p>
              <p className="mt-2 text-sm text-[#607060]">
                Get personalized advice for this project from local agronomists.
              </p>
              <DeepButton href="/experts/request" variant="outline" className="mt-4 w-full">
                Request expert help
              </DeepButton>
            </DeepCard>

            <DeepButton href="/projects" variant="outline" className="w-full">
              Back to projects
            </DeepButton>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default function ProjectDetailPage() {
  return (
    <RequireAuth loadingLabel="Loading project details…">
      <ProjectDetailBody />
    </RequireAuth>
  );
}
