import * as dateFns from 'date-fns';

import { getSpreadsheetValues } from './utils';

export const getSairReports = async () => {
  return getSpreadsheetValues('Full translated', 'sair-reports', [
    'language',
    'timestamp',
    'narrative',
    'analysis',
    'countryName',
    'incidentDate',
    'slacklineType',
    'incidentType',
    'severity',
    'injuryType',
    'injuryLocation',
    'filters',
    'coverImage',
    'image1',
    'image2',
    'image3',
    'image4',
  ]).then((data) => {
    type R = (typeof data)[0] & { incidentDateParsed: Date; images: string[] };
    return data
      .filter((d) => Object.keys(d).length > 0)
      .map<R>((d) => {
        const parsedDate = dateFns.parse(d.incidentDate!, 'M/dd/yyyy', new Date());
        const incidentDateFormatted = dateFns.format(parsedDate, 'dd.MM.yyyy');
        const images = [d.image1, d.image2, d.image3, d.image4].filter((i) => i) as string[];
        delete d.image1;
        delete d.image2;
        delete d.image3;
        delete d.image4;
        return {
          ...d,
          images,
          incidentDate: incidentDateFormatted,
          incidentDateParsed: parsedDate,
        };
      });
  });
};
