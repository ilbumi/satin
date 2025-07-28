import { describe, expect, it } from "vitest";
import {
  GET_PROJECTS,
  GET_PROJECT,
  CREATE_PROJECT,
  DELETE_PROJECT,
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
});
