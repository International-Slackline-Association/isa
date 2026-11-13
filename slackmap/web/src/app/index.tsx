import { Suspense, lazy, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router';

import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';

import NotificationSnackbar from 'app/components/NotificationSnackbar';
import { appActions } from 'app/slices/app';
import { selectAuthState, selectIsUserSignedIn } from 'app/slices/app/selectors';
import { AuthState } from 'app/slices/app/types';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import 'mapbox-gl/dist/mapbox-gl.css';

import { AppDrawer } from './components/AppDrawer';
import { withErrorBoundry } from './components/ErrorBoundary';
import { MaintenancePage } from './components/MaintenancePage';

const CommunitiesPage = lazy(() => import('./pages/Communities').then((m) => ({ default: m.CommunitiesPage })));
const CreateGuidePage = lazy(() => import('./pages/Create/Guide').then((m) => ({ default: m.CreateGuidePage })));
const CreateLinePage = lazy(() => import('./pages/Create/Line').then((m) => ({ default: m.CreateLinePage })));
const CreateSpotPage = lazy(() => import('./pages/Create/Spot').then((m) => ({ default: m.CreateSpotPage })));
const GuideEditPage = lazy(() => import('./pages/Guide/GuideEditPage').then((m) => ({ default: m.GuideEditPage })));
const LegacyDetailPage = lazy(() => import('./pages/LegacyDetailPage').then((m) => ({ default: m.LegacyDetailPage })));
const LineEditPage = lazy(() => import('./pages/Line/LineEditPage').then((m) => ({ default: m.LineEditPage })));
const SlacklineMapPage = lazy(() => import('./pages/SlacklineMap').then((m) => ({ default: m.SlacklineMapPage })));
const SpotEditPage = lazy(() => import('./pages/Spot/SpotEditPage').then((m) => ({ default: m.SpotEditPage })));

export function App() {
  const dispatch = useDispatch();

  const authState = useSelector(selectAuthState);
  const isSignedIn = useSelector(selectIsUserSignedIn);

  useEffect(() => {
    Hub.listen('auth', async ({ payload: { event } }) => {
      switch (event) {
        case 'signedIn':
          dispatch(appActions.updateAuthState(AuthState.SignedIn));
          break;
        case 'signedOut':
          dispatch(appActions.updateAuthState(AuthState.SignedOut));
          break;

        default:
          break;
      }
    });
    getCurrentUser()
      .then(async () => {
        dispatch(appActions.updateAuthState(AuthState.SignedIn));
      })
      .catch(() => dispatch(appActions.updateAuthState(AuthState.SigningOut)));
  }, [dispatch]);

  useEffect(() => {
    if (authState === AuthState.SigningOut) {
      signOut();
    }
  }, [authState, dispatch]);

  return (
    <>
      <CssBaseline />
      <GlobalStyles
        styles={{
          body: {
            fontFamily: 'Lato',
            height: '100%',
            width: '100%',
          },
        }}
      />
      {import.meta.env.VITE_APP_MAINTENANCE_MODE === 'true' ? (
        <MaintenancePage />
      ) : (
        <BrowserRouter>
          <AppDrawer>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<SlacklineMapPage />} />
                <Route path="/line/:lineId" element={<SlacklineMapPage />} />
                <Route path="/spot/:spotId" element={<SlacklineMapPage />} />
                <Route path="/guide/:guideId" element={<SlacklineMapPage />} />
                <Route path="/country/:countryCode" element={<SlacklineMapPage />} />
                <Route path="/communities" element={<CommunitiesPage />} />
                <Route path="/communities/group/:groupId" element={<CommunitiesPage />} />
                <Route path="/communities/country/:countryCode" element={<CommunitiesPage />} />
                {isSignedIn && (
                  <>
                    <Route path="/create/line" element={<CreateLinePage />} />
                    <Route path="/line/:lineId/edit" element={<LineEditPage />} />
                    <Route path="/create/spot" element={<CreateSpotPage />} />
                    <Route path="/spot/:spotId/edit" element={<SpotEditPage />} />
                    <Route path="/create/guide" element={<CreateGuidePage />} />
                    <Route path="/guide/:guideId/edit" element={<GuideEditPage />} />
                  </>
                )}
                <Route path="/x/:legacyId" element={<LegacyDetailPage />} />
                <Route path="*" element={<SlacklineMapPage />} />
              </Routes>
            </Suspense>
          </AppDrawer>

          <NotificationSnackbar />
        </BrowserRouter>
      )}
    </>
  );
}

export default withErrorBoundry(App);
