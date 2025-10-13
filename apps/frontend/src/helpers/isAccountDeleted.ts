import { NULL_ADDRESS } from "@nocena/data/constants";
import type { AccountFragment } from "@nocena/indexer";

const isAccountDeleted = (account: AccountFragment): boolean => {
  if (account.owner === NULL_ADDRESS) {
    return true;
  }

  return false;
};

export default isAccountDeleted;
