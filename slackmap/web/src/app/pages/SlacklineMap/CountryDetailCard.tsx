import React, { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';


import { countryApi } from 'app/api/country-api';
import { CloseAndRefreshActions, FeatureCard, FeatureStats, FlagAvatar } from 'app/components/FeatureCard';
import { getSlacklinePointFeaturesOfCountry } from 'app/api/geojson-data';

import { CountryHistoryField } from '../../components/FeatureDetailFields/CountryHistoryField';

interface Props {
  countryCode: string;
  onChangelogClick: (featureId: string, featureType: SlacklineMapFeatureType) => void;
  onChangelogHover: (featureId?: string, featureType?: SlacklineMapFeatureType) => void;
}

export const CountryDetailCard = (props: Props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [statsInfo, setStatsInfo] = React.useState<{
    lineCount: number;
    spotCount: number;
    guideCount: number;
  }>({
    lineCount: 0,
    spotCount: 0,
    guideCount: 0,
  });
  const {
    data: countryDetails,
    isFetching,
    refetch,
  } = countryApi.useGetCountryDetailsQuery(props.countryCode);

  useEffect(() => {
    const loadStats = async () => {
      const points = await getSlacklinePointFeaturesOfCountry(props.countryCode);
      setStatsInfo(points.stats);
    };
    loadStats();
  }, [props.countryCode, setStatsInfo]);

  const onCloseClicked = () => {
    navigate({ pathname: '/' });
  };

  const onRefreshClicked = () => {
    refetch();
    dispatch(countryApi.util.invalidateTags(['countryDetails', 'countryChangelogs']));
  };

  const stats = useMemo(
    () => [
      {
        label: 'Lines',
        value: statsInfo.lineCount,
      },
      {
        label: 'Spots',
        value: statsInfo.spotCount,
      },
      {
        label: 'Access guides',
        value: statsInfo.guideCount,
      },
    ],
    [statsInfo],
  );

  return (
    <FeatureCard
      loading={isFetching || !countryDetails}
      avatar={<FlagAvatar countryCode={props.countryCode} />}
      title={countryDetails?.name ?? 'Unknown'}
      actions={<CloseAndRefreshActions onClose={onCloseClicked} onRefresh={onRefreshClicked} />}
    >
      <FeatureStats items={stats.map((stat) => ({ value: stat.value, label: stat.label }))} />
      <CountryHistoryField
        code={props.countryCode}
        onChangelogClick={props.onChangelogClick}
        onChangelogHover={props.onChangelogHover}
      />
    </FeatureCard>
  );
};
