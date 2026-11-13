import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { APIGatewayProxyResult } from 'aws-lambda';

import { s3 } from '../../../../core/aws/clients';
import { db } from '../../../../core/db';
import { guideTypeLabel } from '../../../../core/features/guide';
import { SlacklineType } from '../../../../core/types';
import countriesJson from '../../../../../data/countryInfoDict.json';

import { Request, Route } from '../../../http';

type Preview = { title: string; description: string; image?: string };
type Image = { s3Key: string; isCover?: boolean };

const startMarker = '<!-- preview:start -->';
const endMarker = '<!-- preview:end -->';

const lineTypes: Record<SlacklineType, string> = {
  highline: 'Highline',
  waterline: 'Waterline',
  midline: 'Midline',
  longline: 'Longline',
  trickline: 'Trickline',
  rodeoline: 'Rodeoline',
  parkline: 'Parkline',
  other: 'Slackline',
};

const countryName = (code?: string) =>
  code ? countriesJson[code.toUpperCase() as keyof typeof countriesJson]?.name : undefined;

const coverImage = (...lists: (Image[] | undefined)[]) => {
  const images = lists.flatMap((list) => list ?? []);
  const image = images.find((i) => i.isCover) ?? images[0];
  return image ? `https://images.slackmap.com/${image.s3Key}` : undefined;
};

const joined = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(' · ');

const withText = (summary: string, text?: string) => {
  const flat = text?.replace(/\s+/g, ' ').trim();
  if (!flat) return summary;
  const chars = Array.from(flat);
  const short = chars.length > 200 ? `${chars.slice(0, 199).join('')}…` : flat;
  return `${summary}. ${short}`;
};

const linePreview = async (id: string): Promise<Preview | undefined> => {
  const line = await db.getLineDetails(id);
  if (!line) return undefined;
  const type = lineTypes[line.type] ?? 'Slackline';
  return {
    title: line.name || type,
    description: withText(
      joined(type, line.length ? `${line.length} m` : undefined, countryName(line.country)),
      line.description,
    ),
    image: coverImage(line.images, line.anchorImages),
  };
};

const spotPreview = async (id: string): Promise<Preview | undefined> => {
  const spot = await db.getSpotDetails(id);
  if (!spot) return undefined;
  return {
    title: spot.name || 'Slackline spot',
    description: withText(joined('Slackline spot', countryName(spot.country)), spot.description),
    image: coverImage(spot.images),
  };
};

const guidePreview = async (id: string): Promise<Preview | undefined> => {
  const guide = await db.getGuideDetails(id);
  if (!guide) return undefined;
  return {
    title: guideTypeLabel(guide.type),
    description: withText(joined('Slackline guide', countryName(guide.country)), guide.description),
    image: coverImage(guide.images),
  };
};

const groupPreview = async (id: string): Promise<Preview | undefined> => {
  const group = await db.getGroupDetails(id);
  if (!group) return undefined;
  return {
    title: group.name,
    description: joined('Slackline community', countryName(group.country)),
  };
};

const countryPreview = async (code: string): Promise<Preview | undefined> => {
  const name = countryName(code);
  if (!name) return undefined;
  return { title: `Slacklines in ${name}`, description: `Slacklines, spots and guides in ${name}` };
};

const communitiesPreview = async (code: string): Promise<Preview | undefined> => {
  const name = countryName(code);
  if (!name) return undefined;
  return { title: `Slackline communities in ${name}`, description: `Slackline groups in ${name}` };
};

const escape = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const previewTags = (preview: Preview, url: string) => {
  const title = escape(`${preview.title} · SlackMap`);
  const description = escape(preview.description);
  const image = escape(preview.image ?? 'https://slackmap.com/images/ogimage.png');
  return [
    `<meta name="description" content="${description}" />`,
    `<meta property="og:site_name" content="SlackMap" />`,
    `<meta property="og:url" content="${escape(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join('\n    ');
};

const readIndexHtml = async () => {
  const object = await s3.send(
    new GetObjectCommand({ Bucket: process.env.SLACKMAP_WEB_S3_BUCKET, Key: 'index.html' }),
  );
  return object.Body!.transformToString('utf-8');
};

const page =
  (findPreview: (id: string) => Promise<Preview | undefined>): Route =>
  async (req: Request<{ id: string }>): Promise<APIGatewayProxyResult> => {
    const [html, preview] = await Promise.all([readIndexHtml(), findPreview(req.params.id)]);
    const start = html.indexOf(startMarker);
    const end = html.indexOf(endMarker);
    if (start === -1 || end === -1) throw new Error('index.html has no preview markers');

    // An unknown id keeps the default tags; the app shows that it does not exist.
    const body = preview
      ? `${html.slice(0, start + startMarker.length)}\n    ${previewTags(preview, `https://slackmap.com${req.path.replace(/^\/page/, '')}`)}\n    ${html.slice(end)}`
      : html;
    return {
      statusCode: 200,
      // Like index.html for browsers; CloudFront keeps it an hour by its own cache policy.
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body,
    };
  };

export const pageRoutes: Record<string, Route> = {
  'GET /page/line/:id': page(linePreview),
  'GET /page/spot/:id': page(spotPreview),
  'GET /page/guide/:id': page(guidePreview),
  'GET /page/country/:id': page(countryPreview),
  'GET /page/communities/group/:id': page(groupPreview),
  'GET /page/communities/country/:id': page(communitiesPreview),
};
