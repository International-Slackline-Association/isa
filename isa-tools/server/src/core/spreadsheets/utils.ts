import { GetParameterCommand } from '@aws-sdk/client-ssm';
import { JWT } from 'google-auth-library';

import { ssm } from '../aws/clients';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const googleCredsSSMParameter = 'isa-tools-google-credentials-json';
const certificatesSpreadsheetId = '1WO8RDDn6WKTmZQX4YK9xNwWfh0-eciIX0fdSvsgNRsA';
const equipmentWarningsSpreadsheetId = '16cp9iRy1Rs8uOU_UZ9ouJGkhQ_0IiySmF5UNCaorJHM';
const sairReportSpreadsheetId = '1uZiOhAlhAX_u682hhvjkcdos--bzWpBNImff29Hx5aI';

type ValueRange = { values?: string[][] };

let googleClient: Promise<JWT> | undefined;
const cache: {
  ranges: { [key: string]: ValueRange[] | undefined };
  expiresIn: number;
} = {
  ranges: {},
  expiresIn: Date.now() + 1000 * 60 * 5,
};

export const getSpreadsheetValues = async <T extends string>(
  range: string,
  spreadsheet: 'certificates' | 'equipment-warnings' | 'sair-reports',
  obj: T[],
) => {
  const cachedValue = cache.ranges[range] || [];
  if (cachedValue.length <= 0 || cache.expiresIn < Date.now()) {
    let spreadsheetId: string;

    switch (spreadsheet) {
      case 'certificates':
        spreadsheetId = certificatesSpreadsheetId;
        break;
      case 'equipment-warnings':
        spreadsheetId = equipmentWarningsSpreadsheetId;
        break;
      case 'sair-reports':
        spreadsheetId = sairReportSpreadsheetId;
        break;
      default:
        throw new Error('Invalid spreadsheet');
    }

    cache.ranges[range] = await batchGet(spreadsheetId, range);
    cache.expiresIn = Date.now() + 1000 * 60 * 5;
  }
  const valueRanges = cache.ranges[range] || [];

  const data: { [key in T]: string | undefined }[] = [];

  if (!valueRanges) {
    return data;
  }

  for (const valueRange of valueRanges) {
    const rangeData = valueRange.values;

    const rows = rangeData?.slice(1) ?? [];
    for (const row of rows) {
      const v: { [key in T]: string | undefined } = {} as any;
      for (let i = 0; i < obj.length; i++) {
        const fieldName = obj[i];
        if (fieldName === '_') {
          continue;
        }
        const rowValue = row[i]?.trim() as string | undefined;
        if (!rowValue) {
          continue;
        }

        v[fieldName] = rowValue;
      }
      data.push(v);
    }
  }
  return data;
};

const authorize = () => {
  googleClient ??= (async () => {
    const ssmParam = await ssm.send(new GetParameterCommand({ Name: googleCredsSSMParameter }));
    const googleCreds = JSON.parse(ssmParam.Parameter?.Value || '');
    return new JWT({ email: googleCreds.client_email, key: googleCreds.private_key, scopes: SCOPES });
  })();
  googleClient.catch(() => (googleClient = undefined));
  return googleClient;
};

const batchGet = async (spreadsheetId: string, range: string) => {
  const { token } = await (await authorize()).getAccessToken();
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) {
    throw new Error(`Google Sheets request failed with status ${response.status}`);
  }
  const data = (await response.json()) as { valueRanges?: ValueRange[] };
  return data.valueRanges;
};
