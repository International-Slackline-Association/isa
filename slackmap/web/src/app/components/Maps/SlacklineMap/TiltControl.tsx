import { useControl } from 'react-map-gl/mapbox';
import type { Map } from 'mapbox-gl';

import { ui } from 'styles/theme/ui';

const TILTED_PITCH = 60;
export const TILT_MIN_PITCH = 5;

// Tilting by right-drag is hard to discover.
export const TiltControl = () => {
  useControl(
    () => {
      const group = document.createElement('div');
      const button = document.createElement('button');
      let map: Map | undefined;
      const render = () => {
        const tilted = (map?.getPitch() ?? 0) > TILT_MIN_PITCH;
        button.textContent = tilted ? '2D' : '3D';
        button.title = tilted ? 'Flat view' : '3D view';
        button.setAttribute('aria-label', button.title);
      };
      return {
        onAdd: (m: Map) => {
          map = m;
          group.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
          button.type = 'button';
          button.style.display = 'grid';
          button.style.placeItems = 'center';
          button.style.color = ui.text;
          button.style.fontWeight = '700';
          button.style.fontSize = '12px';
          button.onclick = () =>
            m.easeTo({ pitch: m.getPitch() > TILT_MIN_PITCH ? 0 : TILTED_PITCH, duration: 800 });
          m.on('pitchend', render);
          render();
          group.replaceChildren(button);
          return group;
        },
        onRemove: () => {
          map?.off('pitchend', render);
          group.remove();
        },
      };
    },
    { position: 'bottom-right' },
  );
  return null;
};
