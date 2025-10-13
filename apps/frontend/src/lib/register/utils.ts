import { RegisterStep } from '@pages/register/index';

export const getStepInfo = (
  currentStep: RegisterStep,
  registrationInProgress: boolean,
  registrationCompleted: boolean
) => {
  switch (currentStep) {
    case RegisterStep.INVITE_CODE:
      return {
        title: 'Join the Challenge',
        subtitle: 'Enter your invite code to create your account',
      };
    case RegisterStep.WALLET_CONNECT:
      return {
        title: 'Create your profile',
        subtitle: 'Connect some of your accounts to start your Nocena journey',
      };
    case RegisterStep.USER_INFO:
      return {
        title: 'Create Your Account',
        subtitle: 'Choose your username',
      };
    case RegisterStep.NOTIFICATIONS:
      return {
        title: 'Last step - you know the deal',
        subtitle: registrationInProgress
          ? 'Creating your account...'
          : registrationCompleted
            ? 'Account created!'
            : 'Enable notifications for challenges and rewards and read our legal documents',
      };
    default:
      return {
        title: '',
        subtitle: '',
      };
  }
};

export const validateInviteCode = async (code: string): Promise<any> => {
  const response = await fetch('/api/registration/validate-invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteCode: code }),
  });

  return await response.json();
};
