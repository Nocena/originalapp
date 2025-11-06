import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface PermissionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export const PermissionGuideModal: React.FC<PermissionGuideModalProps> = ({
  isOpen,
  onClose,
  onRetry,
}) => {
  if (!isOpen) return null;

  // Detect user's device and browser
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4"
      style={{ zIndex: 10001 }}
    >
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-600 bg-opacity-20">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Enable Permissions</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {isMobile ? (
            <>
              {/* Simple Steps */}
              <div className="text-center">
                <p className="text-gray-300 text-lg mb-6">Follow these 4 simple steps:</p>
              </div>

              {/* Visual Guide */}
              <div>
                <div className="space-y-4">
                  {/* Step 1 */}
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-nocenaBlue text-white rounded-full flex items-center justify-center text-lg font-bold">
                        1
                      </div>
                      <span className="text-white font-semibold text-lg">
                        Tap on the icon next to the URL on your browser
                      </span>
                    </div>
                    <img
                      src="/images/permission/mobile-chrome-permission-step1.png"
                      alt="Tap on the icon next to the URL on your browser"
                      className="w-full max-w-sm mx-auto rounded border border-gray-600"
                    />
                  </div>

                  {/* Step 2 */}
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-nocenaPink text-white rounded-full flex items-center justify-center text-lg font-bold">
                        2
                      </div>
                      <span className="text-white font-semibold text-lg">Select Permissions</span>
                    </div>
                    <img
                      src="/images/permission/mobile-chrome-permission-step2.png"
                      alt="Select Permissions"
                      className="w-full max-w-md mx-auto rounded border border-gray-600"
                    />
                  </div>

                  {/* Step 3 */}
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-nocenaPurple text-white rounded-full flex items-center justify-center text-lg font-bold">
                        3
                      </div>
                      <span className="text-white font-semibold text-lg">
                        Ensure your Camera is toggled on to unblock access
                      </span>
                    </div>
                    <img
                      src="/images/permission/mobile-chrome-permission-step3.png"
                      alt="Ensure your Camera is toggled on to unblock access"
                      className="w-full max-w-md mx-auto rounded border border-gray-600"
                    />
                  </div>

                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-nocenaPurple text-white rounded-full flex items-center justify-center text-lg font-bold">
                        4
                      </div>
                      <span className="text-white font-semibold text-lg">
                        Return to your browser by clicking on refresh and be sure to select Allow
                        when prompted to enable camera
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Simple Steps */}
              <div className="text-center">
                <p className="text-gray-300 text-lg mb-6">Follow these 3 simple steps:</p>
              </div>

              {/* Visual Guide */}
              <div>
                <div className="space-y-4">
                  {/* Step 1 */}
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-nocenaBlue text-white rounded-full flex items-center justify-center text-lg font-bold">
                        1
                      </div>
                      <span className="text-white font-semibold text-lg">
                        Click the camera icon
                      </span>
                    </div>
                    <img
                      src="https://static0.howtogeekimages.com/wordpress/wp-content/uploads/2019/04/2019-04-12_17h51_02.png?q=50&fit=crop&w=227&dpr=1.5"
                      alt="Click camera icon in address bar"
                      className="w-full max-w-sm mx-auto rounded border border-gray-600"
                    />
                  </div>

                  {/* Step 2 */}
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-nocenaPink text-white rounded-full flex items-center justify-center text-lg font-bold">
                        2
                      </div>
                      <span className="text-white font-semibold text-lg">
                        Allow Camera & Microphone
                      </span>
                    </div>
                    <img
                      src="https://static0.howtogeekimages.com/wordpress/wp-content/uploads/2019/04/2019-04-12_16h56_26.png?q=50&fit=crop&w=398&dpr=1.5"
                      alt="Allow camera and microphone permissions"
                      className="w-full max-w-md mx-auto rounded border border-gray-600"
                    />
                  </div>

                  {/* Step 3 */}
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-nocenaPurple text-white rounded-full flex items-center justify-center text-lg font-bold">
                        3
                      </div>
                      <span className="text-white font-semibold text-lg">Click Reload</span>
                    </div>
                    <img
                      src="https://static0.howtogeekimages.com/wordpress/wp-content/uploads/2019/04/2019-04-12_17h34_24.png?q=50&fit=crop&w=602&dpr=1.5"
                      alt="Click reload to apply changes"
                      className="w-full max-w-md mx-auto rounded border border-gray-600"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between space-x-4 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200"
          >
            Close
          </button>
          {/*
          <button
            onClick={() => {
              onClose();
              onRetry();
            }}
            className="flex-1 bg-nocena-purple hover:bg-nocena-purple-fade text-white px-4 py-2 rounded-lg transition-all duration-200 font-semibold"
          >
            Try Again
          </button>
*/}
        </div>
      </div>
    </div>
  );
};
