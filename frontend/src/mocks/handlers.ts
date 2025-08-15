import { graphql, HttpResponse, http } from 'msw';

export const handlers = [
	graphql.query('GetAllProjects', () => {
		return HttpResponse.json({
			data: {
				projects: [
					{ id: '1', name: 'Project 1', description: 'Description 1' },
					{ id: '2', name: 'Project 2', description: 'Description 2' }
				]
			}
		});
	}),
	http.get('http://localhost:8000/graphql', () => {
		return HttpResponse.json({
			data: {
				__schema: {
					queryType: {
						name: 'Query'
					},
					mutationType: {
						name: 'Mutation'
					},
					subscriptionType: null,
					types: []
				}
			}
		});
	})
];
