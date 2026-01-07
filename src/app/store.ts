import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '../features/auth/authSlice';
import { authApi } from '../api/auth.api';
import { transferApi } from '../api/transfer.api';
import { transferDetailsApi } from '../api/transferDetails.api';
import { pendingTransferApi } from '../api/pendingTransfer.api';
import { FundAdjustmentsApi } from '../api/fundAdjustments.api';
import { fundRequestApi } from '../api/fundRequests.api';
import { reportsApi } from '../api/reports.api';
import { attachmentsApi } from '../api/attachments.api';
import { balanceReportApi } from '../api/balanceReport.api';
import { dashboardApi } from '../api/dashboard.api';
import { adjdTransfersApi } from '../api/adjdTransfers.api';
import { workflowApi } from '@/api/workflow.api';
import { workflowAssignmentApi } from '@/api/workflowAssignment.api';
import { envelopeApi } from '../api/envelope.api';
import { userApi } from '@/api/user.api';
import { levelApi } from '@/api/level.api';
import { chatApi } from '@/api/chatApi';
import { invoiceApi } from '@/api/invoice.api';
import { chatbotApi } from '@/api/chatbot.api';
import { segmentConfigurationApi } from '@/api/segmentConfiguration.api';
import { analyticalReportApi } from '@/api/analyticalReport.api';
import { securityGroupsApi } from '@/api/securityGroups.api';
import { validationWorkflowApi } from '@/api/validationWorkflow.api';
import { notificationsApi } from '@/api/notifications.api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [transferApi.reducerPath]: transferApi.reducer,
    [transferDetailsApi.reducerPath]: transferDetailsApi.reducer,
    [pendingTransferApi.reducerPath]: pendingTransferApi.reducer,
    [FundAdjustmentsApi.reducerPath]: FundAdjustmentsApi.reducer,
    [fundRequestApi.reducerPath]: fundRequestApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
    [attachmentsApi.reducerPath]: attachmentsApi.reducer,
    [balanceReportApi.reducerPath]: balanceReportApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [adjdTransfersApi.reducerPath]: adjdTransfersApi.reducer,
    [workflowApi.reducerPath]: workflowApi.reducer,
    [workflowAssignmentApi.reducerPath]: workflowAssignmentApi.reducer,
    [envelopeApi.reducerPath]: envelopeApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [levelApi.reducerPath]: levelApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [invoiceApi.reducerPath]: invoiceApi.reducer,
    [chatbotApi.reducerPath]: chatbotApi.reducer,
    [segmentConfigurationApi.reducerPath]: segmentConfigurationApi.reducer,
    [analyticalReportApi.reducerPath]: analyticalReportApi.reducer,
    [securityGroupsApi.reducerPath]: securityGroupsApi.reducer,
    [validationWorkflowApi.reducerPath]: validationWorkflowApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware, 
      transferApi.middleware, 
      transferDetailsApi.middleware,
      pendingTransferApi.middleware,
      FundAdjustmentsApi.middleware, 
      fundRequestApi.middleware, 
      reportsApi.middleware, 
      attachmentsApi.middleware,
      balanceReportApi.middleware,
      dashboardApi.middleware,
      adjdTransfersApi.middleware,
      workflowApi.middleware,
      workflowAssignmentApi.middleware,
      envelopeApi.middleware,
      userApi.middleware,
      levelApi.middleware,
      chatApi.middleware,
      invoiceApi.middleware,
      chatbotApi.middleware,
      segmentConfigurationApi.middleware,
      analyticalReportApi.middleware,
      securityGroupsApi.middleware,
      validationWorkflowApi.middleware,
      notificationsApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
