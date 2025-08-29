import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
	schema: 'http://localhost:8000/graphql',
	documents: ['src/**/*.graphql', 'src/**/*.ts'],
	generates: {
		'src/lib/graphql/generated.ts': {
			plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
			config: {
				useTypeImports: true,
				skipTypename: false,
				enumsAsTypes: true,
				strictScalars: true,
				scalars: {
					DateTime: 'string',
					ObjectId: 'string'
				},
				namingConvention: {
					typeNames: 'pascal-case#pascalCase',
					enumValues: 'upper-case#upperCase'
				}
			}
		}
	},
	ignoreNoDocuments: true
};

export default config;
