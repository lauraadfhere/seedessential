import { NextResponse } from "next/server";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireUser } from "@/lib/parse/require-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/projects/:id/tasks - Retrieve tasks for a specific project
 * Requires authentication
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const Parse = getParseAdmin();
    const user = await requireUser(request);
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify project ownership
    const Project = Parse.Object.extend("Project");
    const projectQuery = new Parse.Query(Project);
    const project = await projectQuery.get(projectId, { useMasterKey: true });
    
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.get("user").id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Query tasks for this project
    const Task = Parse.Object.extend("ProjectTask");
    const taskQuery = new Parse.Query(Task);
    taskQuery.equalTo("project", project);
    taskQuery.ascending("dueDate");
    
    const tasks = await taskQuery.find({ useMasterKey: true });
    
    const serializedTasks = tasks.map(task => ({
      id: task.id,
      title: task.get("title"),
      dueDate: task.get("dueDate"),
      taskType: task.get("taskType") || "other",
      completedAt: task.get("completedAt"),
      isCompleted: !!task.get("completedAt"),
    }));

    return NextResponse.json(serializedTasks);
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

/**
 * POST /api/projects/:id/tasks - Create a new task for a project
 * Requires authentication
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const Parse = getParseAdmin();
    const user = await requireUser(request);
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify project ownership
    const Project = Parse.Object.extend("Project");
    const project = await new Parse.Query(Project).get(projectId, { useMasterKey: true });
    
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.get("user").id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { title, dueDate, taskType } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const Task = Parse.Object.extend("ProjectTask");
    const task = new Task();
    
    task.set({
      project,
      title: title.trim(),
      dueDate: dueDate || null,
      taskType: taskType || "other",
      completedAt: null,
    });

    await task.save(null, { useMasterKey: true });

    return NextResponse.json({
      id: task.id,
      title: task.get("title"),
      dueDate: task.get("dueDate"),
      taskType: task.get("taskType"),
      completedAt: task.get("completedAt"),
      isCompleted: false,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
