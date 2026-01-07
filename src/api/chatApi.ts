// src/services/chatApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';

/** =======================
 * Types from your backend
 * ======================= */
export type Participant = {
  user_id: number;
  id: number;
  username: string;
  last_message: string | null;
  last_message_at: string | null; // ISO
  last_message_id: number | null;
  last_message_from_id: number | null;
  last_message_to_id: number | null;
  unseen_count: number;
};

export type ParticipantsResponse = {
  participants: Participant[];
};

export type EditHistory = {
  message: string;
  edited_at: string; // ISO
  edited_by: string;
};

export type SeenStatus = {
  is_seen: boolean;
  seen_at: string | null; // ISO
  can_mark_as_seen: boolean;
};

export type ThreadMessage = {
  id: number;
  user_from: number;
  user_to: number;
  user_from_username: string;
  user_to_username: string;
  transaction_id: number;
  message: string;
  original_message: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  timestamp: string;      // ISO
  last_modified: string;  // ISO
  can_edit: boolean;
  edit_history_display: EditHistory[];
  seen_status: SeenStatus;
};

export type PaginatedThread = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ThreadMessage[];
};

/** =======================
 * Query args
 * ======================= */
type GetParticipantsArgs = { transactionId: number | string };

type GetThreadArgs = {
  transactionId: number | string;
  userId: number | string;
  page?: number;
  pageSize?: number;
};

type CreateMessageBody = {
  transaction_id: number | string;
  user_id: number | string; // recipient id
  message: string;
};

type UpdateMessageBody = { message: string };

// include txn/user so we can precisely invalidate & patch
type UpdateMessageArgs = {
  messageId: number | string;
  data: UpdateMessageBody;
  transactionId: number | string;
  userId: number | string;
};

type DeleteMessageArgs = {
  messageId: number | string;
  transactionId: number | string;
  userId: number | string;
};

/** =======================
 * API slice
 * ======================= */
