import React from 'react';
import { MessageCircle, HelpCircle, Users, ExternalLink, Clock } from 'lucide-react';

interface SupportMenuProps {
  onBack: () => void;
}

const SupportMenu: React.FC<SupportMenuProps> = ({ onBack }) => {
  return (
    <div className="p-6">
      <div
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBack();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBack();
        }}
        className="flex items-center text-white/70 hover:text-white mb-6 transition-colors cursor-pointer select-none"
        role="button"
        tabIndex={0}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="mr-2"
        >
          <polyline points="15,18 9,12 15,6" />
        </svg>
        Back to Menu
      </div>

      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-nocenaBlue rounded-xl flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-white text-2xl font-bold">Support</h2>
          <p className="text-white/60 text-sm">Help & contact</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Tutorials Section */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center text-lg">
            <HelpCircle className="w-5 h-5 mr-3 text-nocenaPurple" />
            Tutorials
          </h3>
          <div className="bg-nocenaPurple/20 rounded-lg p-4 border border-nocenaPurple/30">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-nocenaPurple/30 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-nocenaPurple" />
              </div>
              <div>
                <div className="text-white font-medium">Coming Soon!</div>
                <div className="text-white/60 text-sm">Step-by-step guides and video tutorials</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Support Section */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center text-lg">
            <MessageCircle className="w-5 h-5 mr-3 text-nocenaBlue" />
            Chat Support
          </h3>
          <p className="text-white/70 text-sm leading-relaxed mb-4">
            For the time being reach out in the private beta group on{' '}
            <span className="text-nocenaBlue font-semibold">Telegram</span> under the{' '}
            <span className="text-nocenaBlue font-semibold">Support</span> topic.
          </p>

          <div
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open('https://t.me/c/2712317423/134', '_blank');
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open('https://t.me/c/2712317423/134', '_blank');
            }}
            className="bg-nocenaBlue/20 border border-nocenaBlue/30 rounded-lg p-4 mb-4 cursor-pointer hover:bg-nocenaBlue/30 transition-colors select-none"
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-nocenaBlue/30 rounded-lg flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L7.942 13.98l-2.955-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.954z" />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-medium">Telegram Support Topic</div>
                  <div className="text-white/60 text-sm">Join the private beta group</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-white/50" />
            </div>
          </div>
        </div>

        {/* Alternative Contact Methods */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center text-lg">
            <Users className="w-5 h-5 mr-3 text-nocenaPink" />
            Alternative Contact
          </h3>
          <p className="text-white/70 text-sm leading-relaxed mb-4">
            If you're having trouble accessing the group, feel free to reach out via alternative
            channels.
          </p>

          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 bg-nocenaPink/20 rounded-lg flex items-center justify-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-nocenaPink"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-medium text-sm">X (formerly Twitter)</div>
                <div className="text-white/50 text-xs">@nocena_app</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 bg-nocenaBlue/20 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L7.942 13.98l-2.955-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.954z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-medium text-sm">Direct Telegram</div>
                <div className="text-white/50 text-xs">@alternative_gg</div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Tips */}
        <div className="bg-gradient-to-r from-nocenaPink/10 to-nocenaBlue/10 rounded-2xl p-6 border border-nocenaPink/20">
          <h3 className="text-white font-semibold mb-4 text-lg">Getting Better Help</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-nocenaPink rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-white/70 text-sm">
                <strong className="text-white">Be specific:</strong> Include details about what you
                were doing when the issue occurred
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-nocenaBlue rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-white/70 text-sm">
                <strong className="text-white">Screenshots help:</strong> Visual examples make it
                easier to understand your issue
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-nocenaPurple rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-white/70 text-sm">
                <strong className="text-white">Device info:</strong> Mention your device type and
                browser if relevant
              </p>
            </div>
          </div>
        </div>

        {/* Quick fixes */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4 text-lg">Common Quick Fixes</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-nocenaPink rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-white/70 text-sm">
                Try refreshing the page if something isn't loading
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-nocenaBlue rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-white/70 text-sm">
                Check your internet connection for upload issues
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-nocenaPurple rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-white/70 text-sm">
                Clear browser cache if app is acting strangely
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportMenu;
