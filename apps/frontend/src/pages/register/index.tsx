// pages/index.tsx - Fixed to prevent duplicate registrations with optional notifications
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useActiveAccount } from 'thirdweb/react';
import { generateInviteCode } from '../../lib/api/dgraph';
import { registerUser } from '../../lib/graphql';
import AuthenticationLayout from '@components/layout/AuthenticationLayout';
import RegisterWelcomeStep from '@components/register/components/RegisterWelcomeStep';
import RegisterInviteCodeStep from '@components/register/components/RegisterInviteCodeStep';
import RegisterWalletConnectStep from '@components/register/components/RegisterWalletConnectStep';
import RegisterFormStep from '@components/register/components/RegisterFormStep';
import RegisterNotificationsStep from '@components/register/components/RegisterNotificationsStep';
import { useSwitchAccountMutation } from '@nocena/indexer';
import { toast } from 'react-hot-toast';
import { getStepInfo, RegisterStep, validateInviteCode } from 'src/lib/register/utils';
import { schema } from 'src/lib/register/values';
import Minting from '@pages/register/Minting';
import { useSignupStore } from '../../store/non-persisted/useSignupStore';
import { signIn } from '../../store/persisted/useAuthStore';

type FormValues = {
  username: string;
  inviteCode: string[];
};

// Temporary registration data that doesn't get committed until success
interface RegistrationData {
  username: string;
  inviteCode: string;
  inviteOwner: string;
  invitedById: string;
  walletAddress: string;
  pushSubscription?: string | null; // Updated to allow null
}

