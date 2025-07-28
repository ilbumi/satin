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

export interface Image {
  id: string;
  url: string;
}

export interface ImagesPage {
  objects: Image[];
  count: number;
  limit: number;
  offset: number;
}
