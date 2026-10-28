import { useQuery } from '@tanstack/react-query';

import { getCollection, getCollectionRecord } from '@/api/mockapi';
import { collectionKeys } from '@/query/query-keys';

export function useCollection() {
  return useQuery({
    queryKey: collectionKeys.list(),
    queryFn: getCollection,
  });
}

export function useCollectionRecord(id: string | undefined) {
  return useQuery({
    queryKey: collectionKeys.detail(id ?? 'unknown'),
    queryFn: () => getCollectionRecord(id as string),
    enabled: Boolean(id),
  });
}
