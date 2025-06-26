import { useState } from 'react';
import { Button } from '@chakra-ui/react';
import { FaGoogle } from 'react-icons/fa';
import { OauthService } from '@/client';

interface GoogleOAuthButtonProps {
    onError?: (error: string) => void;
}

export const GoogleOAuthButton = ({
                                      onError,
                                  }: GoogleOAuthButtonProps) => {
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);

        try {
            const data = await OauthService.googleOauthLogin();

            window.location.href = data.authorization_url;

        } catch (error) {
            console.error('OAuth error:', error);
            onError?.(error instanceof Error ? error.message : 'OAuth failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleGoogleLogin}
            loading={loading}
            loadingText="Connecting..."
            colorPalette="red"
            variant="outline"
            size="md"
        >
            <FaGoogle style={{ marginRight: '8px' }} />
            Connect Gmail Account
        </Button>
    );
};