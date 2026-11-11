import { ComponentType } from 'react';

import { LogoBackground } from './components/LogoBackground';
import { Toast } from './components/Toast';
import { CertifiedGears } from './pages/CertifiedGears';
import { CertifiedInstructors } from './pages/CertifiedInstructors';
import { CertifiedRiggers } from './pages/CertifiedRiggers';
import { EquipmentWarnings } from './pages/EquipmentWarnings';
import { Homepage } from './pages/Homepage';
import { SairReports } from './pages/SairReports';
import { Verify } from './pages/Verify';
import { WorldFirsts } from './pages/WorldFirsts';
import { WorldRecords } from './pages/WorldRecords';

const routes: Record<string, ComponentType> = {
  '/certified-instructors': CertifiedInstructors,
  '/certified-riggers': CertifiedRiggers,
  '/certified-gears': CertifiedGears,
  '/equipment-warnings': EquipmentWarnings,
  '/sair-reports': SairReports,
  '/world-records': WorldRecords,
  '/world-firsts': WorldFirsts,
  '/verify': Verify,
};

function DocsApp() {
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const Page = routes[path] ?? Homepage;
  return (
    <>
      <LogoBackground />
      <Page />
    </>
  );
}

export function App() {
  const isVerifyWebsite = window.location.host.split('.')[0] === 'verify';

  return (
    <>
      <main>{isVerifyWebsite ? <Verify /> : <DocsApp />}</main>
      <Toast />
    </>
  );
}