const RegisterPage = () => {
  const {
    onboardingToken,
    currentStep,
    transactionHash,
    setCurrentStep,
    accountAddress: lensAccountAddress,
  } = useSignupStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [storedPushSubscription, setStoredPushSubscription] = useState<string | null>(null);

  // Video preloading states
  // const [videoPreloaded, setVideoPreloaded] = useState(false);
  // const [videoPreloadError, setVideoPreloadError] = useState(false);

  // Temporary registration data - not committed to context until success
  const [registrationData, setRegistrationData] = useState<Partial<RegistrationData>>({});

  // CRITICAL: Registration state management to prevent duplicate registrations
  const [registrationCompleted, setRegistrationCompleted] = useState(false);
  const [registrationInProgress, setRegistrationInProgress] = useState(false);
  const registrationAttemptRef = useRef<string | null>(null);

  const router = useRouter();
  const account = useActiveAccount();

  const onError = (error?: any) => {
    setRegistrationInProgress(false);
    toast.error(error);
  };
  const [switchAccount] = useSwitchAccountMutation({ onError });

  const methods = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      username: '',
      inviteCode: Array(6).fill(''),
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = methods;

  const handleValidInviteCode = async (code: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await validateInviteCode(code);

      if (data.valid) {
        // Store invite data temporarily
        setRegistrationData((prev) => ({
          ...prev,
          inviteCode: code,
          inviteOwner: data.invite.ownerUsername || 'Someone',
          invitedById: data.invite.ownerId || '',
        }));

        // Always proceed to wallet connect step after valid invite code
        setCurrentStep(RegisterStep.WALLET_CONNECT);
      } else {
        setError(data.error || 'Invalid invite code');
      }
    } catch (err) {
      console.error('Error validating invite:', err);
      setError('Failed to validate invite code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletConnected = () => {
    if (account?.address) {
      // Store wallet address temporarily
      setRegistrationData((prev) => ({
        ...prev,
        walletAddress: account.address,
      }));
      setCurrentStep(RegisterStep.USER_INFO);
    }
  };

  const handleFormComplete = async () => {
    const currentFormData = watch();

    // Store username temporarily
    setRegistrationData((prev) => ({
      ...prev,
      username: currentFormData.username,
    }));

    setCurrentStep(RegisterStep.NOTIFICATIONS);
  };

  // Updated to accept string | null for optional notifications
  const handleNotificationsReady = async (pushSubscription: string | null) => {
    setCurrentStep(RegisterStep.MINTING);
    setStoredPushSubscription(pushSubscription);
  };

  const registerWholeAccount = async (lensAccountAddress: string) => {
    // CRITICAL: Prevent duplicate registrations - check immediately
    if (registrationInProgress) {
      console.log('⚠️ Registration already in progress, ignoring duplicate attempt');
      return;
    }

    if (registrationCompleted) {
      console.log('⚠️ Registration already completed, ignoring duplicate attempt');
      return;
    }

    // Create a unique attempt ID to track this specific registration attempt
    const attemptId = `${registrationData.walletAddress}-${registrationData.username}-${Date.now()}`;

    // Check if this exact attempt was already processed
    if (registrationAttemptRef.current) {
      console.log('⚠️ Registration attempt already in process, ignoring duplicate');
      return;
    }

    console.log('🚀 REGISTRATION ATTEMPT:', {
      attemptId,
      registrationInProgress,
      registrationCompleted,
      currentAttempt: registrationAttemptRef.current,
      username: registrationData.username,
      wallet: registrationData.walletAddress,
      pushSubscription: storedPushSubscription ? 'Enabled' : 'Skipped/Failed',
    });

    // Validate we have all required data
    if (
      !registrationData.username ||
      !registrationData.walletAddress /* || !registrationData.inviteCode*/
    ) {
      setError('Missing registration data. Please try again.');
      return;
    }

    // Mark registration as in progress and store attempt ID
    setRegistrationInProgress(true);
    registrationAttemptRef.current = attemptId;
    setLoading(true);
    setError('');

    console.log('🔒 REGISTRATION LOCKED:', {
      attemptId,
      inProgress: true,
      timestamp: new Date().toISOString(),
      notificationsEnabled: !!storedPushSubscription,
    });

    try {
      // STEP 1: register Lens Account
      const auth = await switchAccount({
        context: { headers: { 'X-Access-Token': onboardingToken } },
        variables: { request: { account: lensAccountAddress } },
      });

      if (auth.data?.switchAccount.__typename === 'AuthenticationTokens') {
        const accessToken = auth.data?.switchAccount.accessToken;
        const refreshToken = auth.data?.switchAccount.refreshToken;
        signIn({ accessToken, refreshToken });
        // STEP 3: Mark invite code as used (no recovery mode exception)
        /*
        await fetch('/api/registration/use-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inviteCode: registrationData.inviteCode,
            newUserId: addedUser.id,
          }),
        });
*/

        // STEP 4: Generate initial invite codes
/*
        try {
          await generateInviteCode(addedUser.id, 'initial');
          await generateInviteCode(addedUser.id, 'initial');
          console.log('✅ Initial invite codes generated');
        } catch (inviteError) {
          console.error('Error generating initial invite codes:', inviteError);
          // Don't fail registration for this
        }
*/

        // STEP 5: Create user data and commit to AuthContext
        console.log('👤 Creating user data for AuthContext...');
        // Mark registration as completed
        setRegistrationCompleted(true);
        setCurrentStep(RegisterStep.WELCOME);
      }
    } catch (err) {
      console.error('💥 Registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to register. Please try again.');
      setCurrentStep(RegisterStep.USER_INFO);

      // Reset registration state on error so user can try again
      setRegistrationInProgress(false);
      registrationAttemptRef.current = null;
    } finally {
      setLoading(false);
      // Don't reset registrationInProgress here if successful, keep it locked
      if (!registrationCompleted) {
        setRegistrationInProgress(false);
      }
    }
  };

  // Handle welcome screen completion - adjust timing based on video availability
  useEffect(() => {
    if (currentStep === RegisterStep.WELCOME) {
      // Determine timing: longer if video loads, shorter if no video (fallback experience)
      const welcomeDuration = /*videoPreloaded ?*/ 7000; /* : 3000;*/ // 7s with video, 3s without

      /*
            console.log(
              `⏱️ Welcome screen will show for ${welcomeDuration}ms (video preloaded: ${videoPreloaded}, error: ${videoPreloadError})`,
            );
      */

      const timer = setTimeout(() => {
        console.log('🏠 Navigating to home...');
        router.push('/login');
      }, welcomeDuration);

      return () => clearTimeout(timer);
    }
  }, [currentStep, router /*, videoPreloaded, videoPreloadError*/]);

  const onSubmit = async (values: FormValues) => {
    console.log('Form submitted:', values);
  };

  const getStepContent = () => {
    switch (currentStep) {
      case RegisterStep.INVITE_CODE:
        return (
          <RegisterInviteCodeStep
            control={control}
            onValidCode={handleValidInviteCode}
            reset={reset}
            loading={loading}
            error={error}
          />
        );

      case RegisterStep.WALLET_CONNECT:
        return <RegisterWalletConnectStep onWalletConnected={handleWalletConnected} />;

      case RegisterStep.USER_INFO:
        return (
          <RegisterFormStep control={control} loading={loading} setStep={handleFormComplete} />
        );

      case RegisterStep.MINTING:
        return <Minting registerWholeAccount={registerWholeAccount} />;

      case RegisterStep.NOTIFICATIONS:
        return (
          <div className="space-y-4">
            <RegisterNotificationsStep
              onNotificationsReady={handleNotificationsReady}
              username={registrationData.username}
              disabled={registrationInProgress || registrationCompleted}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const stepInfo = useMemo(
    () => getStepInfo(currentStep, registrationInProgress, registrationCompleted),
    [currentStep, registrationInProgress, registrationCompleted]
  );

  if (currentStep === RegisterStep.WELCOME) {
    return <RegisterWelcomeStep inviteOwner={registrationData.inviteOwner || 'Someone'} />;
  }

  return (
    <AuthenticationLayout title={stepInfo.title} subtitle={stepInfo.subtitle}>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
          {getStepContent()}

          {error && currentStep !== RegisterStep.INVITE_CODE && (
            <div className="bg-red-500/20 border border-red-500 rounded-xl p-4">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}
        </form>
      </FormProvider>
    </AuthenticationLayout>
  );
};

export default RegisterPage;
