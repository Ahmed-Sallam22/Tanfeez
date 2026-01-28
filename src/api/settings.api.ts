import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';

export interface ThemeSettings {
  color: string;
  hover_color: string;
  main_logo: string;
  main_cover: string;
}

export interface ThemeSettingsResponse {
  data: ThemeSettings;
}

export interface UpdateThemeSettingsRequest {
  color?: string;
  hover_color?: string;
  main_logo?: File | string;
  main_cover?: File | string;
}

export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Settings'],
  endpoints: (builder) => ({
    getThemeSettings: builder.query<ThemeSettings, void>({
      query: () => '/settings/theme',
      providesTags: ['Settings'],
      transformResponse: (response: ThemeSettingsResponse) => response.data,
    }),
    updateThemeSettings: builder.mutation<ThemeSettings, FormData>({
      query: (formData: FormData) => ({
        url: '/settings/theme',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Settings'],
      transformResponse: (response: ThemeSettingsResponse) => response.data,
    }),
  }),
});

export const {
  useGetThemeSettingsQuery,
  useUpdateThemeSettingsMutation,
} = settingsApi;
