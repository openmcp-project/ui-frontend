import type { SchemasSettings } from './setup';
import { updateYamlSchemas } from './setup';

type SchemaEntry = Omit<SchemasSettings, 'fileMatch'>;

const schemas = new Map<string, SchemaEntry>();

const sync = () => {
  updateYamlSchemas(
    Array.from(schemas.entries()).map(([uri, schema]) => ({
      ...schema,
      fileMatch: [uri],
    })),
  );
};

export const schemaRegistry = {
  set(modelUri: string, schema: SchemaEntry): void {
    schemas.set(modelUri, schema);
    sync();
  },

  delete(modelUri: string): void {
    schemas.delete(modelUri);
    sync();
  },

  getAll(): SchemasSettings[] {
    return Array.from(schemas.entries()).map(([uri, schema]) => ({
      ...schema,
      fileMatch: [uri],
    }));
  },
};
