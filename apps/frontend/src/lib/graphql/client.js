'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.graphqlClient = void 0;
const client_1 = require('@apollo/client');
const error_1 = require('@apollo/client/link/error');
const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';
// Error handling link
const errorLink = (0, error_1.onError)(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});
// HTTP link
const httpLink = new client_1.HttpLink({
  uri: DGRAPH_ENDPOINT,
  credentials: 'same-origin',
});
// Create Apollo Client
exports.graphqlClient = new client_1.ApolloClient({
  link: (0, client_1.from)([errorLink, httpLink]),
  cache: new client_1.InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          queryUser: {
            merge: false,
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});
exports.default = exports.graphqlClient;
