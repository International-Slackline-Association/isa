import CallIcon from '@mui/icons-material/Call';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import EmailIcon from '@mui/icons-material/Email';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkIcon from '@mui/icons-material/Link';
import TelegramIcon from '@mui/icons-material/Telegram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Divider, Link, Stack, Typography } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';

import { communityApi } from 'app/api/community-api';
import { FeatureDetailFieldLayout } from 'app/components/FeatureDetailFields/DetailFieldLayout';
import { FeatureHistoryField } from 'app/components/FeatureDetailFields/FeatureHistoryField';
import { FeatureMenuActions } from 'app/components/FeatureDetailFields/FeatureMenuActions';
import { LoadingIndicator } from 'app/components/LoadingIndicator';
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
      <props.icon color="primary" />
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
    <Card
      sx={{
        boxShadow: 'none',
        border: 'none',
        height: '100%',
        width: '100%',
        overflow: 'scroll',
      }}
    >
      {isFetching || !group ? (
        <LoadingIndicator />
      ) : (
        <>
          <CardHeader
            avatar={
              <Avatar
                sx={{
                  bgcolor: group.isaMembership
                    ? appColors.isaMemberGroupColor
                    : appColors.slacklineGroupColor,
                }}
              >
                G
              </Avatar>
            }
            action={
              <FeatureMenuActions
                editorPermissions={group.editorPermissions}
                feature={{ id: group.id, type: 'group' }}
                onRefreshClick={refetch}
              />
            }
            title={group.name}
            slotProps={{ title: { variant: 'h6' } }}
            subheader={`Last updated: ${format(
              new Date(group.lastModifiedDateTime || group.createdDateTime),
              'dd MMM yyy',
            )}`}
          />
          <Divider />
          <CardContent component={Stack} spacing={2}>
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
              <Stack spacing={1}>
                {group.email && (
                  <Stack direction={'row'} spacing={1} sx={{ alignItems: 'center' }}>
                    <EmailIcon color="primary" />
                    <Link href={`mailto:${encodeURIComponent(group.email)}`}>{group.email}</Link>
                  </Stack>
                )}
                <LinkField icon={FacebookIcon} label="Facebook Page" url={group.facebookPage} />
                <LinkField icon={FacebookIcon} label="Facebook Group" url={group.facebookGroup} />
                <LinkField icon={TelegramIcon} label="Telegram Group" url={group.telegram} />
                <LinkField icon={InstagramIcon} label="Instagram Page" url={group.instagram} />
                <LinkField icon={WhatsAppIcon} label="WhatsApp Group" url={group.whatsapp} />
                <LinkField icon={LinkIcon} label="Web Page" url={group.webpage} />
              </Stack>
            </FeatureDetailFieldLayout>
            <FeatureHistoryField
              featureId={group.id}
              featureType={'group'}
              createdDateTime={group.createdDateTime}
            />
          </CardContent>
        </>
      )}
    </Card>
  );
};
