// RTK Query endpoint configured like your example (attachmentsApi)
import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery2';

export interface ChatbotRequest {
  user_input: string;
  file_base64?: string;
  file_name?: string;
  file_type?: string;
}

// Agent response can be string or object
export interface AgentObjectResponse {
  response?: string;
  question?: string;
  status?: string;
  [key: string]: unknown; // Allow other properties
}

export interface ChatbotAgents {
  GeneralQAAgent?: string | AgentObjectResponse;
  ExpenseCreatorAgent?: string | AgentObjectResponse;
  PageNavigatorAgent?: string;   // a route path string
  SQLBuilderAgent?: string;      // HTML string for table
  HTML_TABLE_DATA?: string;
  [key: string]: unknown;
}

export type ChatbotResponsePayload =
  | string
  | ChatbotAgents
  | (ChatbotAgents & {
      response?: string | AgentObjectResponse | null;
      HTML_TABLE_DATA?: string;
      message?: string;
    })
  | Array<string | AgentObjectResponse | Record<string, unknown>>;

export interface ChatbotResponse {
  status: 'success' | 'error';
  response?: ChatbotResponsePayload;
  message?: string;
  HTML_TABLE_DATA?: string;
}

export const chatbotApi = createApi({
  reducerPath: 'chatbotApi',
  baseQuery: customBaseQuery,
  endpoints: (builder) => ({
    sendMessage: builder.mutation<ChatbotResponse, ChatbotRequest>({
      query: (body) => ({
        url: '/chatbot/public',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useSendMessageMutation } = chatbotApi;
