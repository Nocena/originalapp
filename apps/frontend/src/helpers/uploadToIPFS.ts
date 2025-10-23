import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { CHAIN, EVER_API, EVER_BUCKET } from '@nocena/data/constants';
import generateUUID from './generateUUID';
import { immutable } from '@lens-chain/storage-client';
import { storageClient } from './storageClient';

const FALLBACK_TYPE = "image/jpeg";
const FILE_SIZE_LIMIT_MB = 8 * 1024 * 1024; // 8MB in bytes

const getS3Client = async (): Promise<S3> => {
  return new S3({
    credentials: {
      accessKeyId: process.env.EVERLAND_API_KEY ?? "",
      secretAccessKey: process.env.EVERLAND_API_SECRET ?? "",
      // sessionToken: data.sessionToken ?? ""
    },
    endpoint: EVER_API,
    maxAttempts: 10,
    // region: EVER_REGION
  });
};

const uploadToIPFS = async (
  data: FileList | File[]
): Promise<{ mimeType: string; uri: string }[]> => {
  try {
    const files = Array.from(data) as File[];
    const s3Files = files.filter(
      (file: File) => file.size > FILE_SIZE_LIMIT_MB
    );
    const client = s3Files.length > 0 ? await getS3Client() : null;

    return await Promise.all(
      files.map(async (file: File) => {
        // If the file is less than FILE_SIZE_LIMIT_MB, upload it to the Grove
        if (file.size <= FILE_SIZE_LIMIT_MB) {
          const storageNodeResponse = await storageClient.uploadFile(file, {
            acl: immutable(CHAIN.id)
          });

          return {
            mimeType: file.type || FALLBACK_TYPE,
            uri: storageNodeResponse.uri
          };
        }

        // For files larger than FILE_SIZE_LIMIT_MB, use the S3 client
        if (client) {
          const currentDate = new Date()
            .toLocaleDateString("en-GB")
            .replace(/\//g, "-");

          const params = {
            Body: file,
            Bucket: EVER_BUCKET,
            ContentType: file.type,
            Key: `${currentDate}/${generateUUID()}`
          };
          const task = new Upload({ client, params });
          await task.done();
          const result = await client.headObject(params);
          const metadata = result.Metadata;
          const cid = metadata?.["ipfs-hash"];

          return { mimeType: file.type || FALLBACK_TYPE, uri: `ipfs://${cid}` };
        }

        return { mimeType: file.type || FALLBACK_TYPE, uri: "" };
      })
    );
  } catch {
    return [];
  }
};

export const uploadFileToIPFS = async (
  file: File
): Promise<{ mimeType: string; uri: string }> => {
  try {
    const ipfsResponse = await uploadToIPFS([file]);
    const metadata = ipfsResponse[0];

    return { mimeType: file.type || FALLBACK_TYPE, uri: metadata.uri };
  } catch {
    return { mimeType: file.type || FALLBACK_TYPE, uri: "" };
  }
};

export default uploadToIPFS;
