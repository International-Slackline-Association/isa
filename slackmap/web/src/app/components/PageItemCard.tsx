import { useEffect } from 'react';
import { useLocation } from 'react-router';

import { FeatureCard, FeatureStats, FeatureTag } from 'app/components/FeatureCard';
import { FeatureDetailInfoField } from 'app/components/FeatureDetailFields/InfoField';
import { LoadingIndicator } from 'app/components/LoadingIndicator';
import { appColors } from 'styles/theme/colors';

// Written into the page by the API's page route.
type PageItem = {
  type: 'line' | 'spot' | 'guide';
  id: string;
  name?: string;
  kind: string;
  length?: number;
  height?: number;
  description?: string;
  image?: string;
};

const readPageItem = (): PageItem | undefined => {
  try {
    const text = document.getElementById('page-item')?.textContent;
    return text ? (JSON.parse(text) as PageItem) : undefined;
  } catch {
    return undefined;
  }
};
const pageItem = readPageItem();

export const pageItemOf = (type: PageItem['type'], id: string) =>
  pageItem?.type === type && pageItem.id === id ? pageItem : undefined;

// The page's title and canonical link name the page it was loaded as; once the app moves on they would be wrong.
const loadedPath = window.location.pathname;
export const PageHeadReset = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname === loadedPath) return;
    document.title = 'SlackMap';
    document.querySelector('link[rel="canonical"]')?.remove();
  }, [pathname]);
  return null;
};

const tags: Record<PageItem['type'], (item: PageItem) => string> = {
  line: (item) => item.kind,
  spot: () => 'Spot',
  guide: () => 'Access guide',
};

const dots: Record<PageItem['type'], string> = {
  line: appColors.lineStrokeColor,
  spot: appColors.spotFillColor,
  guide: appColors.guideFeaturesColor,
};

export const PageItemCard = ({ item }: { item: PageItem }) => (
  <FeatureCard
    loading={false}
    image={item.image || '/images/coverImageFallback.svg'}
    title={item.name || item.kind}
    tags={<FeatureTag label={tags[item.type](item)} dot={dots[item.type]} />}
  >
    {item.type === 'line' && (
      <FeatureStats
        items={[
          { value: `${item.length || '?'} m`, label: 'length' },
          { value: `${item.height || '?'} m`, label: 'height' },
        ]}
      />
    )}
    <FeatureDetailInfoField header="Description" content={item.description} skipIfEmpty infoType="description" />
    <LoadingIndicator />
  </FeatureCard>
);
