import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';

import ThematicContainer from '../../components/ui/ThematicContainer';
import FollowersPopup from './components/FollowersPopup';
import AvatarSection from './components/AvatarSection'; // Changed from TrailerSection
import StatsSection from './components/StatsSection';
import CalendarSection from './components/CalendarSection';
import { useNoceniteBalanceFormatted } from '../../hooks/useNoceniteBalance';

import PenIcon from '../../components/icons/pen';
import type { AccountOptions, MetadataAttribute } from '@lens-protocol/metadata';
import { account as accountMetadata, MetadataAttributeType } from '@lens-protocol/metadata';

// Custom hooks
import { toast } from 'react-hot-toast';
import trimify from '../../helpers/trimify';
import uploadMetadata from 'src/helpers/uploadMetadata';
import { useAccountStatsQuery, useMeLazyQuery, useSetAccountMetadataMutation } from '@nocena/indexer';
import useTransactionLifecycle from '../../hooks/useTransactionLifecycle';
import usePollTransactionStatus from '../../hooks/usePollTransactionStatus';
import { uploadImageFile } from 'src/helpers/accountPictureUtils';
import LoadingSpinner from '@components/ui/LoadingSpinner';
import PrimaryButton from '@components/ui/PrimaryButton';
import CompletionsSection from '@pages/profile/components/completions/CompletionsSection';

const defaultProfilePic = '/images/profile.png';
const nocenix = '/nocenix.ico';

