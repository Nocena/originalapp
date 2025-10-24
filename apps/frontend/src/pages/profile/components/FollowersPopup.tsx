import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

import ThematicContainer from '../../../components/ui/ThematicContainer';
import ThematicImage from '../../../components/ui/ThematicImage';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useAuth } from '../../../contexts/AuthContext';
import { AccountFragment, PageSize, useFollowersQuery } from '@nocena/indexer';
import { useRouter } from 'next/router';
import getAvatar from '../../../helpers/getAvatar';
import getAccount from '../../../helpers/getAccount';
import { useApolloClient } from '@apollo/client';
import { useLensFollowActions } from '../../../hooks/useLensFollowActions';

const nocenixIcon = '/nocenix.ico';

interface FollowersPopupProps {
  isOpen: boolean;
  onClose: () => void;
  isFollowers?: boolean; // true for followers, false for following
  accountAddress: string | undefined;
}

const FollowersPopup: React.FC<FollowersPopupProps> = ({
                                                         isOpen,
                                                         onClose,
                                                         isFollowers = true,
                                                         accountAddress,
                                                       }) => {
  const [pendingFollowActions, setPendingFollowActions] = useState<Set<string>>(new Set());
  const { currentLensAccount } = useAuth();
  const router = useRouter();
  const { cache } = useApolloClient();

  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchMoveY = useRef<number | null>(null);

  const { data, error, fetchMore, loading: isLoading } = useFollowersQuery({
    skip: !accountAddress,
    variables: {
      request: {
        pageSize: PageSize.Fifty,
        account: accountAddress,
      },
    },
  });
  const followers = data?.followers?.items;
  const pageInfo = data?.followers?.pageInfo;
  const hasMore = pageInfo?.next;

  // Setup touch handlers for swipe down to close
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only enable swipe to close when the content is scrolled to the top
      if (content.scrollTop <= 0) {
        touchStartY.current = e.touches[0].clientY;
      } else {
        touchStartY.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null) return;

      touchMoveY.current = e.touches[0].clientY;
      const deltaY = touchMoveY.current - touchStartY.current;

      // If swiping down
      if (deltaY > 0) {
        e.preventDefault(); // Prevent default scrolling
        content.style.transform = `translateY(${deltaY}px)`;
        content.style.transition = 'none';
      }
    };

    const handleTouchEnd = () => {
      if (touchStartY.current === null || touchMoveY.current === null) return;

      const deltaY = touchMoveY.current - touchStartY.current;

      // Reset styles
      content.style.transition = 'transform 0.3s ease-out';

      // If swiped down enough, close the popup
      if (deltaY > 100) {
        content.style.transform = 'translateY(100%)';
        // Use a local variable to capture onClose for the timeout
        const closePopup = onClose;
        setTimeout(() => closePopup(), 300); // Close after animation
      } else {
        content.style.transform = 'translateY(0)';
      }

      touchStartY.current = null;
      touchMoveY.current = null;
    };

    content.addEventListener('touchstart', handleTouchStart);
    content.addEventListener('touchmove', handleTouchMove, { passive: false });
    content.addEventListener('touchend', handleTouchEnd);

    return () => {
      content.removeEventListener('touchstart', handleTouchStart);
      content.removeEventListener('touchmove', handleTouchMove);
      content.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onClose]);

  const { followeringAccount, handleFollow, handleUnfollow } = useLensFollowActions();

  const handleProfileRedirect = (clickedUser: AccountFragment) => {
    if (currentLensAccount?.address === clickedUser.address) {
      router.push(`/profile`);
    } else {
      router.push(`/profile/${clickedUser?.username?.localName}`);
    }
    onClose();
  };

  // Show empty or partial results while loading
  /*
    const showPartialResults = useMemo(
      () => !isLoading || (followerUsers.length > 0 && isLoading),
      [isLoading, followerUsers.length]
    );
  */

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <ThematicContainer
        asButton={false}
        glassmorphic={true}
        color="nocenaBlue"
        rounded="xl"
        className="!p-0 max-w-lg w-full mx-4 max-h-[70vh] overflow-hidden"
      >
        {/* Header */}
        <div className="relative p-6 pb-3">
          <h2 className="text-2xl font-bold text-center">
            {isFollowers ? 'Followers' : 'Following'}
          </h2>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="px-6 overflow-y-auto"
          style={{
            height: 'calc(90vh - 8rem)', // Adjusted for header/footer
            maxHeight: 'calc(90vh - 8rem)',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : /*showPartialResults &&*/ (!followers || followers?.length === 0) ? (
            <div className="text-center py-8 text-gray-400">
              {isFollowers ? 'No followers yet' : 'Not following anyone yet'}
            </div>
          ) : (
            <div className="space-y-3">
              {followers.map(({ follower }) => {
                // Use our getIsFollowing helper to check follow status
                const isFollowing = follower.operations?.isFollowedByMe || false;
                const isCurrentUser = follower.address === currentLensAccount?.address;
                const isPending = pendingFollowActions.has(follower.address);

                return (
                  <div
                    key={follower.address}
                    className="py-3 cursor-pointer"
                    onClick={() => handleProfileRedirect(follower)}
                  >
                    <div className="flex items-center">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <ThematicImage className="rounded-full flex-shrink-0">
                          <Image
                            src={getAvatar(follower) || '/images/profile.png'}
                            alt="Profile"
                            width={48}
                            height={48}
                            className="w-12 h-12 object-cover rounded-full"
                          />
                        </ThematicImage>

                        <div className="flex-1 min-w-0 mr-2">
                          <div className="text-lg font-bold truncate">{getAccount(follower).name}</div>
                          <div className="flex items-center mt-0.5">
                            <Image src={nocenixIcon} alt="Nocenix" width={16} height={16} />
                            <span className="text-sm ml-1 text-gray-400">
                              0 NOCENIX
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Follow Button - using PrimaryButton */}
                      <div className="flex-shrink-0">
                        <PrimaryButton
                          text={
                            isCurrentUser
                              ? 'Your Profile'
                              : isPending
                                ? isFollowing
                                  ? 'Following...'
                                  : 'Following...'
                                : isFollowing
                                  ? 'Following'
                                  : 'Follow'
                          }
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent profile navigation when clicking the button
                            if (!isCurrentUser)
                              isFollowing
                                ? handleUnfollow(follower)
                                : handleFollow(follower);
                          }}
                          className="px-4 py-1 text-sm min-w-[5rem] h-8"
                          isActive={isFollowing}
                          loading={follower.address === followeringAccount?.address}
                          disabled={isCurrentUser || isPending}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Show loading indicator at bottom when loading more */}
              {isLoading && hasMore && (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 py-4">
          Pull down to close
          <div className="mt-2 opacity-50">↓</div>
        </div>
      </ThematicContainer>
    </div>
  );
};

export default FollowersPopup;
