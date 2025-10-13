import type {
  PostMentionFragment
} from "@nocena/indexer";
import injectReferrerToUrl from '../../../../helpers/injectReferrerToUrl';
import stopEventPropagation from '../../../../helpers/stopEventPropagation';
import truncateUrl from '../../../../helpers/truncateUrl';
import Link from "next/link";

export interface MarkupLinkProps {
  mentions?: PostMentionFragment[];
  title?: string;
}

const ExternalLink = ({ title }: MarkupLinkProps) => {
  let href = title;

  if (!href) {
    return null;
  }

  if (!href.includes("://")) {
    href = `https://${href}`;
  }

  const url = injectReferrerToUrl(href);

  return (
    <Link
      href={url}
      onClick={stopEventPropagation}
      rel="noopener"
      target={url.includes(location.host) ? "_self" : "_blank"}
    >
      {title ? truncateUrl(title, 30) : title}
    </Link>
  );
};

export default ExternalLink;
