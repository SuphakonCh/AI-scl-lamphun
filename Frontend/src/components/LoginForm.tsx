import { useState } from 'react';
import styles from '../styles/Form.module.css';

interface LoginFormProps {
    onLoginSuccess?: (userId: number) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/v2/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ identifier, password }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'เข้าสู่ระบบไม่สำเร็จ');
            }

            const data = await response.json();
            
            if (onLoginSuccess) {
                onLoginSuccess(data.userId);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>เข้าสู่ระบบ</h2>

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Username หรือ Email</label>
                    <input
                        type="text"
                        className={styles.input}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="กรอกชื่อผู้ใช้ หรือ อีเมล"
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Password</label>
                    <input
                        type="password"
                        className={styles.input}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="กรอกรหัสผ่าน"
                        required
                    />
                </div>

                <button 
                    type="submit" 
                    className={styles.button}
                    disabled={isLoading}
                >
                    {isLoading ? 'กำลังตรวจสอบ...' : 'Login'}
                </button>
            </form>
        </div>
    );
}