import CallIcon from '@mui/icons-material/Call';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import EmailIcon from '@mui/icons-material/Email';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkIcon from '@mui/icons-material/Link';
import TelegramIcon from '@mui/icons-material/Telegram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Avatar, Link, Stack, Typography } from '@mui/material';

import { communityApi } from 'app/api/community-api';
import { FeatureCard, FeatureTag } from 'app/components/FeatureCard';
import { FeatureDetailFieldLayout } from 'app/components/FeatureDetailFields/DetailFieldLayout';
import { FeatureHistoryField } from 'app/components/FeatureDetailFields/FeatureHistoryField';
import { FeatureMenuActions } from 'app/components/FeatureDetailFields/FeatureMenuActions';
import { format } from 'date-fns';
import { appColors } from 'styles/theme/colors';

import { GroupsManifestText, isaMemberTypeLabel } from './GroupsManifestText';

interface Props {
  groupId: string;
}

// The links are written by anyone who edits the group: only http(s) is rendered, with its host shown.
const safeUrl = (url?: string) => {
  try {
    const parsed = new URL(url ?? '');
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const LinkField = (props: { icon: typeof LinkIcon; label: string; url?: string }) => {
  const url = safeUrl(props.url);
  if (!url) return null;
  return (
    <Stack direction={'row'} spacing={1} sx={{ alignItems: 'center' }}>
      <props.icon sx={{ fontSize: 18, color: 'text.secondary' }} />
      <Link href={url.href} target="_blank" rel="noopener noreferrer nofollow ugc">
        {props.label}
      </Link>
      <Typography variant="caption" sx={{ color: (t) => t.palette.text.secondary }}>
        {url.hostname}
      </Typography>
    </Stack>
  );
};

export const SlacklineGroupDetailCard = (props: Props) => {
  const {
    data: group,
    isFetching,
    refetch,
  } = communityApi.useGetGroupDetailsQuery(props.groupId);

  return (
    <FeatureCard
      loading={isFetching || !group}
      avatar={
        <Avatar sx={{ width: 36, height: 36, bgcolor: group?.isaMembership ? appColors.isaMemberGroupColor : appColors.slacklineGroupColor }}>
          <Diversity3Icon fontSize="small" />
        </Avatar>
      }
      title={group?.name}
      tags={
        group && (
          <>
            <FeatureTag label={group.isaMembership ? `ISA ${isaMemberTypeLabel(group.isaMembership.type)}` : 'Slackline group'} />
            <FeatureTag label={`Updated ${format(new Date(group.lastModifiedDateTime || group.createdDateTime), 'MMM yyyy')}`} />
          </>
        )
      }
      actions={
        group && (
          <FeatureMenuActions
            editorPermissions={group.editorPermissions}
            feature={{ id: group.id, type: 'group' }}
            onRefreshClick={refetch}
          />
        )
      }
    >
      {group && (
        <>
          {group.isaMembership && (
            <FeatureDetailFieldLayout
              icon={<Diversity3Icon />}
              header={`ISA ${isaMemberTypeLabel(group.isaMembership.type)}`}
              subHeader={<GroupsManifestText type="isaMember" />}
            >
              <LinkField icon={LinkIcon} label="Read more" url={group.isaMembership.infoUrl} />
            </FeatureDetailFieldLayout>
          )}
          <FeatureDetailFieldLayout
            icon={<CallIcon />}
            header={'Contact'}
            subHeader={!group.isaMembership && <GroupsManifestText type="groupDetail" />}
          >
            <Stack spacing={0.75}>
              {group.email && (
                <Stack direction={'row'} spacing={1} sx={{ alignItems: 'center' }}>
                  <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Link href={`mailto:${encodeURIComponent(group.email)}`}>{group.email}</Link>
                </Stack>
              )}
              <LinkField icon={FacebookIcon} label="Facebook page" url={group.facebookPage} />
              <LinkField icon={FacebookIcon} label="Facebook group" url={group.facebookGroup} />
              <LinkField icon={TelegramIcon} label="Telegram group" url={group.telegram} />
              <LinkField icon={InstagramIcon} label="Instagram page" url={group.instagram} />
              <LinkField icon={WhatsAppIcon} label="WhatsApp group" url={group.whatsapp} />
              <LinkField icon={LinkIcon} label="Web page" url={group.webpage} />
            </Stack>
          </FeatureDetailFieldLayout>
          <FeatureHistoryField featureId={group.id} featureType={'group'} createdDateTime={group.createdDateTime} />
        </>
      )}
    </FeatureCard>
  );
};
