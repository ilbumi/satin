export interface Project {
  id: string;
  name: string;
  description: string;
}

export interface ProjectsPage {
  objects: Project[];
  count: number;
  limit: number;
  offset: number;
}
