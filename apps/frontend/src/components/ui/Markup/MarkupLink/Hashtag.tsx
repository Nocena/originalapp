import stopEventPropagation from '../../../../helpers/stopEventPropagation';
import type { MarkupLinkProps } from '@components/ui/Markup/MarkupLink/ExternalLink';
import Link from 'next/link';

const Hashtag = ({ title }: MarkupLinkProps) => {
  if (!title) {
    return null;
  }

  return (
    <span className="inline-flex items-center space-x-1">
      <span>
        <Link
          className="outline-hidden focus:underline"
          href={`/search?q=${title}&src=link_click&type=posts`}
          onClick={stopEventPropagation}
        >
          {title}
        </Link>
      </span>
    </span>
  );
};

export default Hashtag;
