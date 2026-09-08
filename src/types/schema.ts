export interface ColumnDefinition {
  name: string;
  originalName: string;
  type: string;
  nullable: boolean;
  isPk?: boolean;
  isFk?: boolean;
  fkTarget?: string;
  defaultValue?: string;
  checkConstraint?: string;
  description: string;
  businessRule?: string;
}

export interface TableDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  type: 'entity' | 'associative';
  columns: ColumnDefinition[];
  relationships: {
    targetTable: string;
    type: '1:N' | 'N:1' | 'N:N';
    description: string;
    foreignKey: string;
  }[];
}

export type SQLDialect = 'postgresql' | 'mysql' | 'sqlserver' | 'sqlite' | 'seeds' | 'queries';
