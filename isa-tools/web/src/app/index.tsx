import { Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Box, GlobalStyles } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

import NotificationSnackbar from 'app/components/NotificationSnackbar';
import { withErrorHandler } from 'app/components/error-handling';
import AppErrorBoundaryFallback from 'app/components/error-handling/fallbacks/App';
import { appActions } from 'store/state';
import { selectSnackbarNotification } from 'store/state/selectors';

import { CertifiedInstructors } from '././pages/CertifiedInstructors/Loadable';
import { ISALogoBackground } from './components/ISALogoBackground';
import { CertifiedGears } from './pages/CertifiedGears/Loadable';
import { CertifiedRiggers } from './pages/CertifiedRiggers/Loadable';
import { EquipmentWarnings } from './pages/EquipmentWarnings/Loadable';
import { Homepage } from './pages/Homepage';
import { SairReports } from './pages/SairReports/Loadable';
import { Verify } from './pages/Verify';
import { Verify as VerifyAsync } from './pages/Verify/Loadable';
import { WorldFirsts } from './pages/WorldFirsts/Loadable';
import { WorldRecords } from './pages/WorldRecords/Loadable';

function DocsApp() {
  return (
    <>
      <ISALogoBackground />
      <BrowserRouter>
        <Routes>
          <Route path="/certified-instructors" element={<CertifiedInstructors />} />
          <Route path="/certified-riggers" element={<CertifiedRiggers />} />
          <Route path="/certified-gears" element={<CertifiedGears />} />
          <Route path="/equipment-warnings" element={<EquipmentWarnings />} />
          <Route path="/sair-reports" element={<SairReports />} />
          <Route path="/world-records" element={<WorldRecords />} />
          <Route path="/world-firsts" element={<WorldFirsts />} />
          <Route path="/verify" element={<VerifyAsync />} />
          <Route path="*" element={<Homepage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

function VerifyApp() {
  return <Verify />;
}

export function App() {
  const snackbarNotification = useSelector(selectSnackbarNotification);
  const dispatch = useDispatch();

  const onSnackbarClose = () => {
    dispatch(appActions.updateSnackbarNotification(null));
  };

  const isVerifyWebsite = window.location.host?.split('.')[0] === 'verify';

  return (
    <Fragment>
      <CssBaseline />
      <GlobalStyles
        styles={{
          body: {
            fontFamily: 'Lato, sans-serif',
            height: '100%',
            width: '100%',
          },
        }}
      />
      <Box
        component="main"
        sx={{
          width: '100%',
          height: '100vh',
          p: 2,
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {isVerifyWebsite ? <VerifyApp /> : <DocsApp />}
      </Box>
      <NotificationSnackbar snackbarNotification={snackbarNotification} onClose={onSnackbarClose} />
    </Fragment>
  );
}

export default withErrorHandler(App, AppErrorBoundaryFallback);
