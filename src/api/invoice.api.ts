import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';

export interface InvoiceData {
  InvoiceNumber: string;
  InvoiceCurrency: string;
  InvoiceAmount: number ;
  InvoiceDate: string;
  BusinessUnit: string;
  Supplier: string;
  SupplierSite: string;
  Description?: string;
  InvoiceGroup?: string;
  invoiceDff?: Array<{ __FLEX_Context: string }>;
  invoiceLines?: Array<{
    LineNumber: number;
    LineAmount: string;
    invoiceLineDff?: Array<{ __FLEX_Context: string }>;
    invoiceDistributions?: Array<{
      DistributionLineNumber: number;
      DistributionLineType: string;
      DistributionAmount: string;
      DistributionCombination?: string;
    }>;
  }>;
}

export interface UploadInvoiceResponse {
  message: string;
  model_used: string;
  invoice_number: string;
  file_name: string;
  pdf_base64: string;
  data: InvoiceData;
}

export interface Invoice {
  Invoice_ID?: number;
  Invoice_Number?: string;
  Invoice_Data?: InvoiceData;
  base64_file?: string;
  file_name?: string | null;
  uploaded_by?: number;
  // Flattened fields from list endpoint
  InvoiceNumber?: string;
  status?: string;
  InvoiceCurrency?: string;
  InvoiceAmount?:  number;
  InvoiceDate?: string;
  BusinessUnit?: string;
  Supplier?: string;
  SupplierSite?: string;
}

export interface InvoicesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Invoice[];
}

export interface SaveInvoicePayload {
  Invoice_Data: InvoiceData;
  Invoice_Number: string;
  base64_file: string;
  file_name: string;
}

export interface SubmitInvoicePayload {
  InvoiceNumber: string;
}

export interface SaveInvoiceResponse {
  message: string;
  invoice_id?: number;
}

export interface SubmitInvoiceResponse {
  message: string;
  status?: string;
}

export const invoiceApi = createApi({
  reducerPath: 'invoiceApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Invoice'],
  endpoints: (builder) => ({
    getInvoices: builder.query<InvoicesResponse, { page?: number; page_size?: number; search?: string }>({
      query: ({ page = 1, page_size = 10, search = '' }) => ({
        url: '/Invoice/Invoice_Crud/',
        params: { page, page_size, search },
      }),
      providesTags: ['Invoice'],
    }),
    getInvoiceById: builder.query<InvoicesResponse, string>({
      query: (invoiceNumber) => ({
        url: '/Invoice/Invoice_Crud/',
        params: { Invoice_Number: invoiceNumber },
      }),
      providesTags: ['Invoice'],
    }),
    deleteInvoice: builder.mutation<void, number | string>({
      query: (invoiceId) => ({
        url: `/Invoice/Invoice_Crud/`,
        method: 'DELETE',
        params: { Invoice_Number: invoiceId },
      }),
      invalidatesTags: ['Invoice'],
    }),
    uploadInvoice: builder.mutation<UploadInvoiceResponse, FormData>({
      query: (formData) => ({
        url: '/Invoice/Invoice_extraction/',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Invoice'],
    }),
    saveInvoice: builder.mutation<SaveInvoiceResponse, SaveInvoicePayload>({
      query: (data) => ({
        url: '/Invoice/Invoice_Crud/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Invoice'],
    }),
    updateInvoice: builder.mutation<SaveInvoiceResponse, SaveInvoicePayload>({
      query: (data) => ({
        url: '/Invoice/Invoice_Crud/',
        method: 'PUT',
        params: { Invoice_Number: data.Invoice_Number },
        body: data,
      }),
      invalidatesTags: ['Invoice'],
    }),
    submitInvoice: builder.mutation<SubmitInvoiceResponse, SubmitInvoicePayload>({
      query: (data) => ({
        url: '/Invoice/Submit/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Invoice'],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetInvoiceByIdQuery,
  useDeleteInvoiceMutation,
  useUploadInvoiceMutation,
  useSaveInvoiceMutation,
  useUpdateInvoiceMutation,
  useSubmitInvoiceMutation,
} = invoiceApi;
