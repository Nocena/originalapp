import { CHAIN } from '@nocena/data/constants';
import { Errors } from '@nocena/data/errors';
import { immutable } from '@lens-chain/storage-client';
import { storageClient } from './storageClient';

const uploadMetadata = async (data: any): Promise<string> => {
  try {
    console.log('uploadMetadata', data);
    const { uri } = await storageClient.uploadAsJson(data, {
      acl: immutable(CHAIN.id),
    });

    return uri;
  } catch {
    throw new Error(Errors.SomethingWentWrong);
  }
};

export default uploadMetadata;
