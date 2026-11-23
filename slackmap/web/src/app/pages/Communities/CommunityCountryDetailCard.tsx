import { useNavigate } from 'react-router';
import { NavLink } from 'react-router';

import Diversity3Icon from '@mui/icons-material/Diversity3';
import EmailIcon from '@mui/icons-material/Email';
import GroupIcon from '@mui/icons-material/Group';
import InfoIcon from '@mui/icons-material/Info';
import LinkIcon from '@mui/icons-material/Link';
import { Avatar, Chip, Link, Stack, Typography } from '@mui/material';

import { communityApi } from 'app/api/community-api';
import { CloseAndRefreshActions, FeatureCard, FlagAvatar } from 'app/components/FeatureCard';
import { FeatureDetailFieldLayout } from 'app/components/FeatureDetailFields/DetailFieldLayout';
import { appColors } from 'styles/theme/colors';

import { GroupsManifestText } from './GroupsManifestText';

const safeHttpUrl = (url?: string) => (url && /^https?:\/\//i.test(url) ? url : undefined);

interface Props {
  countryCode: string;
}

export const CommunityCountryDetailCard = (props: Props) => {
  const navigate = useNavigate();

  const { data: countryDetails, isFetching } = communityApi.useGetCommunityCountryDetailsQuery(
    props.countryCode,
  );

  const onCloseClicked = () => {
    navigate('/communities');
  };

  const slacklineGroups = countryDetails?.slacklineGroups ?? [];

  const MemberSubLink = (props: { icon: any; text: string; url?: string; groupId?: string }) => {
    if (!props.url && !props.groupId) return null;
    return (
      <Stack
        direction={'row'}
        spacing={1}
        sx={{ alignItems: 'center', '.MuiTypography-root': { fontSize: 12.5, fontWeight: 500 } }}
      >
        <props.icon sx={{ fontSize: 14, color: 'text.secondary' }} />
        {props.url && (
          <Link href={props.url} target="_blank" rel="noopener">
            <Typography>{props.text}</Typography>
          </Link>
        )}
        {props.groupId && (
          <NavLink to={`/communities/group/${props.groupId}`}>
            <Typography>Details</Typography>
          </NavLink>
        )}
      </Stack>
    );
  };

  return (
    <FeatureCard
      loading={isFetching || !countryDetails}
      avatar={<FlagAvatar countryCode={props.countryCode} />}
      title={countryDetails?.name ?? 'Unknown'}
      actions={<CloseAndRefreshActions onClose={onCloseClicked} />}
    >
      {countryDetails && (
        <>
          <FeatureDetailFieldLayout
            icon={<Diversity3Icon />}
            header={'ISA members and partners'}
            subHeader={
              <Typography variant="body2">
                Slackline organizations officially recognized by the ISA.{' '}
                <Link href="https://www.slacklineinternational.org/members-partners/" target={'_blank'}>
                  Read more
                </Link>
              </Typography>
            }
          >
            {countryDetails.isaMembers.length > 0 ? (
              countryDetails.isaMembers.map((member) => (
                <Stack key={member.id} direction={'row'} spacing={1.25} sx={{ alignItems: 'center' }}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: appColors.isaMemberGroupColor }}>
                    {member.name[0]}
                  </Avatar>
                  <Stack sx={{ alignItems: 'flex-start', justifyContent: 'center' }}>
                    <Typography variant="body2Bold">{member.name}</Typography>
                    <Stack direction={'row'} spacing={1.25}>
                      {member.email && (
                        <MemberSubLink icon={EmailIcon} text={'Email'} url={`mailto:${encodeURIComponent(member.email)}`} />
                      )}
                      <MemberSubLink icon={InfoIcon} text={'Details'} groupId={member.id} />
                      <MemberSubLink icon={LinkIcon} text={'Link'} url={safeHttpUrl(member.isaMembership?.infoUrl)} />
                    </Stack>
                  </Stack>
                </Stack>
              ))
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                There are no registered members in this country.
              </Typography>
            )}
          </FeatureDetailFieldLayout>
          <FeatureDetailFieldLayout
            icon={<GroupIcon />}
            header={'Slackline groups'}
            subHeader={<GroupsManifestText type="communityCountry" />}
          >
            {slacklineGroups.length > 0 ? (
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                {slacklineGroups.map((group) => (
                  <Chip
                    key={group.id}
                    label={group.name}
                    size="small"
                    clickable
                    component={NavLink}
                    to={`/communities/group/${group.id}`}
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                There are no slackline groups in this country.
              </Typography>
            )}
          </FeatureDetailFieldLayout>
        </>
      )}
    </FeatureCard>
  );
};
