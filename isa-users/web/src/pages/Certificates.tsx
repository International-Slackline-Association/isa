import { useState } from 'react';

import { CertificatesResponse, put, useFetch } from '../api';
import { Icon } from '../components/Icons';
import { Spinner } from '../components/Spinner';

export function Certificates() {
  const { data, isFetching } = useFetch<CertificatesResponse>('certificate/all');
  const [generatingId, setGeneratingId] = useState<string>();
  const [generated, setGenerated] = useState<{ certificateId: string; pdfUrl: string }>();

  const generate = async (certificateType: string, certificateId: string, language: string) => {
    setGeneratingId(certificateId);
    try {
      setGenerated(
        await put<{ certificateId: string; pdfUrl: string }>('certificate/generate', {
          certificateType,
          certificateId,
          language,
        }),
      );
    } catch {
      // put shows the error
    } finally {
      setGeneratingId(undefined);
    }
  };

  return (
    <section className="card">
      <h2>My Certificates</h2>
      <p className="caption">
        Select a language to generate the certificate in PDF format. If you dont see any language,
        please contact us. Not all certificates are yet available via PDF.
      </p>
      {isFetching ? (
        <Spinner />
      ) : !data ? (
        <p>Your certificates could not be loaded.</p>
      ) : data.certificates.length === 0 ? (
        <p>You have no certificates</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th style={{ width: '75%' }}>Certificate Name</th>
              <th style={{ width: '25%' }}>Select Language</th>
            </tr>
          </thead>
          <tbody>
            {data.certificates.map((certificate) => (
              <tr key={certificate.certId}>
                <td>{certificate.title}</td>
                <td>
                  {generatingId === certificate.certId ? (
                    <div className="generating">
                      <span className="secondary">Generating PDF...</span>
                      <Spinner size={24} />
                    </div>
                  ) : generated?.certificateId === certificate.certId ? (
                    <a
                      className="button contained"
                      href={generated.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon name="openInNew" size={20} />
                      Open PDF
                    </a>
                  ) : (
                    <div className="languages">
                      {data.certificateLanguages[certificate.certificateType]?.map((language) => (
                        <button
                          key={language}
                          className="button outlined"
                          disabled={generatingId !== undefined}
                          onClick={() =>
                            generate(certificate.certificateType, certificate.certId, language)
                          }
                        >
                          <Icon name="file" size={20} />
                          {language}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
