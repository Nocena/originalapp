import Link from 'next/link';
import React from 'react';

export interface RegistrationLinkSectionProps {
  error: string;
}
const RegistrationLinkSection = ({ error }: RegistrationLinkSectionProps) => {
  return (
    <div className="text-center">
      <p className="text-sm text-gray-400">
        {error === 'account_not_found' ? (
          <>
            Need to register first?{' '}
            <Link href="/register" className="text-nocenaPink hover:text-nocenaPink/80 font-medium">
              Input invite code
            </Link>
          </>
        ) : (
          <>
            New challenger?{' '}
            <Link href="/register" className="text-nocenaPink hover:text-nocenaPink/80 font-medium">
              Create your profile
            </Link>
          </>
        )}
      </p>
    </div>
  );
};

export default RegistrationLinkSection;
