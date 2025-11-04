import { createTrackedSelector } from 'react-tracked';
import { create } from 'zustand';

interface permissionGuideModalStoreState {
  showGuideModal: boolean;
  setShowGuideModal: (showGuideModal: boolean) => void;
}

const store = create<permissionGuideModalStoreState>((set) => ({
  showGuideModal: false,
  setShowGuideModal: (showGuideModal) => set({ showGuideModal }),
}));

export const usePermissionGuideModalStore = createTrackedSelector(store);
