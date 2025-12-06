'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink } from '@apollo/client';
import { useState } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [apolloClient] = useState(
    () =>
      new ApolloClient({
        link: new HttpLink({
          uri: `${API_URL}/graphql`,
        }),
        cache: new InMemoryCache(),
      })
  );

  return (
    <ErrorBoundary>
      <ApolloProvider client={apolloClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApolloProvider>
    </ErrorBoundary>
  );
}
