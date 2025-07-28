import { describe, expect, it } from "vitest";
import type { Project, ProjectsPage } from "./types";

describe("GraphQL Types", () => {
  describe("Project Type", () => {
    it("should have correct structure", () => {
      const mockProject: Project = {
        id: "123",
        name: "Test Project",
        description: "A test project description",
      };

      expect(mockProject.id).toBe("123");
      expect(mockProject.name).toBe("Test Project");
      expect(mockProject.description).toBe("A test project description");
    });

    it("should enforce string types for all fields", () => {
      // TypeScript compilation will catch type errors
      const project: Project = {
        id: "123",
        name: "Test",
        description: "Test description",
      };

      expect(typeof project.id).toBe("string");
      expect(typeof project.name).toBe("string");
      expect(typeof project.description).toBe("string");
    });

    it("should work with empty description", () => {
      const project: Project = {
        id: "123",
        name: "Test Project",
        description: "",
      };

      expect(project.description).toBe("");
    });
  });

  describe("ProjectsPage Type", () => {
    it("should have correct structure", () => {
      const mockProjectsPage: ProjectsPage = {
        objects: [
          {
            id: "1",
            name: "Project 1",
            description: "Description 1",
          },
          {
            id: "2",
            name: "Project 2",
            description: "Description 2",
          },
        ],
        count: 2,
        limit: 10,
        offset: 0,
      };

      expect(Array.isArray(mockProjectsPage.objects)).toBe(true);
      expect(mockProjectsPage.objects).toHaveLength(2);
      expect(mockProjectsPage.count).toBe(2);
      expect(mockProjectsPage.limit).toBe(10);
      expect(mockProjectsPage.offset).toBe(0);
    });

    it("should work with empty projects list", () => {
      const emptyPage: ProjectsPage = {
        objects: [],
        count: 0,
        limit: 10,
        offset: 0,
      };

      expect(emptyPage.objects).toHaveLength(0);
      expect(emptyPage.count).toBe(0);
    });

    it("should enforce number types for pagination fields", () => {
      const page: ProjectsPage = {
        objects: [],
        count: 5,
        limit: 20,
        offset: 10,
      };

      expect(typeof page.count).toBe("number");
      expect(typeof page.limit).toBe("number");
      expect(typeof page.offset).toBe("number");
    });

    it("should enforce Project array type for objects", () => {
      const projects: Project[] = [
        {
          id: "1",
          name: "Test",
          description: "Test description",
        },
      ];

      const page: ProjectsPage = {
        objects: projects,
        count: 1,
        limit: 10,
        offset: 0,
      };

      expect(page.objects[0]).toHaveProperty("id");
      expect(page.objects[0]).toHaveProperty("name");
      expect(page.objects[0]).toHaveProperty("description");
    });
  });

  describe("Type Compatibility", () => {
    it("should be compatible with GraphQL response structure", () => {
      // This simulates the structure that would come from the GraphQL API
      const apiResponse = {
        data: {
          projects: {
            objects: [
              {
                id: "1",
                name: "API Project",
                description: "From API",
              },
            ],
            count: 1,
            limit: 20,
            offset: 0,
          },
        },
      };

      // Should be assignable to our types
      const projectsPage: ProjectsPage = apiResponse.data.projects;
      const firstProject: Project = projectsPage.objects[0];

      expect(firstProject.name).toBe("API Project");
      expect(projectsPage.count).toBe(1);
    });

    it("should work with pagination scenarios", () => {
      // First page
      const firstPage: ProjectsPage = {
        objects: [{ id: "1", name: "Project 1", description: "Desc 1" }],
        count: 1,
        limit: 2,
        offset: 0,
      };

      // Second page
      const secondPage: ProjectsPage = {
        objects: [{ id: "2", name: "Project 2", description: "Desc 2" }],
        count: 1,
        limit: 2,
        offset: 2,
      };

      expect(firstPage.offset).toBe(0);
      expect(secondPage.offset).toBe(2);
      expect(firstPage.limit).toBe(secondPage.limit);
    });
  });
});
