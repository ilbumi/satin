import { gql } from "@urql/svelte";

export const GET_PROJECTS = gql`
  query GetProjects($limit: Int, $offset: Int) {
    projects(limit: $limit, offset: $offset) {
      objects {
        id
        name
        description
      }
      count
      limit
      offset
    }
  }
`;

export const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      name
      description
    }
  }
`;

export const CREATE_PROJECT = gql`
  mutation CreateProject($name: String!, $description: String!) {
    createProject(name: $name, description: $description) {
      id
      name
      description
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`;

export const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: ID!, $name: String, $description: String) {
    updateProject(id: $id, name: $name, description: $description) {
      id
      name
      description
    }
  }
`;

export const GET_IMAGES = gql`
  query GetImages($limit: Int, $offset: Int) {
    images(limit: $limit, offset: $offset) {
      objects {
        id
        url
      }
      count
      limit
      offset
    }
  }
`;

export const CREATE_IMAGE = gql`
  mutation CreateImage($url: String!) {
    createImage(url: $url) {
      id
      url
    }
  }
`;

export const DELETE_IMAGE = gql`
  mutation DeleteImage($id: ID!) {
    deleteImage(id: $id)
  }
`;

export const GET_TASKS = gql`
  query GetTasks($limit: Int, $offset: Int) {
    tasks(limit: $limit, offset: $offset) {
      objects {
        id
        image {
          id
          url
        }
        project {
          id
          name
          description
        }
        bboxes {
          x
          y
          width
          height
          annotation {
            text
            tags
          }
        }
        status
        createdAt
      }
      count
      limit
      offset
    }
  }
`;

export const GET_TASK = gql`
  query GetTask($id: ID!) {
    task(id: $id) {
      id
      image {
        id
        url
      }
      project {
        id
        name
        description
      }
      bboxes {
        x
        y
        width
        height
        annotation {
          text
          tags
        }
      }
      status
      createdAt
    }
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask(
    $imageId: ID!
    $projectId: ID!
    $bboxes: [BBoxInput!]
    $status: TaskStatus = DRAFT
  ) {
    createTask(
      imageId: $imageId
      projectId: $projectId
      bboxes: $bboxes
      status: $status
    ) {
      id
      image {
        id
        url
      }
      project {
        id
        name
        description
      }
      bboxes {
        x
        y
        width
        height
        annotation {
          text
          tags
        }
      }
      status
      createdAt
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask(
    $id: ID!
    $imageId: ID
    $projectId: ID
    $bboxes: [BBoxInput!]
    $status: TaskStatus
  ) {
    updateTask(
      id: $id
      imageId: $imageId
      projectId: $projectId
      bboxes: $bboxes
      status: $status
    ) {
      id
      image {
        id
        url
      }
      project {
        id
        name
        description
      }
      bboxes {
        x
        y
        width
        height
        annotation {
          text
          tags
        }
      }
      status
      createdAt
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

export const GET_TASK_BY_IMAGE_AND_PROJECT = gql`
  query GetTaskByImageAndProject($imageId: ID!, $projectId: ID!) {
    taskByImageAndProject(imageId: $imageId, projectId: $projectId) {
      id
      image {
        id
        url
      }
      project {
        id
        name
        description
      }
      bboxes {
        x
        y
        width
        height
        annotation {
          text
          tags
        }
      }
      status
      createdAt
    }
  }
`;
