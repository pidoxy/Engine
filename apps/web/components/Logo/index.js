import Link from "next/link";
import styles from "./Logo.module.css";
import logoImg from "@/assets/logo.svg";
import aidcareName from "../../assets/AidCare.svg";
import Image from "next/image";

const Logo = ({ compact = false }) => {
  return (
    <>
      <Link href="/" className={`${styles.logoContainer} ${compact ? styles.compact : ''}`}>
        {!compact && (
          <div aria-hidden="true" className={styles.dots}>
            <Image src={logoImg} alt=""/>
          </div>
        )}
        <div aria-label="The AidCare Logo" className={styles.nameLogo}>
          <Image src={aidcareName} alt="The AidCare Logo"/>
        </div>
      </Link>
    </>
  );
}
 
export default Logo;