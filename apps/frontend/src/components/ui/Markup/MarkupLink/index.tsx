import type {
  PostMentionFragment
} from "@nocena/indexer";
import ExternalLink from "./ExternalLink";
import Hashtag from "./Hashtag";
import Mention from "./Mention";

export interface MarkupLinkProps {
  mentions?: PostMentionFragment[];
  title?: string;
}

const MarkupLink = ({ mentions, title }: MarkupLinkProps) => {
  if (!title) {
    return null;
  }

  if (title.startsWith("@")) {
    return <Mention mentions={mentions} title={title} />;
  }

  if (title.startsWith("#")) {
    return <Hashtag title={title} />;
  }

  return <ExternalLink title={title} />;
};

export default MarkupLink;
