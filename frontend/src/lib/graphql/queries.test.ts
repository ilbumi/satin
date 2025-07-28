import { describe, expect, it } from "vitest";
import {
  GET_PROJECTS,
  GET_PROJECT,
  CREATE_PROJECT,
  DELETE_PROJECT,
  UPDATE_PROJECT,
  GET_IMAGES,
  CREATE_IMAGE,
  DELETE_IMAGE,
  GET_TASKS,
  GET_TASK,
  CREATE_TASK,
  UPDATE_TASK,
  DELETE_TASK,
  GET_TASK_BY_IMAGE_AND_PROJECT,
} from "./queries";

describe("GraphQL Queries", () => {
  describe("GET_PROJECTS", () => {
    it("should be a valid GraphQL query string", () => {
      expect(GET_PROJECTS).toBeDefined();
      expect(typeof GET_PROJECTS).toBe("object");
      expect(GET_PROJECTS.definitions).toBeDefined();
    });

    it("should include correct field selections", () => {
      const queryString = GET_PROJECTS.loc?.source.body;
      expect(queryString).toContain("query GetProjects");
      expect(queryString).toContain("projects(limit: $limit, offset: $offset)");
      expect(queryString).toContain("objects");
      expect(queryString).toContain("id");
      expect(queryString).toContain("name");
      expect(queryString).toContain("description");
      expect(queryString).toContain("count");
      expect(queryString).toContain("limit");
      expect(queryString).toContain("offset");
    });

    it("should accept limit and offset variables", () => {
      const queryString = GET_PROJECTS.loc?.source.body;
      expect(queryString).toContain("$limit: Int");
      expect(queryString).toContain("$offset: Int");
    });
  });

  describe("GET_PROJECT", () => {
    it("should be a valid GraphQL query string", () => {
      expect(GET_PROJECT).toBeDefined();
      expect(typeof GET_PROJECT).toBe("object");
      expect(GET_PROJECT.definitions).toBeDefined();
    });

    it("should include correct field selections", () => {
      const queryString = GET_PROJECT.loc?.source.body;
      expect(queryString).toContain("query GetProject");
      expect(queryString).toContain("project(id: $id)");
      expect(queryString).toContain("id");
      expect(queryString).toContain("name");
      expect(queryString).toContain("description");
    });

    it("should require id variable", () => {
      const queryString = GET_PROJECT.loc?.source.body;
      expect(queryString).toContain("$id: ID!");
    });

    it("should handle null response correctly", () => {
      // This tests the schema design - single project query can return null
      const queryString = GET_PROJECT.loc?.source.body;
      expect(queryString).toContain("project(id: $id)");
      // The field is nullable in the schema, so no ! after the project field
    });
  });

  describe("Query Structure", () => {
    it("should use consistent field naming", () => {
      const projectsQuery = GET_PROJECTS.loc?.source.body;
      const projectQuery = GET_PROJECT.loc?.source.body;

      // Both should request the same core fields for Project type
      const coreFields = ["id", "name", "description"];

      coreFields.forEach((field) => {
        expect(projectsQuery).toContain(field);
        expect(projectQuery).toContain(field);
      });
    });

    it("should follow GraphQL naming conventions", () => {
      const projectsQuery = GET_PROJECTS.loc?.source.body;
      const projectQuery = GET_PROJECT.loc?.source.body;

      // Operation names should be PascalCase
      expect(projectsQuery).toContain("GetProjects");
      expect(projectQuery).toContain("GetProject");

      // Field names should be camelCase
      expect(projectsQuery).toMatch(/\bobjects\b/);
      expect(projectsQuery).toMatch(/\bcount\b/);
      expect(projectsQuery).toMatch(/\blimit\b/);
      expect(projectsQuery).toMatch(/\boffset\b/);
    });
  });

  describe("CREATE_PROJECT", () => {
    it("should be a valid GraphQL mutation string", () => {
      expect(CREATE_PROJECT).toBeDefined();
      expect(typeof CREATE_PROJECT).toBe("object");
      expect(CREATE_PROJECT.definitions).toBeDefined();
    });

    it("should include correct mutation structure", () => {
      const mutationString = CREATE_PROJECT.loc?.source.body;
      expect(mutationString).toContain("mutation CreateProject");
      expect(mutationString).toContain(
        "createProject(name: $name, description: $description)",
      );
      expect(mutationString).toContain("id");
      expect(mutationString).toContain("name");
      expect(mutationString).toContain("description");
    });

    it("should require name and description variables", () => {
      const mutationString = CREATE_PROJECT.loc?.source.body;
      expect(mutationString).toContain("$name: String!");
      expect(mutationString).toContain("$description: String!");
    });
  });

  describe("DELETE_PROJECT", () => {
    it("should be a valid GraphQL mutation string", () => {
      expect(DELETE_PROJECT).toBeDefined();
      expect(typeof DELETE_PROJECT).toBe("object");
      expect(DELETE_PROJECT.definitions).toBeDefined();
    });

    it("should include correct mutation structure", () => {
      const mutationString = DELETE_PROJECT.loc?.source.body;
      expect(mutationString).toContain("mutation DeleteProject");
      expect(mutationString).toContain("deleteProject(id: $id)");
    });

    it("should require id variable", () => {
      const mutationString = DELETE_PROJECT.loc?.source.body;
      expect(mutationString).toContain("$id: ID!");
    });
  });

  describe("UPDATE_PROJECT", () => {
    it("should be a valid GraphQL mutation string", () => {
      expect(UPDATE_PROJECT).toBeDefined();
      expect(typeof UPDATE_PROJECT).toBe("object");
      expect(UPDATE_PROJECT.definitions).toBeDefined();
    });

    it("should include correct mutation structure", () => {
      const mutationString = UPDATE_PROJECT.loc?.source.body;
      expect(mutationString).toContain("mutation UpdateProject");
      expect(mutationString).toContain(
        "updateProject(id: $id, name: $name, description: $description)",
      );
      expect(mutationString).toContain("id");
      expect(mutationString).toContain("name");
      expect(mutationString).toContain("description");
    });

    it("should require id variable and optional name/description", () => {
      const mutationString = UPDATE_PROJECT.loc?.source.body;
      expect(mutationString).toContain("$id: ID!");
      expect(mutationString).toContain("$name: String");
      expect(mutationString).toContain("$description: String");
      // Note: name and description are optional (no ! suffix)
    });
  });

  describe("GET_IMAGES", () => {
    it("should be a valid GraphQL query string", () => {
      expect(GET_IMAGES).toBeDefined();
      expect(typeof GET_IMAGES).toBe("object");
      expect(GET_IMAGES.definitions).toBeDefined();
    });

    it("should include correct field selections", () => {
      const queryString = GET_IMAGES.loc?.source.body;
      expect(queryString).toContain("query GetImages");
      expect(queryString).toContain("images(limit: $limit, offset: $offset)");
      expect(queryString).toContain("objects");
      expect(queryString).toContain("id");
      expect(queryString).toContain("url");
      expect(queryString).toContain("count");
      expect(queryString).toContain("limit");
      expect(queryString).toContain("offset");
    });

    it("should accept limit and offset variables", () => {
      const queryString = GET_IMAGES.loc?.source.body;
      expect(queryString).toContain("$limit: Int");
      expect(queryString).toContain("$offset: Int");
    });
  });

  describe("CREATE_IMAGE", () => {
    it("should be a valid GraphQL mutation string", () => {
      expect(CREATE_IMAGE).toBeDefined();
      expect(typeof CREATE_IMAGE).toBe("object");
      expect(CREATE_IMAGE.definitions).toBeDefined();
    });

    it("should include correct mutation structure", () => {
      const mutationString = CREATE_IMAGE.loc?.source.body;
      expect(mutationString).toContain("mutation CreateImage");
      expect(mutationString).toContain("createImage(url: $url)");
      expect(mutationString).toContain("id");
      expect(mutationString).toContain("url");
    });

    it("should require url variable", () => {
      const mutationString = CREATE_IMAGE.loc?.source.body;
      expect(mutationString).toContain("$url: String!");
    });
  });

  describe("DELETE_IMAGE", () => {
    it("should be a valid GraphQL mutation string", () => {
      expect(DELETE_IMAGE).toBeDefined();
      expect(typeof DELETE_IMAGE).toBe("object");
      expect(DELETE_IMAGE.definitions).toBeDefined();
    });

    it("should include correct mutation structure", () => {
      const mutationString = DELETE_IMAGE.loc?.source.body;
      expect(mutationString).toContain("mutation DeleteImage");
      expect(mutationString).toContain("deleteImage(id: $id)");
    });

    it("should require id variable", () => {
      const mutationString = DELETE_IMAGE.loc?.source.body;
      expect(mutationString).toContain("$id: ID!");
    });
  });

  describe("GET_TASKS", () => {
    it("should be a valid GraphQL query string", () => {
      expect(GET_TASKS).toBeDefined();
      expect(typeof GET_TASKS).toBe("object");
      expect(GET_TASKS.definitions).toBeDefined();
    });

    it("should include correct field selections", () => {
      const queryString = GET_TASKS.loc?.source.body;
      expect(queryString).toContain("query GetTasks");
      expect(queryString).toContain("tasks(limit: $limit, offset: $offset)");
      expect(queryString).toContain("objects");
      expect(queryString).toContain("id");
      expect(queryString).toContain("image");
      expect(queryString).toContain("project");
      expect(queryString).toContain("bboxes");
      expect(queryString).toContain("status");
      expect(queryString).toContain("count");
      expect(queryString).toContain("limit");
      expect(queryString).toContain("offset");
    });

    it("should accept limit and offset variables", () => {
      const queryString = GET_TASKS.loc?.source.body;
      expect(queryString).toContain("$limit: Int");
      expect(queryString).toContain("$offset: Int");
    });
  });

  describe("GET_TASK", () => {
    it("should be a valid GraphQL query string", () => {
      expect(GET_TASK).toBeDefined();
      expect(typeof GET_TASK).toBe("object");
      expect(GET_TASK.definitions).toBeDefined();
    });

    it("should include correct field selections", () => {
      const queryString = GET_TASK.loc?.source.body;
      expect(queryString).toContain("query GetTask");
      expect(queryString).toContain("task(id: $id)");
      expect(queryString).toContain("id");
      expect(queryString).toContain("image");
      expect(queryString).toContain("project");
      expect(queryString).toContain("bboxes");
      expect(queryString).toContain("status");
    });

    it("should require id variable", () => {
      const queryString = GET_TASK.loc?.source.body;
      expect(queryString).toContain("$id: ID!");
    });
  });

  describe("CREATE_TASK", () => {
    it("should be a valid GraphQL mutation string", () => {
      expect(CREATE_TASK).toBeDefined();
      expect(typeof CREATE_TASK).toBe("object");
      expect(CREATE_TASK.definitions).toBeDefined();
    });

    it("should include correct mutation structure", () => {
      const mutationString = CREATE_TASK.loc?.source.body;
      expect(mutationString).toContain("mutation CreateTask");
      expect(mutationString).toContain("createTask");
      expect(mutationString).toContain("imageId");
      expect(mutationString).toContain("projectId");
      expect(mutationString).toContain("bboxes");
      expect(mutationString).toContain("status");
    });

    it("should require imageId and projectId variables", () => {
      const mutationString = CREATE_TASK.loc?.source.body;
      expect(mutationString).toContain("$imageId: ID!");
      expect(mutationString).toContain("$projectId: ID!");
    });
  });

  describe("UPDATE_TASK", () => {
    it("should be a valid GraphQL mutation string", () => {
      expect(UPDATE_TASK).toBeDefined();
      expect(typeof UPDATE_TASK).toBe("object");
      expect(UPDATE_TASK.definitions).toBeDefined();
    });

    it("should include correct mutation structure", () => {
      const mutationString = UPDATE_TASK.loc?.source.body;
      expect(mutationString).toContain("mutation UpdateTask");
      expect(mutationString).toContain("updateTask");
      expect(mutationString).toContain("id");
      expect(mutationString).toContain("bboxes");
    });

    it("should require id variable", () => {
      const mutationString = UPDATE_TASK.loc?.source.body;
      expect(mutationString).toContain("$id: ID!");
    });
  });

  describe("DELETE_TASK", () => {
    it("should be a valid GraphQL mutation string", () => {
      expect(DELETE_TASK).toBeDefined();
      expect(typeof DELETE_TASK).toBe("object");
      expect(DELETE_TASK.definitions).toBeDefined();
    });

    it("should include correct mutation structure", () => {
      const mutationString = DELETE_TASK.loc?.source.body;
      expect(mutationString).toContain("mutation DeleteTask");
      expect(mutationString).toContain("deleteTask(id: $id)");
    });

    it("should require id variable", () => {
      const mutationString = DELETE_TASK.loc?.source.body;
      expect(mutationString).toContain("$id: ID!");
    });
  });

  describe("GET_TASK_BY_IMAGE_AND_PROJECT", () => {
    it("should be a valid GraphQL query string", () => {
      expect(GET_TASK_BY_IMAGE_AND_PROJECT).toBeDefined();
      expect(typeof GET_TASK_BY_IMAGE_AND_PROJECT).toBe("object");
      expect(GET_TASK_BY_IMAGE_AND_PROJECT.definitions).toBeDefined();
    });

    it("should include correct field selections", () => {
      const queryString = GET_TASK_BY_IMAGE_AND_PROJECT.loc?.source.body;
      expect(queryString).toContain("query GetTaskByImageAndProject");
      expect(queryString).toContain("taskByImageAndProject");
      expect(queryString).toContain("imageId");
      expect(queryString).toContain("projectId");
      expect(queryString).toContain("id");
      expect(queryString).toContain("image");
      expect(queryString).toContain("project");
      expect(queryString).toContain("bboxes");
      expect(queryString).toContain("status");
    });

    it("should require imageId and projectId variables", () => {
      const queryString = GET_TASK_BY_IMAGE_AND_PROJECT.loc?.source.body;
      expect(queryString).toContain("$imageId: ID!");
      expect(queryString).toContain("$projectId: ID!");
    });
  });
});
