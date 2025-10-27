import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { sanitizeInput } from '@utils/security';
import { useAuth } from '../../../contexts/AuthContext';

import ThematicImage from '../../../components/ui/ThematicImage';
import Image from 'next/image';
import { AccountFragment, AccountsOrderBy, AccountsRequest, PageSize, useAccountsQuery } from '@nocena/indexer';
import getAvatar from 'src/helpers/getAvatar';

// Local interface for search results that's compatible with both old and new user structures
export interface SearchUser {
  id: string;
  username: string;
  profilePicture: string;
  wallet: string;
  earnedTokens: number; // Change from optional to required
  bio?: string;
  followers?: any[]; // Keep flexible to support both string[] and User[]
  following?: any[];
}

interface SearchBoxProps {
  onUserSelect?: (account: AccountFragment) => void; // Make sure the parameter name is 'user'
  onSearch?: (term: string) => void;
  users?: SearchUser[];
  maxHeight?: string; // Add custom max height for dropdown
}

const SearchBox: React.FC<SearchBoxProps> = ({
  onUserSelect,
  onSearch,
  users,
  maxHeight = 'max-h-80',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { currentLensAccount } = useAuth();

  const request: AccountsRequest = {
    pageSize: PageSize.Fifty,
    orderBy: AccountsOrderBy.BestMatch,
    filter: { searchBy: { localNameQuery: searchQuery } },
  };

  const { data, error, fetchMore, loading } = useAccountsQuery({
    skip: !searchQuery || searchQuery.length < 2,
    variables: { request },
  });

  const accounts = data?.accounts?.items;

  // Update loading state and dropdown visibility
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setIsDropdownOpen(true);
      setIsLoading(loading);
    } else {
      setIsDropdownOpen(false);
      setIsLoading(false);
    }
  }, [searchQuery, loading]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileRedirect = (account: AccountFragment) => {
    if (!account) return;

    // Call onUserSelect callback if provided
    if (onUserSelect) {
      onUserSelect(account);
    } else {
      // Default behavior - navigate to profile
      if (currentLensAccount?.address === account.address) {
        router.push('/profile');
      } else {
        router.push(`/profile/${account.username?.localName}`);
      }
    }

    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          placeholder="Search by username"
          className="w-full p-3 bg-gray-800 text-white rounded-lg focus:outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
          onFocus={() => searchQuery.length >= 2 && setIsDropdownOpen(true)}
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {isDropdownOpen && searchQuery.length >= 2 && (
        <div
          className={`absolute top-full mt-2 w-full bg-gray-900 rounded-lg shadow-lg overflow-hidden z-50 ${maxHeight} overflow-y-auto`}
        >
          {loading ? (
            <div className="p-3 text-gray-400 text-center">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Searching...
            </div>
          ) : accounts && accounts.length > 0 ? (
            <ul>
              {accounts.map((account) => {
                const isCurrentUser = currentLensAccount?.address === account.address;
                return (
                  <li
                    key={account.address}
                    onClick={() => !isCurrentUser && handleProfileRedirect(account)}
                    className={`flex items-center gap-4 p-3 transition-colors ${
                      isCurrentUser
                        ? 'opacity-50 cursor-not-allowed bg-gray-800'
                        : 'hover:bg-gray-700 cursor-pointer'
                    }`}
                  >
                    <ThematicImage className="rounded-full flex-shrink-0">
                      <Image
                        src={getAvatar(account) || '/images/profile.png'}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="w-10 h-10 object-cover rounded-full"
                      />
                    </ThematicImage>

                    <span
                      className={`font-medium truncate ${
                        isCurrentUser ? 'text-gray-500' : 'text-white'
                      }`}
                    >
                      {account.username?.localName}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-3 text-gray-400 text-center">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBox;
