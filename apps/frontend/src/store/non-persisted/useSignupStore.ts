import { createTrackedSelector } from 'react-tracked';
import { create } from 'zustand';

interface SignupState {
  choosedUsername: string;
  accountAddress: string;
  screen: 'choose' | 'minting' | 'success';
  transactionHash: string;
  onboardingToken: string;
  setChoosedUsername: (username: string) => void;
  setAccountAddress: (accountAddress: string) => void;
  setScreen: (screen: 'choose' | 'minting' | 'success') => void;
  setTransactionHash: (hash: string) => void;
  setOnboardingToken: (token: string) => void;
}

const store = create<SignupState>((set) => ({
  choosedUsername: '',
  accountAddress: '',
  screen: 'choose',
  transactionHash: '',
  onboardingToken: '',
  setChoosedUsername: (username) => set({ choosedUsername: username }),
  setAccountAddress: (accountAddress) => set({ accountAddress }),
  setScreen: (screen) => set({ screen }),
  setTransactionHash: (hash) => set({ transactionHash: hash }),
  setOnboardingToken: (token) => set({ onboardingToken: token }),
}));

export const useSignupStore = createTrackedSelector(store);
