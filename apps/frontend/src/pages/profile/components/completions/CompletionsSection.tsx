import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { NavigationButtons } from '@pages/profile/components/completions/NavigationButtons';
import { ChallengeCompletionSlide } from '@pages/profile/components/completions/ChallengeCompletionSlide';
import { useUserChallengeCompletions } from '../../../../lib/graphql/features/challenge-completion/hook';
import { ChallengeCompletion } from '../../../../lib/graphql/features/challenge-completion/types';
import { SkeletonSlide } from './SkeletonSlide';
import { Trophy } from 'lucide-react';
import { useRouter } from 'next/router';

interface CompletionsSectionProps {
  userID: string;
}

const CompletionsSection: React.FC<CompletionsSectionProps> = ({
                                                                 userID = 'current-user',
                                                               }) => {
  const router = useRouter();
  const { completions, loading } = useUserChallengeCompletions(userID);

  const handleChallengeClick = (completion: ChallengeCompletion) => {
    router.push({
      pathname: '/browsing', query: {
        completionId: completion.id,
        userId: userID,
      },
    });
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      {/* Swiper Slider */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-nocenaPink bg-opacity-20">
            <Trophy className="w-6 h-6 text-nocenaPink" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">My Completed Challenges</h2>
            <p className="text-gray-400 text-sm">Challenges you've successfully completed</p>
          </div>
        </div>
      </div>
      {
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonSlide key={index} />
            ))}
          </div>
        ) : (
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
                320: {
                  slidesPerView: 1,
                  spaceBetween: 12,
                },
                640: {
                  slidesPerView: 2,
                  spaceBetween: 16,
                },
                1024: {
                  slidesPerView: 4,
                  spaceBetween: 16,
                },
              }}
              className="completed-challenges-swiper"
            >
              {completions.map((completion) => (
                <SwiperSlide key={completion.id}>
                  <ChallengeCompletionSlide
                    completion={completion}
                    onClick={() => handleChallengeClick(completion)}
                  />
                </SwiperSlide>
              ))}
            </Swiper>

            <NavigationButtons />
          </div>
        )
      }
    </div>
  );
};

export default CompletionsSection;
