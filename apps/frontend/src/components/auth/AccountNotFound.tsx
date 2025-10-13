import ThematicContainer from '@components/ui/ThematicContainer';
import Link from 'next/link';
import React from 'react';

const AccountNotFound = () => {
  return (
    <ThematicContainer
      color="nocenaPink"
      glassmorphic={true}
      asButton={false}
      rounded="2xl"
      className="p-6 text-center"
    >
      <h3 className="text-lg font-bold text-white mb-2">Account Not Found</h3>
      <p className="text-sm text-gray-300 mb-4">
        Your wallet is connected, but you need an invite code to create your profile.
      </p>
      <Link href="/register">
        <button className="text-nocenaPink hover:text-nocenaPink/80 font-medium">Go create profile →</button>
      </Link>
    </ThematicContainer>
  )
}

export default AccountNotFound