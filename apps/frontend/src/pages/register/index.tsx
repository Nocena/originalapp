// pages/index.tsx - Fixed to prevent duplicate registrations with optional notifications
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useActiveAccount } from 'thirdweb/react';
import { generateInviteCode, registerUser } from '../../lib/graphql';
import { useAuth, User } from '../../contexts/AuthContext';
import AuthenticationLayout from '@components/layout/AuthenticationLayout';
import RegisterWelcomeStep from '@components/register/components/RegisterWelcomeStep';
import RegisterInviteCodeStep from '@components/register/components/RegisterInviteCodeStep';
import RegisterWalletConnectStep from '@components/register/components/RegisterWalletConnectStep';
import RegisterFormStep from '@components/register/components/RegisterFormStep';
import RegisterNotificationsStep from '@components/register/components/RegisterNotificationsStep';
import { IS_MAINNET, NOCENA_APP } from '@nocena/data/constants';
import { useAuthenticateMutation, useChallengeMutation, useCreateAccountWithUsernameMutation } from '@nocena/indexer';
import { toast } from 'react-hot-toast';
import { signMessage } from 'thirdweb/utils';
import { uploadMetadataToGrove } from '@utils/groveUtils';
import { account as accountMetadata } from '@lens-protocol/metadata';
import { getStepInfo, validateInviteCode } from '@pages/register/utils';
import { schema } from '@pages/register/values';

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

export enum RegisterStep {
  INVITE_CODE = 0,
  WALLET_CONNECT = 1,
  USER_INFO = 2,
  NOTIFICATIONS = 3,
  MINTING = 4,
  WELCOME = 5,
}

