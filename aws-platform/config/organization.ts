// Single source of truth for who has access to which account.
// Users are created by hand in the Identity Center console (so they get the
// invitation email); everything else here is managed by CDK.

export const region = 'eu-central-1';

export const accounts = {
  // New, empty management account. Fill in once it exists.
  management: '307498582548',
  // Existing ISA workload account (joins the new org as a member).
  isa: '387132903656',
} as const;

export type AccountName = keyof typeof accounts;

export const organization = {
  id: 'o-1voshuzmv4',
  rootId: 'r-zou4',
};

// Regions where workloads may run. us-east-1 is needed for CloudFront
// certificates and Lambda@Edge; us-east-2 hosts SportHub (Amplify).
export const allowedRegions = ['eu-central-1', 'eu-central-2', 'us-east-1', 'us-east-2'] as const;

// ISA-wide resources in the ISA account (IsaShared, IsaSharedUsEast1).
// App-specific DNS, certificates and backups live in the app repos.
export const shared = {
  domain: 'slacklineinternational.org',
};

// Org-wide cost budget in the management account (IsaBilling).
// Name and recipients cannot change without replacing the budget.
export const monthlyBudget = {
  name: 'Monthly Budget',
  limitUsd: 25,
  // Google Workspace forwards aws@ to the right people.
  alertEmails: ['aws@slacklineinternational.org'],
};

// From the Identity Center console of the management account (Settings page).
export const identityCenter = {
  instanceArn: 'arn:aws:sso:::instance/ssoins-6987d55c70fc5734',
  identityStoreId: 'd-9967b127c9',
};

// Identity Center usernames. Must match the username typed in the console.
export const users = [
  'can.sahin',
  'simon.hiller',
  'emile.bragard',
  'dylan.furlong',
  'muhammad.martinez',
  'jonas.umlauft',
] as const;

export type UserName = (typeof users)[number];

export type PermissionSetName = 'AdministratorAccess' | 'rankings-dev-access' | 'slackdata-dev-access';

export interface GroupConfig {
  description: string;
  members: UserName[];
  access: { permissionSet: PermissionSetName; accounts: AccountName[] }[];
}

// Mirrors the assignments in the old org 1:1 so the cut-over changes nothing
// for users. Rework these once the cut-over is done.
export const groups: Record<string, GroupConfig> = {
  admins: {
    description: 'Full administrator access',
    members: ['can.sahin', 'simon.hiller'],
    access: [{ permissionSet: 'AdministratorAccess', accounts: ['management', 'isa'] }],
  },
  'rankings-devs': {
    description: 'Developers with rankings-dev-access (in practice also used for SportHub)',
    members: ['can.sahin', 'dylan.furlong', 'muhammad.martinez', 'jonas.umlauft'],
    access: [{ permissionSet: 'rankings-dev-access', accounts: ['isa'] }],
  },
  'slackdata-devs': {
    description: 'Slackdata developers',
    members: ['emile.bragard'],
    access: [{ permissionSet: 'slackdata-dev-access', accounts: ['isa'] }],
  },
};
