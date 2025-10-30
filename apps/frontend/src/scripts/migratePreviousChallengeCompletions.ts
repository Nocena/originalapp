import 'dotenv/config';
import { createChallengeCompletion } from '../lib/graphql';
import { uploadBlob } from '../helpers/accountPictureUtils';
import { getVideoSnapshot } from '../helpers/getVideoSnapshot';

/**
 * Fetch a file from a URL and return it as a Blob
 * @param url - The file URL (video, image, etc.)
 * @returns Promise<Blob>
 */
export async function fetchBlobFromUrl(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from URL: ${url}, status: ${response.status}`);
  }
  return await response.blob();
}

// Main execution
async function main() {
  try {
    const userId = "0x10110A0Cf8f97D3802953078A2C2629f1146ACBb"
    const timestamp = Date.now();
    const challengeId = '90069b07-4b66-4389-8970-b2b8f948399d'
    const videoUrl = 'https://jade-elaborate-emu-349.mypinata.cloud/ipfs/bafybeiegvuimdl572qngsjn5anfi5xl43635pomaw2wyoserz5uuvouaq4?pinataGatewayToken=XQTlgcFp9rPCXpkx3GkP5M28RfBWRUUwaUwF2H_SCyA3TiFZvm-ssBVMLgIRVz9G';
    const photoUrl = 'https://jade-elaborate-emu-349.mypinata.cloud/ipfs/bafkreifylm3rcptrptptyo475fbfrkumrlclvcl5heyrhvbbwxnhbc55oa?pinataGatewayToken=XQTlgcFp9rPCXpkx3GkP5M28RfBWRUUwaUwF2H_SCyA3TiFZvm-ssBVMLgIRVz9G';

    const video = await fetchBlobFromUrl(videoUrl);
    const photo = await fetchBlobFromUrl(photoUrl);
    const videoCID = await uploadBlob(video, 'video');
    const selfieCID = await uploadBlob(photo, 'photo');
    const snapshotBlob = await getVideoSnapshot(video, 0); // first frame
    const previewCID = await uploadBlob(snapshotBlob, 'photo');

    console.log("creating......")
    await createChallengeCompletion(
      userId,
      'ai',
      JSON.stringify({
        videoCID,
        selfieCID,
        previewCID,
        timestamp,
        description: "Tell us about completing this challenge...",
        verificationResult: {
          backgroundOptimized: true,
          timestamp: new Date().toISOString(),
        },
        hasVideo: true,
        hasSelfie: true,
        hasPreview: true,
        videoFileName: `challenge_video_${userId}_${timestamp}.webm`,
        selfieFileName: `challenge_selfie_${userId}_${timestamp}.jpg`,
      }),
      challengeId,
    );
    console.log("finished......")
  } catch (error) {
    console.error('❌ Error in daily challenge process:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}
