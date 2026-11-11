import { GetParameterCommand } from '@aws-sdk/client-ssm';
import { ssm } from 'core/aws/clients';
import { google, sheets_v4 } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const googleCredsSSMParameter = 'isa-tools-google-credentials-json';
const certificatesSpreadsheetId = '1WO8RDDn6WKTmZQX4YK9xNwWfh0-eciIX0fdSvsgNRsA';
const equipmentWarningsSpreadsheetId = '16cp9iRy1Rs8uOU_UZ9ouJGkhQ_0IiySmF5UNCaorJHM';
const sairReportSpreadsheetId = '1uZiOhAlhAX_u682hhvjkcdos--bzWpBNImff29Hx5aI';

let sheets: sheets_v4.Sheets;
const cache: {
  googleCreds?: any;
  ranges: { [key: string]: sheets_v4.Schema$ValueRange[] | undefined };
  expiresIn: number;
} = {
  ranges: {},
  expiresIn: Date.now() + 1000 * 60 * 5,
};

export const initSpreadsheets = async () => {
  return authorizeSpreadsheet();
};

export const getSpreadsheetValues = async <T extends string>(
  range: string,
  spreadsheet: 'certificates' | 'equipment-warnings' | 'sair-reports',
  obj: T[],
) => {
  const cachedValue = cache.ranges[range] || [];
  if (cachedValue.length <= 0 || cache.expiresIn < Date.now()) {
    await authorizeSpreadsheet();

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

    const result = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: spreadsheetId,
      ranges: [range],
    });
    cache.ranges[range] = result.data.valueRanges;
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

const authorizeSpreadsheet = async () => {
  if (!sheets) {
    const ssmParam = await ssm.send(new GetParameterCommand({ Name: googleCredsSSMParameter }));
    const googleCreds = JSON.parse(ssmParam.Parameter?.Value || '');
    const client = new google.auth.JWT(
      googleCreds.client_email,
      undefined,
      googleCreds.private_key,
      SCOPES,
    );
    await client.authorize();
    sheets = google.sheets({ version: 'v4', auth: client });
  }
};
