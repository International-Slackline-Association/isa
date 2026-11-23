import { useSessionReady } from 'app/session';
import React, { useEffect } from 'react';
import { Layer, Source } from 'react-map-gl/mapbox';

import { geoJsonURL } from 'app/api/constants';
import { useMapDataVersion, versionedUrl } from 'app/api/geojson-data';

import { countryPointLayer, countryPolygonOutlineLayer } from '../layers/countryLayers';
import { slacklineGroupsPointLayer } from '../layers/slacklineGroupsLayer';

export const CommunityMapSourceIds = {
  slacklineGroups: 'slacklineGroups',
  communityCountries: 'communityCountries',
  countriesOutlines: 'countriesOutlines',
} as const;

export const CommunityMapSources = (props: {
  filter?: {
    country?: string;
  };
}) => {
  const sessionReady = useSessionReady();
  const dataVersion = useMapDataVersion('groups');
  const { filter } = props;
  const [countryFilterExpr, setCountryFilterExpr] = React.useState<any>();

  useEffect(() => {
    if (filter?.country) {
      setCountryFilterExpr(['==', ['get', 'c'], filter.country]);
    } else {
      setCountryFilterExpr(undefined);
    }
  }, [filter]);

  // The data needs the session cookie; the map draws without it until the browser check is done.
  if (!sessionReady) return null;

  return (
    <>
      <Source
        id={CommunityMapSourceIds.slacklineGroups}
        type="geojson"
        data={versionedUrl(geoJsonURL.groups, dataVersion)}
        generateId={true}
        promoteId="id"
      >
        <Layer
          {...slacklineGroupsPointLayer({
            visible: true,
            filter: countryFilterExpr,
          })}
        />
      </Source>
      <Source
        id={CommunityMapSourceIds.communityCountries}
        type="geojson"
        data={versionedUrl(geoJsonURL.communityCountries, dataVersion)}
        generateId
        promoteId="id"
      >
        <Layer {...countryPointLayer({ visible: true })} />
      </Source>

      {filter?.country && (
        <Source
          id={CommunityMapSourceIds.countriesOutlines}
          type="geojson"
          data={geoJsonURL.countryPolygons(filter.country)}
          generateId
          promoteId="id"
        >
          <Layer {...countryPolygonOutlineLayer()} />
        </Source>
      )}
    </>
  );
};
