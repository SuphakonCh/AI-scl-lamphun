import LoginForm from '../components/LoginForm';

interface LoginPageProps {
    onLoginSuccess: (userId: number) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f3f4f6'
        }}>
            <LoginForm onLoginSuccess={onLoginSuccess} />
        </div>
    );
}