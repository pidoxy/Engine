import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <h1>Welcome to AidCare</h1>
      <p>Your AI Medical Assistant for Triage</p>
      <Link href="/triage" passHref>
        <button style={{ padding: '15px 30px', fontSize: '1.2em', cursor: 'pointer', marginTop: '20px' }}>
          Start New Triage Session
        </button>
      </Link>
      <Link href="/doctor/consult" passHref> 
            <button style={{ padding: '15px 30px', fontSize: '1.1em', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', width: '250px' }}>
              Doctor Clinical Support
            </button>
          </Link>
    </main>
  );
}