import { Link, Typography } from '@mui/material';

import { IsaMemberType } from '@server/core/types';

interface Props {
  type: 'communityCountry' | 'groupDetail' | 'isaMember';
}

export const isaMemberTypeLabel = (type: IsaMemberType) => {
  switch (type) {
    case 'active':
      return 'Active Member';
    case 'observer':
      return 'Observer Member';
    case 'associate':
      return 'Associate Member';
    case 'partner':
      return 'Partner';
  }
};

export const GroupsManifestText = (props: Props) => {
  if (props.type === 'communityCountry') {
    return (
      <Typography variant="body2">
        Slackline groups are added and kept up to date by the community. Sign in to add your group
        with the + button, or open a group to update it.
      </Typography>
    );
  } else if (props.type === 'groupDetail') {
    return (
      <Typography variant="body2">
        The information about this group is managed by the community. If it is outdated, sign in
        and use "Request to Edit" from the menu to update it.
      </Typography>
    );
  } else if (props.type === 'isaMember') {
    return (
      <Typography variant="body2">
        Recognized by the International Slackline Association and managed by ISA. To change it,
        contact{' '}
        <Link href="mailto:slackmap@slacklineinternational.org">
          slackmap@slacklineinternational.org
        </Link>
        .{' '}
        <Link href="https://www.slacklineinternational.org/members-partners/" target="_blank">
          About ISA members
        </Link>
      </Typography>
    );
  }
  return null;
};
