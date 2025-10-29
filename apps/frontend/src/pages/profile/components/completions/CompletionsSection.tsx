import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { NavigationButtons } from '@pages/profile/components/completions/NavigationButtons';
import { ChallengeSlide } from '@pages/profile/components/completions/ChallengeSlide';

interface CompletionsSectionProps {
  userID: string;
}

const CompletionsSection: React.FC<CompletionsSectionProps> = ({
  userID = 'current-user',
}) => {
  const handleChallengeClick = (challenge: CompletedChallenge) => {
    console.log('Navigate to challenge detail:', challenge.title);
    // TODO: Add navigation to challenge detail page
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      {/* Swiper Slider */}
      <div className="relative">
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={16}
          slidesPerView={3}
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
            320: {
              slidesPerView: 1,
              spaceBetween: 12,
            },
            640: {
              slidesPerView: 2,
              spaceBetween: 16,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 16,
            },
          }}
          className="completed-challenges-swiper"
        >
          {challenges.map((challenge) => (
            <SwiperSlide key={challenge.id}>
              <ChallengeSlide
                challenge={challenge}
                onClick={() => handleChallengeClick(challenge)}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        <NavigationButtons />
      </div>
    </div>
  );
};

export default CompletionsSection;