export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: customBaseQuery,
  tagTypes: ['ChatParticipants', 'ChatThread'],
  endpoints: (builder) => ({
    // GET participants for a transaction
    getParticipantsByTransaction: builder.query<ParticipantsResponse, GetParticipantsArgs>({
      query: ({ transactionId }) => ({
        url: '/chat/participants',
        method: 'GET',
        params: { transaction_id: transactionId },
      }),
      providesTags: (_res, _err, arg) => [
        { type: 'ChatParticipants', id: `T-${arg.transactionId}` },
      ],
    }),

    // GET a single page of a thread (explicit pagination)
    getThreadPage: builder.query<PaginatedThread, GetThreadArgs>({
      query: ({ transactionId, userId, page = 1, pageSize = 20 }) => ({
        url: '/chat/thread',
        method: 'GET',
        params: {
          transaction_id: transactionId,
          user_id: userId,
          page,
          page_size: pageSize,
        },
      }),
      providesTags: (_res, _err, arg) => [
        { type: 'ChatThread', id: `T-${arg.transactionId}-U-${arg.userId}` },
        { type: 'ChatThread', id: `T-${arg.transactionId}-U-${arg.userId}-P-${arg.page ?? 1}` },
      ],
    }),

    // GET thread with page merging (“infinite” style)
    getThreadInfinite: builder.query<PaginatedThread, GetThreadArgs>({
      query: ({ transactionId, userId, page = 1, pageSize = 20 }) => ({
        url: '/chat/thread',
        method: 'GET',
        params: {
          transaction_id: transactionId,
          user_id: userId,
          page,
          page_size: pageSize,
        },
      }),
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}|T=${queryArgs.transactionId}|U=${queryArgs.userId}`,
      merge: (currentCache, newCache) => {
        // first fetch: currentCache is undefined; RTK Query will set it to newCache before calling merge on subsequent fetches
        if (!currentCache) return;
        const seen = new Set<number>();
        const merged = [...(currentCache.results ?? []), ...(newCache?.results ?? [])]
          .filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)))
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        currentCache.count = newCache?.count ?? currentCache.count ?? merged.length;
        currentCache.next = newCache?.next ?? null;
        currentCache.previous = newCache?.previous ?? null;
        currentCache.results = merged;
      },
      forceRefetch({ currentArg, previousArg }) {
        return (
          currentArg?.transactionId !== previousArg?.transactionId ||
          currentArg?.userId !== previousArg?.userId
        );
      },
      providesTags: (_res, _err, arg) => [
        { type: 'ChatThread', id: `T-${arg.transactionId}-U-${arg.userId}` },
      ],
    }),

    // CREATE message
    createMessage: builder.mutation<ThreadMessage, CreateMessageBody>({
      query: (body) => ({
        url: '/chat/thread/', // POST
        method: 'POST',
        body,
      }),
      // Refresh thread & participants (last message, counts)
      invalidatesTags: (_res, _err, arg) => [
        { type: 'ChatThread', id: `T-${arg.transaction_id}-U-${arg.user_id}` },
        { type: 'ChatParticipants', id: `T-${arg.transaction_id}` },
      ],
    }),

    // UPDATE message (with optimistic UI)
 updateMessage: builder.mutation<ThreadMessage, UpdateMessageArgs>({
  query: ({ messageId, data }) => ({
    url: `/chat/message/${messageId}/`,
    method: 'PUT', // or 'PATCH' if your backend expects it
    body: data,
  }),
  async onQueryStarted({ messageId, data, transactionId, userId }, { dispatch, queryFulfilled }) {
    // getThreadInfinite uses serializeQueryArgs(T,user) so pass those two
    const patch = dispatch(
      chatApi.util.updateQueryData(
        'getThreadInfinite',
        { transactionId, userId }, // key args
        (draft) => {
          if (!draft?.results) return;
          const hit = draft.results.find(m => m.id === Number(messageId));
          if (hit && !hit.is_deleted) {
            hit.message = data.message;
            hit.is_edited = true; // reflect immediately
            // Optionally append a lightweight history item:
            // (only if your UI needs local echo before server returns)
            // hit.edit_history_display = hit.edit_history_display || [];
            // hit.edit_history_display.push({ message: data.message, edited_at: new Date().toISOString(), edited_by: 'you' });
          }
        }
      )
    );

    try {
      await queryFulfilled;
    } catch {
      patch.undo(); // rollback on failure
    }
  },
  invalidatesTags: (_res, _err, arg) => [
    { type: 'ChatThread', id: `T-${arg.transactionId}-U-${arg.userId}` },
    { type: 'ChatParticipants', id: `T-${arg.transactionId}` }, // refresh last message text in list
  ],
}),

    // DELETE message (with optimistic UI -> show “deleted” placeholder)
 deleteMessage: builder.mutation<{ detail?: string }, DeleteMessageArgs>({
  query: ({ messageId }) => ({
    url: `/chat/message/${messageId}/`,
    method: 'DELETE',
  }),
  async onQueryStarted({ messageId, transactionId, userId }, { dispatch, queryFulfilled }) {
    const patch = dispatch(
      chatApi.util.updateQueryData(
        'getThreadInfinite',
        { transactionId, userId },
        (draft) => {
          if (!draft?.results) return;
          const hit = draft.results.find(m => m.id === Number(messageId));
          if (hit) {
            hit.is_deleted = true;
            // Optional: blank message; UI already shows placeholder when is_deleted
            // hit.message = '';
          }
        }
      )
    );

    try {
      await queryFulfilled;
    } catch {
      patch.undo();
    }
  },
  invalidatesTags: (_res, _err, arg) => [
    { type: 'ChatThread', id: `T-${arg.transactionId}-U-${arg.userId}` },
    { type: 'ChatParticipants', id: `T-${arg.transactionId}` }, // update last message/unread
  ],
}),

  }),
});

export const {
  useGetParticipantsByTransactionQuery,
  useGetThreadPageQuery,
  useLazyGetThreadPageQuery,
  useGetThreadInfiniteQuery,
  useLazyGetThreadInfiniteQuery,
  useCreateMessageMutation,
  useUpdateMessageMutation,
  useDeleteMessageMutation,
} = chatApi;
