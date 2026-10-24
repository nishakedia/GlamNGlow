import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '@/services/supabase';

type Options = {
  /** Unique channel name, e.g. `booking:${id}`. */
  channel: string;
  table: 'bookings' | 'booking_offers' | 'booking_events' | 'vendor_locations' | 'messages';
  /** PostgREST-style filter, e.g. `booking_id=eq.${id}`. */
  filter?: string;
  /** Query keys to invalidate whenever a matching row changes. */
  invalidate: QueryKey[];
  enabled?: boolean;
};

/**
 * Bridges Supabase Realtime into React Query: rows change → queries refetch.
 * Keeps realtime screens (tracking, chat, vendor requests) on the same data path as
 * everything else instead of a parallel store.
 */
export function useRealtimeInvalidate({ channel, table, filter, invalidate, enabled = true }: Options) {
  const queryClient = useQueryClient();
  const keyHash = JSON.stringify(invalidate);

  useEffect(() => {
    if (!enabled) return;
    const sub = supabase
      .channel(channel)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter }, () => {
        for (const queryKey of JSON.parse(keyHash) as QueryKey[]) {
          queryClient.invalidateQueries({ queryKey });
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [channel, table, filter, keyHash, enabled, queryClient]);
}
