import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { GeolocateControl, useMap } from 'react-map-gl/mapbox';

import { showWarningNotification } from 'utils';

const deniedMessage = "Location is off for SlackMap. Allow it in your browser or phone's settings.";

// Mapbox gives no sign when the browser refuses the location: it errors silently, or disables its
// button once the refusal is remembered. A disabled button takes no tap, so the tap is read through it.
export const GeolocateButton = () => {
  const dispatch = useDispatch();
  const { current: map } = useMap();

  useEffect(() => {
    const container = map?.getContainer();
    if (!container) return;
    const onClick = (event: MouseEvent) => {
      const group = event.target instanceof Element ? event.target : null;
      if (group?.querySelector(':scope > .mapboxgl-ctrl-geolocate:disabled')) {
        dispatch(showWarningNotification(deniedMessage));
      }
    };
    container.addEventListener('click', onClick);
    return () => container.removeEventListener('click', onClick);
  }, [map, dispatch]);

  return (
    <GeolocateControl
      position="bottom-right"
      onError={(error) =>
        dispatch(
          showWarningNotification(
            error.code === error.PERMISSION_DENIED ? deniedMessage : 'Your location could not be found.',
          ),
        )
      }
    />
  );
};