const ProfileView: React.FC = () => {
  const DEFAULT_PROFILE_PIC = '/images/profile.png';
  const { currentLensAccount, setCurrentLensAccount } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCoverSaving, setIsCoverSaving] = useState(false);
  const [isAvatarSaving, setIsAvatarSaving] = useState(false);
  const [isBioSaving, setIsBioSaving] = useState(false);
  // Basic profile state
  const [profilePic, setProfilePic] = useState<string>(currentLensAccount?.metadata?.picture);
  const [showFollowersPopup, setShowFollowersPopup] = useState<boolean>(false);
  const [coverPhoto, setCoverPhoto] = useState<string>(currentLensAccount?.metadata?.coverPicture);
  const [username, setUsername] = useState<string>(currentLensAccount?.metadata?.name || '');
  const [bio, setBio] = useState<string>(currentLensAccount?.metadata?.bio || '');
  const [isEditingBio, setIsEditingBio] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<'trailer' | 'calendar' | 'achievements' | 'completions'>(
    'completions',
  );

  // Fetch NCT balance using the global hook
  const { balance: tokenBalance, loading: nctLoading } = useNoceniteBalanceFormatted(currentLensAccount?.owner);

  // Avatar generation state - NEW
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(
    currentLensAccount?.metadata?.picture || null,
  );

  // Challenge data
  const [dailyChallenges, setDailyChallenges] = useState<boolean[]>(
    /*user?.dailyChallenge.split('').map((char) => char === '1') || */[],
  );
  const [weeklyChallenges, setWeeklyChallenges] = useState<boolean[]>(
    /*user?.weeklyChallenge.split('').map((char) => char === '1') || */[],
  );
  const [monthlyChallenges, setMonthlyChallenges] = useState<boolean[]>(
    /*user?.monthlyChallenge.split('').map((char) => char === '1') || */[],
  );

  const { data: accountStatsData, loading: accountStatsLoading } = useAccountStatsQuery({
    variables: { request: { account: currentLensAccount?.address } },
  });
  const stats = accountStatsData?.accountStats.graphFollowStats;

  // Sync user data when user changes
  useEffect(() => {
    if (currentLensAccount) {
      // setDailyChallenges(user.dailyChallenge.split('').map((char) => char === '1'));
      // setWeeklyChallenges(user.weeklyChallenge.split('').map((char) => char === '1'));
      // setMonthlyChallenges(user.monthlyChallenge.split('').map((char) => char === '1'));
      // setTokenBalance(user.earnedTokens || 0);
      setProfilePic(currentLensAccount?.metadata?.picture);
      setCoverPhoto(currentLensAccount?.metadata?.coverPicture);
      setUsername(currentLensAccount?.metadata?.name || '');
      setBio(
        currentLensAccount?.metadata?.bio || 'Creator building the future of social challenges 🚀\nJoin me on this journey!',
      );

      // NEW: Avatar data loading
      // setGeneratedAvatar(user.currentAvatar || null);
    }
  }, [currentLensAccount]);

  const [getCurrentAccountDetails] = useMeLazyQuery({
    fetchPolicy: 'no-cache',
    variables: { request: { post: '' } },
  });

  // Calculate stats for components
  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = dailyChallenges.length - 1; i >= 0; i--) {
      if (dailyChallenges[i]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [dailyChallenges]);

  const handleTransactionLifecycle = useTransactionLifecycle();
  const pollTransactionStatus = usePollTransactionStatus();

  const totalChallenges = useMemo(() => {
    return (
      dailyChallenges.filter(Boolean).length +
      weeklyChallenges.filter(Boolean).length +
      monthlyChallenges.filter(Boolean).length
    );
  }, [dailyChallenges, weeklyChallenges, monthlyChallenges]);

  const onCompleted = (hash: string) => {
    pollTransactionStatus(hash, async () => {
      const accountData = await getCurrentAccountDetails();
      setCurrentLensAccount(accountData?.data?.me.loggedInAs.account);
      setIsCoverSaving(false);
      setIsAvatarSaving(false);
      setIsBioSaving(false);
      toast.success('Account updated');
    });
  };

  const onError = (error: Error) => {
    setIsCoverSaving(false);
    setIsAvatarSaving(false);
    setIsBioSaving(false);
    toast.error(error.message);
  };

  const [setAccountMetadata] = useSetAccountMetadataMutation({
    onCompleted: async ({ setAccountMetadata }) => {
      if (setAccountMetadata.__typename === 'SetAccountMetadataResponse') {
        return onCompleted(setAccountMetadata.hash);
      }

      return await handleTransactionLifecycle({
        transactionData: setAccountMetadata,
        onCompleted,
        onError,
      });
    },
    onError,
  });

  const updateAccount = async (
    pfpUrl: string | undefined,
    coverUrl: string | undefined,
  ) => {
    if (!currentLensAccount) {
      return toast.error('Please sign in your wallet.');
    }

    const otherAttributes =
      currentLensAccount.metadata?.attributes
        ?.filter(
          (attr) =>
            !['app', 'location', 'timestamp', 'website', 'x'].includes(attr.key),
        )
        .map(({ key, type, value }) => ({
          key,
          type: MetadataAttributeType[type] as any,
          value,
        })) || [];

    const preparedAccountMetadata: AccountOptions = {
      ...(username && { name: username }),
      ...(bio && { bio }),
      attributes: [
        ...(otherAttributes as MetadataAttribute[]),
        {
          key: 'timestamp',
          type: MetadataAttributeType.STRING,
          value: new Date().toISOString(),
        },
      ],
      coverPicture: coverUrl || undefined,
      picture: pfpUrl || undefined,
    };
    preparedAccountMetadata.attributes =
      preparedAccountMetadata.attributes?.filter((m) => {
        return m.key !== '' && Boolean(trimify(m.value));
      });
    const metadataUri = await uploadMetadata(
      accountMetadata(preparedAccountMetadata),
    );

    return await setAccountMetadata({
      variables: { request: { metadataUri } },
    });
  };


  // NEW: Updated avatar handler
  const handleAvatarUpdated = (newAvatarUrl: string) => {
    console.log('🎉 Avatar updated in ProfileView:', newAvatarUrl);
    setGeneratedAvatar(newAvatarUrl);
    /*

        // Update user context
        if (user) {
          const updatedUser = { ...user, currentAvatar: newAvatarUrl };
          login(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
    */
  };

  // Image upload handlers
  const handleProfilePicClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCoverPhotoClick = () => {
    if (coverInputRef.current) {
      coverInputRef.current.click();
    }
  };

  const handleProfilePicUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentLensAccount) {
      setIsAvatarSaving(true);
      const decentralizedUrl = await uploadImageFile(file);
      await updateAccount(decentralizedUrl, coverPhoto);
    }
  };

  const handleCoverPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentLensAccount) {
      setIsCoverSaving(true);
      const decentralizedUrl = await uploadImageFile(file);
      await updateAccount(profilePic, decentralizedUrl);
    }
  };

  // Bio editing handlers
  const handleEditBioClick = () => setIsEditingBio(true);

  const handleSaveBioClick = async () => {
    if (!currentLensAccount || bio === currentLensAccount?.metadata?.bio) {
      setIsEditingBio(false);
      return;
    }

    try {
      setIsBioSaving(true);
      await updateAccount(profilePic, coverPhoto);
      setIsEditingBio(false);
    } catch (error) {
      console.error('Failed to update bio:', error);
      // alert('Failed to update your bio. Please try again later.');
    }
  };

  const handleCancelEdit = () => {
    setBio(
      currentLensAccount?.metadata?.bio || 'Creator building the future of social challenges 🚀\nJoin me on this journey!',
    );
    setIsEditingBio(false);
  };

  const getButtonColor = (section: string) => {
    switch (section) {
      case 'trailer':
      case 'completions':
        return 'nocenaPink';
      case 'calendar':
        return 'nocenaPurple';
      case 'achievements':
        return 'nocenaBlue';
      default:
        return 'nocenaBlue';
    }
  };

  return (
    <div
      className="fixed inset-0 text-white overflow-y-auto"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        width: '100vw',
        height: '100vh',
      }}
    >
      <div className="min-h-screen mb-20">
        {/* Cover Photo Section */}
        <div className="relative h-80 overflow-hidden">
          <Image src={coverPhoto || '/images/cover.jpg'} alt="Cover" fill className="object-cover" />

          {/* Gradient overlay for smooth blending effect */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent from-40% via-transparent via-70% to-black/80" />

          <div
            className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            onClick={handleCoverPhotoClick}
          >
            <div className="text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
              Change Cover Photo
            </div>
          </div>

          {
            isCoverSaving && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            )
          }

          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            ref={coverInputRef}
            style={{ display: 'none' }}
            onChange={handleCoverPhotoUpload}
          />
        </div>

        {/* Profile Section */}
        <div className="px-4 pb-8">
          {/* Profile Picture & Stats */}
          <div className="relative -mt-24 mb-4">
            <div className="flex items-end justify-between">
              {/* Profile Picture */}
              <div onClick={handleProfilePicClick} className="relative cursor-pointer group">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-1">
                  <div className="w-full h-full bg-slate-900/80 backdrop-blur-sm rounded-full p-1">
                    <Image
                      src={profilePic || defaultProfilePic}
                      alt="Profile"
                      width={120}
                      height={120}
                      className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform"
                    />
                    {
                      isAvatarSaving && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-full">
                          <LoadingSpinner size="md" />
                        </div>
                      )
                    }
                  </div>
                </div>
              </div>

              {/* Combined Stats Card */}
              <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex items-center space-x-6">
                  <div
                    className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setShowFollowersPopup(true)}
                  >
                    <div className="text-2xl font-bold">{stats?.followers}</div>
                    <div className="text-sm text-white/60">Followers</div>
                  </div>
                  <div className="w-px h-8 bg-white/20"></div>
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <span className="text-2xl font-bold">
                        {nctLoading ? '...' : tokenBalance.toFixed(1)}
                      </span>
                      <Image src={nocenix} alt="Nocenix" width={20} height={20} />
                    </div>
                    <div className="text-sm text-white/60">NCT Balance</div>
                  </div>
                </div>
              </div>
            </div>

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.heif,.hevc"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleProfilePicUpload}
            />
          </div>

          {/* Username */}
          <h1 className="text-2xl font-bold mb-4">{username}</h1>

          {/* Bio */}
          <div className="mb-6">
            {isEditingBio ? (
              <div className="space-y-3">
                <textarea
                  className="w-full p-4 bg-slate-800/40 backdrop-blur-md text-white rounded-xl border border-white/20 resize-none focus:outline-none focus:border-purple-400 transition-colors"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Tell others about yourself..."
                />
                <div className="flex space-x-3 justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-slate-700/60 backdrop-blur-sm hover:bg-slate-600/60 rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <div>
                    <PrimaryButton
                      text="Save"
                      onClick={handleSaveBioClick}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-80 rounded-lg transition-all text-sm font-medium"
                      loading={isBioSaving}
                    />
                  </div>
                  {/*
                  <button
                    onClick={handleSaveBioClick}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-80 rounded-lg transition-all text-sm font-medium"
                  >
                    Save
                  </button>
*/}
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {bio.split('\n').map((line, index) => (
                    <p key={index} className="text-white/80 leading-relaxed">
                      {line}
                    </p>
                  ))}
                </div>
                <button
                  onClick={handleEditBioClick}
                  className="ml-4 p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <PenIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Three Section Menu using ThematicContainer */}
          <div className="flex justify-center mb-6 space-x-4">
            {[
              // { key: 'trailer', label: 'Avatar' }, // Changed label
              { key: 'completions', label: 'Completions' }, // Changed label
              { key: 'calendar', label: 'Calendar' },
              // { key: 'achievements', label: 'Stats' },
            ].map(({ key, label }) => (
              <ThematicContainer
                key={key}
                asButton={true}
                glassmorphic={false}
                color={getButtonColor(key)}
                isActive={activeSection === key}
                onClick={() => setActiveSection(key as any)}
                className="px-8 py-2"
              >
                {label}
              </ThematicContainer>
            ))}
          </div>

          {/* Content Based on Active Section */}
          <div className="space-y-4">
            {activeSection === 'trailer' && (
              <div className="space-y-4">
                <AvatarSection
                  profilePicture={profilePic}
                  generatedAvatar={generatedAvatar}
                  onAvatarUpdated={handleAvatarUpdated}
                  userID={currentLensAccount?.address}
                  enableAvatarFeature={true}
                />
              </div>
            )}

            {activeSection === 'completions' && (
              <CompletionsSection
                userID={currentLensAccount?.address}
              />
            )}

            {activeSection === 'calendar' && (
              <CalendarSection
                dailyChallenges={dailyChallenges}
                weeklyChallenges={weeklyChallenges}
                monthlyChallenges={monthlyChallenges}
              />
            )}

            {activeSection === 'achievements' && (
              <StatsSection
                currentStreak={currentStreak}
                tokenBalance={tokenBalance}
                dailyChallenges={dailyChallenges}
                weeklyChallenges={weeklyChallenges}
                monthlyChallenges={monthlyChallenges}
              />
            )}
          </div>
        </div>
      </div>

      {/* Followers Popup */}
      <FollowersPopup
        isOpen={showFollowersPopup}
        onClose={() => setShowFollowersPopup(false)}
        isFollowers={true}
        accountAddress={currentLensAccount?.address}
      />
    </div>
  );
};

export default ProfileView;
