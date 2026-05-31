import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header} />
        <div className={styles.block} />
        <div className={styles.block} />
        <div className={styles.block} />
      </div>
    </div>
  );
}
