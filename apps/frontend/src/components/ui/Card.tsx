import cn from '../../helpers/cn';
import { type ElementType, type MouseEvent, type ReactNode, memo } from 'react';
import ThematicContainer from '@components/ui/ThematicContainer';

interface CardProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  forceRounded?: boolean;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

const Card = ({
  as: Tag = 'div',
  children,
  className = '',
  forceRounded = false,
  onClick,
}: CardProps) => {
  return (
    <ThematicContainer
      color="nocenaPink"
      glassmorphic={true}
      asButton={false}
      rounded="2xl"
      className="p-6 text-center"
    >
      {children}
    </ThematicContainer>
  );
};

export default memo(Card);
