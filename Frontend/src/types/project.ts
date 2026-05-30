export interface ProjectFile {
  name: string;
}

export interface Project {
  project_name: string;
  files: ProjectFile[];
}