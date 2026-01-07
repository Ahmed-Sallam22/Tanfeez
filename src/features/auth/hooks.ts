import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../app/store';

export const useAuth = () => useSelector((state: RootState) => state.auth);
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T) => useSelector(selector);

export const useUser = () => useSelector((state: RootState) => state.auth.user);
export const useUserLevel = () => useSelector((state: RootState) => state.auth.userLevel);
export const useUserRole = () => useSelector((state: RootState) => state.auth.user?.role);
export const useUserId = () => useSelector((state: RootState) => state.auth.user?.id);
export const useCanTransferBudget = () => useSelector((state: RootState) => state.auth.user?.can_transfer_budget);
