import { NextResponse } from "next/server";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireUser } from "@/lib/parse/require-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/projects - Retrieve user's projects
 * Requires authentication
 */
export async function GET(request: Request) {
  try {
    const Parse = getParseAdmin();
    const user = await requireUser(request);
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Query projects for the current user
    const Project = Parse.Object.extend("Project");
    const query = new Parse.Query(Project);
    query.equalTo("user", user);
    query.descending("createdAt");
    
    const projects = await query.find({ useMasterKey: true });
    
    const serializedProjects = projects.map(project => ({
      id: project.id,
      name: project.get("name"),
      projectType: project.get("projectType") || "other",
      location: project.get("location"),
      budget: project.get("budget"),
      progress: project.get("progress") || 0,
      notes: project.get("notes"),
      createdAt: project.get("createdAt"),
      updatedAt: project.get("updatedAt"),
    }));

    return NextResponse.json(serializedProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

/**
 * POST /api/projects - Create a new project
 * Requires authentication
 */
export async function POST(request: Request) {
  try {
    const Parse = getParseAdmin();
    const user = await requireUser(request);
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { name, projectType, location, budget, notes } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const Project = Parse.Object.extend("Project");
    const project = new Project();
    
    project.set({
      user,
      name: name.trim(),
      projectType: projectType || "other",
      location: location || "",
      budget: budget || 0,
      progress: 0,
      notes: notes || "",
    });

    await project.save(null, { useMasterKey: true });

    return NextResponse.json({
      id: project.id,
      name: project.get("name"),
      projectType: project.get("projectType"),
      location: project.get("location"),
      budget: project.get("budget"),
      progress: project.get("progress"),
      notes: project.get("notes"),
      createdAt: project.get("createdAt"),
      updatedAt: project.get("updatedAt"),
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
