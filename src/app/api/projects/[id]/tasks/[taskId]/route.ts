import { NextResponse } from "next/server";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireUser } from "@/lib/parse/require-admin";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/projects/:id/tasks/:taskId - Update a task (e.g., mark as completed)
 * Requires authentication
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: projectId, taskId } = await params;
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

    // Get the task
    const Task = Parse.Object.extend("ProjectTask");
    const task = await new Parse.Query(Task).get(taskId, { useMasterKey: true });
    
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verify task belongs to this project
    if (task.get("project").id !== projectId) {
      return NextResponse.json({ error: "Task does not belong to this project" }, { status: 400 });
    }

    const body = await request.json();
    const { completed } = body;

    if (typeof completed === "boolean") {
      task.set("completedAt", completed ? new Date() : null);
    }

    if (body.title && typeof body.title === "string") {
      task.set("title", body.title.trim());
    }

    if (body.dueDate) {
      task.set("dueDate", body.dueDate);
    }

    if (body.taskType) {
      task.set("taskType", body.taskType);
    }

    await task.save(null, { useMasterKey: true });

    // Update project progress
    const allTasks = await new Parse.Query(Task).equalTo("project", project).find({ useMasterKey: true });
    const completedTasks = allTasks.filter(t => t.get("completedAt")).length;
    const progress = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;
    project.set("progress", progress);
    await project.save(null, { useMasterKey: true });

    return NextResponse.json({
      id: task.id,
      title: task.get("title"),
      dueDate: task.get("dueDate"),
      taskType: task.get("taskType"),
      completedAt: task.get("completedAt"),
      isCompleted: !!task.get("completedAt"),
      projectProgress: progress,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/:id/tasks/:taskId - Delete a task
 * Requires authentication
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: projectId, taskId } = await params;
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

    // Get and delete the task
    const Task = Parse.Object.extend("ProjectTask");
    const task = await new Parse.Query(Task).get(taskId, { useMasterKey: true });
    
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verify task belongs to this project
    if (task.get("project").id !== projectId) {
      return NextResponse.json({ error: "Task does not belong to this project" }, { status: 400 });
    }

    await task.destroy({ useMasterKey: true });

    // Update project progress
    const allTasks = await new Parse.Query(Task).equalTo("project", project).find({ useMasterKey: true });
    const completedTasks = allTasks.filter(t => t.get("completedAt")).length;
    const progress = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;
    project.set("progress", progress);
    await project.save(null, { useMasterKey: true });

    return NextResponse.json({ success: true, projectProgress: progress });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