const RegisterPage = () => {
  const [currentStep, setCurrentStep] = useState(RegisterStep.WALLET_CONNECT);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
  const { login } = useAuth();
  const account = useActiveAccount();

  const onError = (error?: any) => {
    setRegistrationInProgress(false);
    toast.error(error);
  };
  const [loadChallenge] = useChallengeMutation({ onError });
  const [authenticate] = useAuthenticateMutation({ onError });
  const [createAccountWithUsername] = useCreateAccountWithUsernameMutation({
    onError,
  });

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
      pushSubscription: pushSubscription ? 'Enabled' : 'Skipped/Failed',
    });

    // Validate we have all required data
    if (!registrationData.username || !registrationData.walletAddress/* || !registrationData.inviteCode*/) {
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
      notificationsEnabled: !!pushSubscription,
    });

    try {
      // STEP 1: Get Lens data (via lens SDK)
      const challenge = await loadChallenge({
        variables: {
          request: {
            onboardingUser: {
              app: IS_MAINNET ? NOCENA_APP : undefined,
              wallet: account?.address,
            },
          },
        },
      });

      if (!challenge?.data?.challenge?.text) {
        return toast.error('Something went wrong!');
      }

      // Get signature
      // Get signature
      const signature = await signMessage({
        message: challenge?.data?.challenge?.text,
        account: account!,
      });

      // Auth account
      const auth = await authenticate({
        variables: { request: { id: challenge.data.challenge.id, signature } },
      });

      if (auth.data?.authenticate.__typename === 'AuthenticationTokens') {
        const accessToken = auth.data?.authenticate.accessToken;
        const metadataUri = await uploadMetadataToGrove(
          accountMetadata({ name: registrationData.username }),
        );

        // setOnboardingToken(accessToken);
        await createAccountWithUsername({
          context: { headers: { 'X-Access-Token': accessToken } },
          variables: {
            request: {
              username: { localName: registrationData.username.toLowerCase() },
              metadataUri,
            },
          },
          onCompleted: ({ createAccountWithUsername }) => {
            if (
              createAccountWithUsername.__typename === 'CreateAccountResponse'
            ) {
              // setTransactionHash(createAccountWithUsername.hash);
              // setChoosedUsername(username);
              // setScreen('minting');
            }
          },
        });

        // STEP 2: Register the user in Dgraph with mock Lens data
        console.log('🗄️ Creating user in Dgraph with mock Lens data...');
        const addedUser = await registerUser({
            username: registrationData.username,
            bio: '', // bio (empty for new users)
            profilePicture: '/images/profile.png', // profilePicture
            coverPhoto: '/images/cover.jpg', // coverPhoto
            trailerVideo: '/trailer.mp4', // trailerVideo
            wallet: registrationData.walletAddress,
            earnedTokens: 50, // earnedTokens
            earnedTokensToday: 0, // earnedTokensToday
            earnedTokensThisWeek: 0, // earnedTokensThisWeek
            earnedTokensThisMonth: 0, // earnedTokensThisMonth
            personalField1Type: '', // personalField1Type
            personalField1Value: '', // personalField1Value
            personalField1Metadata: '', // personalField1Metadata
            personalField2Type: '', // personalField2Type
            personalField2Value: '', // personalField2Value
            personalField2Metadata: '', // personalField2Metadata
            personalField3Type: '', // personalField3Type
            personalField3Value: '', // personalField3Value
            personalField3Metadata: '', // personalField3Metadata
            dailyChallenge: '0'.repeat(365), // dailyChallenge
            weeklyChallenge: '0'.repeat(52), // weeklyChallenge
            monthlyChallenge: '0'.repeat(12), // monthlyChallenge
            inviteCode: registrationData.inviteCode || '',
            // Mock Lens data (these come BEFORE invitedById and pushSubscription according to function signature)
            lensHandle: '',
            lensAccountId: '',
            lensTransactionHash: '',
            lensMetadataUri: '',
            // These are the optional parameters at the end
            invitedById: registrationData.invitedById || '',
            pushSubscription: pushSubscription || '', // Convert null to empty string for the API
          },
        );

        if (!addedUser) {
          throw new Error('Failed to create user in database');
        }

        console.log('✅ User created in Dgraph with mock Lens data:', {
          userId: addedUser.id,
          username: addedUser.username,
          lensHandle: addedUser.lensHandle,
          lensAccountId: addedUser.lensAccountId,
          notificationsEnabled: !!pushSubscription,
        });

        // STEP 3: Mark invite code as used (no recovery mode exception)
        await fetch('/api/registration/use-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inviteCode: registrationData.inviteCode,
            newUserId: addedUser.id,
          }),
        });

        // STEP 4: Generate initial invite codes
        try {
          await generateInviteCode(addedUser.id, 'initial');
          await generateInviteCode(addedUser.id, 'initial');
          console.log('✅ Initial invite codes generated');
        } catch (inviteError) {
          console.error('Error generating initial invite codes:', inviteError);
          // Don't fail registration for this
        }

        // STEP 5: Create user data and commit to AuthContext
        console.log('👤 Creating user data for AuthContext...');
        const userData: User = {
          id: addedUser.id,
          username: registrationData.username,
          bio: '', // Empty bio for new users
          wallet: registrationData.walletAddress,
          profilePicture: '/images/profile.png',
          coverPhoto: '/images/cover.jpg',
          trailerVideo: '/trailer.mp4',
          earnedTokens: 50,
          earnedTokensDay: 0,
          earnedTokensWeek: 0,
          earnedTokensMonth: 0,

          // Personal Expression Fields
          personalField1Type: '',
          personalField1Value: '',
          personalField1Metadata: '',
          personalField2Type: '',
          personalField2Value: '',
          personalField2Metadata: '',
          personalField3Type: '',
          personalField3Value: '',
          personalField3Metadata: '',

          pushSubscription: pushSubscription || '', // Store actual value or empty string
          dailyChallenge: '0'.repeat(365),
          weeklyChallenge: '0'.repeat(52),
          monthlyChallenge: '0'.repeat(12),

          // Include mock Lens data in user context
          lensHandle: addedUser.lensHandle!,
          lensAccountId: addedUser.lensAccountId!,
          lensTransactionHash: addedUser.lensTransactionHash!,
          lensMetadataUri: addedUser.lensMetadataUri!,

          followers: [],
          following: [],
          notifications: [],
          completedChallenges: [],
          receivedPrivateChallenges: [],
          createdPrivateChallenges: [],
          createdPublicChallenges: [],
          participatingPublicChallenges: [],
        };

        // STEP 6: Commit to AuthContext only after everything is successful
        console.log('🔐 Logging in user...');
        await login(userData);

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
      const welcomeDuration = /*videoPreloaded ?*/ 7000/* : 3000;*/ // 7s with video, 3s without

/*
      console.log(
        `⏱️ Welcome screen will show for ${welcomeDuration}ms (video preloaded: ${videoPreloaded}, error: ${videoPreloadError})`,
      );
*/

      const timer = setTimeout(() => {
        console.log('🏠 Navigating to home...');
        router.push('/home');
      }, welcomeDuration);

      return () => clearTimeout(timer);
    }
  }, [currentStep, router/*, videoPreloaded, videoPreloadError*/]);

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
        return <RegisterFormStep control={control} loading={loading} setStep={handleFormComplete} />;

      case RegisterStep.NOTIFICATIONS:
        return (
          <div className="space-y-4">
            <RegisterNotificationsStep
              onNotificationsReady={handleNotificationsReady}
              disabled={registrationInProgress || registrationCompleted}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const stepInfo = useMemo(() =>
    getStepInfo(currentStep, registrationInProgress, registrationCompleted), [currentStep, registrationInProgress, registrationCompleted]);

  if (currentStep === RegisterStep.WELCOME) {
    return (
      <RegisterWelcomeStep
        inviteOwner={registrationData.inviteOwner || 'Someone'}
      />
    );
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
