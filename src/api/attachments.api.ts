import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';

export interface Attachment {
  attachment_id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  file_data: string;
  upload_date: string;
}

export interface AttachmentsResponse {
  transaction_id: string;
  attachments: Attachment[];
}

export interface UploadAttachmentRequest {
  transaction_id: string;
  file: File;
}

export interface UploadAttachmentResponse {
  success: boolean;
  message?: string;
}

export const attachmentsApi = createApi({
  reducerPath: 'attachmentsApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Attachments'],
  endpoints: (builder) => ({
    getAttachments: builder.query<AttachmentsResponse, string>({
      query: (transactionId) => ({
        url: `/budget/transfers/list-files/`,
        method: 'GET',
        params: {
          transaction_id: transactionId,
        },
      }),
      providesTags: (_result, _error, transactionId) => [
        { type: 'Attachments', id: transactionId }
      ],
    }),
    uploadAttachment: builder.mutation<UploadAttachmentResponse, UploadAttachmentRequest>({
      query: ({ transaction_id, file }) => {
        const formData = new FormData();
        formData.append('transaction_id', transaction_id);
        formData.append('file', file);
        
        return {
          url: '/budget/transfers/upload-files/',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { transaction_id }) => [
        { type: 'Attachments', id: transaction_id }
      ],
    }),
  }),
});

export const {
  useGetAttachmentsQuery,
  useUploadAttachmentMutation,
} = attachmentsApi;
