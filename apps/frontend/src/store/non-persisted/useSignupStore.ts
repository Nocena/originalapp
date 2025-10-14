import { createTrackedSelector } from 'react-tracked';
import { create } from 'zustand';
import { RegisterStep } from '../../lib/register/utils';

interface SignupState {
  currentStep: RegisterStep;
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
  setCurrentStep: (currentStep: RegisterStep) => void;
}

const store = create<SignupState>((set) => ({
  currentStep: RegisterStep.WALLET_CONNECT,
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
  setCurrentStep: (currentStep) => set({ currentStep }),
}));

export const useSignupStore = createTrackedSelector(store);
