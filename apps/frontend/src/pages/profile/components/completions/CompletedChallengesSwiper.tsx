// CompletedChallengesSwiper.tsx
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { ChallengeCompletion } from '../../../../lib/graphql/features/challenge-completion/types';
import { ChallengeCompletionSlide } from '@pages/profile/components/completions/ChallengeCompletionSlide';
import { NavigationButtons } from '@pages/profile/components/completions/NavigationButtons';

interface CompletedChallengesSwiperProps {
  completions: ChallengeCompletion[];
  onCompletionClick: (completion: ChallengeCompletion) => void;
}

export const CompletedChallengesSwiper: React.FC<CompletedChallengesSwiperProps> = ({
  completions,
  onCompletionClick,
}) => {
  return (
    <div className="relative">
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={16}
        slidesPerView={4}
        navigation={{
          prevEl: '.swiper-button-prev-custom',
          nextEl: '.swiper-button-next-custom',
        }}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet-custom',
          bulletActiveClass: 'swiper-pagination-bullet-active-custom',
        }}
        breakpoints={{
          320: { slidesPerView: 1, spaceBetween: 12 },
          640: { slidesPerView: 2, spaceBetween: 16 },
          1024: { slidesPerView: 4, spaceBetween: 16 },
        }}
        className="completed-challenges-swiper"
      >
        {completions.map((completion) => (
          <SwiperSlide key={completion.id}>
            <ChallengeCompletionSlide
              completion={completion}
              onClick={() => onCompletionClick(completion)}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <NavigationButtons />
    </div>
  );
};
