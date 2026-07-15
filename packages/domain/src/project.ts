export interface ProjectProps {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Project {
  private props: ProjectProps;

  constructor(props: ProjectProps) {
    if (!props.name || props.name.trim() === '') {
      throw new Error('Project name cannot be empty');
    }
    this.props = { ...props };
  }

  public get id(): string { return this.props.id; }
  public get workspaceId(): string { return this.props.workspaceId; }
  public get name(): string { return this.props.name; }
  public get description(): string { return this.props.description; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get updatedAt(): Date { return this.props.updatedAt; }

  public updateDetails(name: string, description: string) {
    if (!name || name.trim() === '') {
      throw new Error('Project name cannot be empty');
    }
    this.props.name = name;
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  public toJSON(): ProjectProps {
    return { ...this.props };
  }
}
