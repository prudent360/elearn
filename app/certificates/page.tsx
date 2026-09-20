'use client';

import { useState } from 'react';
import { useLearning } from '@/context/LearningContext';
import { Eye, Download, X } from 'lucide-react';

export default function CertificatesPage() {
  const { data } = useLearning();
  const [selectedCert, setSelectedCert] = useState<any | null>(null);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Earned Certificates & Credentials</h1>
          <p className="page-subtitle">Official verified certificates for completed learning paths.</p>
        </div>
      </div>

      <div className="cert-grid">
        {data.certificates.map(cert => (
          <div key={cert.id} className="cert-card">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div className="cert-seal-badge">TSU</div>
                <span className="tag-pill emerald" style={{ fontSize: '0.7rem' }}>Verified Credential</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.3, marginBottom: 6 }}>{cert.title}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cert.issuedBy}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                Issued: {cert.issueDate} • Grade: {cert.grade}
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
              {cert.skills.map((s: string, idx: number) => (
                <span key={idx} className="tag-pill" style={{ fontSize: '0.7rem' }}>{s}</span>
              ))}
            </div>

            <button
              className="btn btn-primary btn-sm"
              style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
              onClick={() => setSelectedCert(cert)}
            >
              <Eye style={{ width: 14, height: 14 }} /> Preview Official Certificate
            </button>
          </div>
        ))}
      </div>

      {selectedCert && (
        <div className="modal-backdrop open" onClick={e => e.target === e.currentTarget && setSelectedCert(null)}>
          <div className="modal-dialog" style={{ maxWidth: 650, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="icon-btn" onClick={() => setSelectedCert(null)}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="certificate-frame">
              <div style={{ fontWeight: 700, color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                Official Certificate of Completion
              </div>
              <div className="cert-header-title" style={{ marginTop: 8 }}>Tekskillup Academy</div>

              <p style={{ marginTop: 24, color: '#475569', fontSize: '1.1rem' }}>This is to certify that</p>
              <div className="student-name-cert">{data.currentUser.name}</div>
              <p style={{ color: '#475569', fontSize: '1.05rem', maxWidth: 500, margin: '0 auto 20px auto' }}>
                has completed the lessons and required passing assignments for
              </p>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>
                {selectedCert.title}
              </h3>

              <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '2px dashed #cbd5e1', paddingTop: 20, marginTop: 20 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Credential ID</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedCert.credentialId}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Issue Date</div>
                  <div style={{ fontWeight: 700 }}>{selectedCert.issueDate}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 28 }}>
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                  <Download style={{ width: 14, height: 14 }} /> Print / Save PDF
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCert(null)}>
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
