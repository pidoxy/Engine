import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getSavedUser } from '@/utils/auth';
import Loader from '@/components/Loader';
import Image from 'next/image';
import successImg from "../../assets/success_illustration.png";
import styles from "@/styles/signup-sucess.module.css";

export default function SignupSuccessPage() {
  const router = useRouter();
  const { orgId, orgName } = router.query;
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const user = getSavedUser();

    if (!user || user.role !== 'organization') {
      router.replace('/signup');
      return;
    }

    if (orgId) {
      setInviteLink(`${window.location.origin}/onboard?orgId=${orgId}`);
    }

    setLoading(false);
  }, [orgId]);

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center">
      <Loader />
    </div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.successImg} aria-hidden="true">
        <Image src={successImg} alt='Illustration of a successful registration of the organization'/>
      </div>

      <div className={styles.mainContent}>
        <h1>Welcome to {orgName}</h1>
        <p>
          Your organization is ready. Share this link to invite your team.
        </p>
      </div>

      <div className={styles.inviteLinkContainer}>
        <input className={styles.inviteLink} type="text" readOnly value={inviteLink}/>
        <button
          onClick={() => {
            navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className={styles.inviteLinkButton} aria-label="Copy invite link"
        >
          {copied ? 'Copied!' : 'Copy Invite Link'}
        </button>
      </div>

      <button
          onClick={() => router.push('/app')}
          className={styles.dashboardButton}
      >
        Continue to Dashboard
      </button>
    </div>
  )
}
