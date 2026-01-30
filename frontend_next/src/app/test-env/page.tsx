'use client';

export default function TestEnvPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variables Test</h1>
      <pre>
        NEXT_PUBLIC_API_URL: {process.env.NEXT_PUBLIC_API_URL || 'NOT DEFINED'}
      </pre>
      <p>If API URL is NOT DEFINED, restart the frontend server!</p>
    </div>
  );
}
