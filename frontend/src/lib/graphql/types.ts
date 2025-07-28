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

export interface Annotation {
  text?: string;
  tags?: string[];
}

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
  annotation: Annotation;
}

export interface BBoxInput {
  x: number;
  y: number;
  width: number;
  height: number;
  annotation: {
    text?: string;
    tags?: string[];
  };
}

export enum TaskStatus {
  DRAFT = "DRAFT",
  FINISHED = "FINISHED",
  REVIEWED = "REVIEWED",
}

export interface Task {
  id: string;
  image: Image;
  project: Project;
  bboxes: BBox[];
  status: TaskStatus;
  createdAt: string;
}

export interface TasksPage {
  objects: Task[];
  count: number;
  limit: number;
  offset: number;
}
