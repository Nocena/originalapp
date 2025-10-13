import React from 'react';
import Button from '@components/ui/Button';

interface Props {
  disabled?: boolean;
  className?: string;
  isActive?: boolean;
  loading?: boolean;
  text: string;
  type?: HTMLButtonElement['type'];
  onClick?: (e: React.FormEvent<HTMLButtonElement>) => void;
}

const PrimaryButton: React.FC<Props> = ({
  text,
  onClick,
  className = '',
  isActive = false,
  loading = false,
  disabled = false,
  type = 'button',
}) => {
  return (
    <div
      className={`w-full h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
        disabled
          ? 'bg-gray-500 cursor-not-allowed'
          : isActive
            ? 'bg-white text-black'
            : 'bg-gradient-to-r from-nocenaBlue to-nocenaPink text-white'
      } ${className}`}
    >
      <Button
        type={type}
        disabled={disabled}
        loading={loading}
        onClick={disabled ? undefined : onClick}
        className="w-full h-full bg-transparent text-base font-medium font-montserrat cursor-pointer flex items-center justify-center focus:outline-none"
      >
        {text}
      </Button>
    </div>
  );
};

export default PrimaryButton;
