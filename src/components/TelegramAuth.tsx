import {Box, Button, Container, Heading, Input, Text, VStack,} from "@chakra-ui/react"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {useState} from "react"
import {useForm} from "react-hook-form"

import type {TelegramAuthRequest} from "@/client"
import {TelegramService} from "@/client"

interface TelegramAuthForm {
    phone: string
}

interface TelegramVerifyForm {
    code: string
    password?: string
}

interface TelegramStatus {
    connected: boolean;
    phone?: string;
    username?: string;
    message: string;
}


const TelegramAuth = () => {
    const queryClient = useQueryClient()
    const [authState, setAuthState] = useState<'idle' | 'code_sent' | 'connected'>('idle')
    const [sessionKey, setSessionKey] = useState<string>('')
    const [phone, setPhone] = useState<string>('')
    const [successMessage, setSuccessMessage] = useState<string>('')
    const [errorMessage, setErrorMessage] = useState<string>('')

    const {register: registerAuth, handleSubmit: handleAuthSubmit} = useForm<TelegramAuthForm>()
    const {register: registerVerify, handleSubmit: handleVerifySubmit} = useForm<TelegramVerifyForm>()

    // Get Telegram status
    const {data: telegramStatus} = useQuery({
        queryKey: ["telegram-status"],
        queryFn: () => TelegramService.getTelegramStatus()
    })

    // Start authentication
    const startAuthMutation = useMutation({
        mutationFn: (data: TelegramAuthForm) => {
            const requestBody: TelegramAuthRequest = {
                phone: data.phone
            }
            return TelegramService.startTelegramAuth({requestBody})
        },
        onSuccess: (data: any) => {
            setSessionKey(data.session_key)
            setAuthState('code_sent')
            setSuccessMessage("Authentication code sent to your phone")
            setErrorMessage('')
        },
        onError: (err: any) => {
            setErrorMessage(err.message || 'Failed to start authentication')
            setSuccessMessage('')
        }
    })

    // Verify code
    const verifyMutation = useMutation({
        mutationFn: (data: TelegramVerifyForm) => {
            const requestBody = {
                session_key: sessionKey,
                phone: phone,
                code: data.code,
                password: data.password
            }
            return TelegramService.verifyTelegramAuth({requestBody})
        },
        onSuccess: () => {
            setAuthState('connected')
            queryClient.invalidateQueries({queryKey: ["telegram-status"]})
            setSuccessMessage("Successfully connected to Telegram!")
            setErrorMessage('')
        },
        onError: (err: any) => {
            setErrorMessage(err.message || 'Failed to verify code')
            setSuccessMessage('')
        }
    })

    // Disconnect
    const disconnectMutation = useMutation({
        mutationFn: () => TelegramService.disconnectTelegram(),
        onSuccess: () => {
            setAuthState('idle')
            queryClient.invalidateQueries({queryKey: ["telegram-status"]})
            setSuccessMessage("Disconnected from Telegram")
            setErrorMessage('')
        },
        onError: (err: any) => {
            setErrorMessage(err.message || 'Failed to disconnect')
            setSuccessMessage('')
        }
    })

    const onStartAuth = (data: TelegramAuthForm) => {
        setPhone(data.phone)
        startAuthMutation.mutate(data)
    }

    const onVerifyCode = (data: TelegramVerifyForm) => {
        verifyMutation.mutate(data)
    }

    if ((telegramStatus as TelegramStatus)?.connected == true || authState === 'connected') {
        return (
            <Container maxW="full">
                <Heading size="sm" py={4}>
                    Telegram Integration
                </Heading>
                <div style={{
                    padding: '12px',
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    border: '1px solid #c3e6cb',
                    borderRadius: '4px',
                    marginBottom: '16px'
                }}>
                    ✅ Your Telegram account is connected and monitoring messages
                </div>
                <Button
                    colorScheme="red"
                    onClick={() => disconnectMutation.mutate()}
                    loading={disconnectMutation.isPending}
                >
                    Disconnect Telegram
                </Button>
            </Container>
        )
    }

    return (
        <Container maxW="full">
            <Heading size="sm" py={4}>
                Connect Telegram Account
            </Heading>
            <Text mb={4} color="gray.600">
                Connect your Telegram account to automatically capture and classify all your messages.
            </Text>

            {successMessage && (
                <div style={{
                    padding: '12px',
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    border: '1px solid #c3e6cb',
                    borderRadius: '4px',
                    marginBottom: '16px'
                }}>
                    {successMessage}
                </div>
            )}

            {errorMessage && (
                <div style={{
                    padding: '12px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    border: '1px solid #f5c6cb',
                    borderRadius: '4px',
                    marginBottom: '16px'
                }}>
                    {errorMessage}
                </div>
            )}

            {authState === 'idle' && (
                <Box as="form" onSubmit={handleAuthSubmit(onStartAuth)}>
                    <div style={{marginBottom: '16px'}}>
                        <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
                            Phone Number
                        </label>
                        <Input
                            {...registerAuth("phone", {required: true})}
                            placeholder="+1234567890"
                            type="tel"
                        />
                    </div>
                    <Button
                        mt={4}
                        type="submit"
                        loading={startAuthMutation.isPending}
                    >
                        Send Verification Code
                    </Button>
                </Box>
            )}

            {authState === 'code_sent' && (
                <VStack>
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#d1ecf1',
                        color: '#0c5460',
                        border: '1px solid #bee5eb',
                        borderRadius: '4px',
                        width: '100%'
                    }}>
                        ℹ️ Please enter the verification code sent to your phone
                    </div>
                    <Box as="form" onSubmit={handleVerifySubmit(onVerifyCode)} width="100%">
                        <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
                                Verification Code
                            </label>
                            <Input
                                {...registerVerify("code", {required: true})}
                                placeholder="12345"
                            />
                        </div>
                        <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
                                2FA Password (if enabled)
                            </label>
                            <Input
                                {...registerVerify("password")}
                                type="password"
                                placeholder="Leave empty if not using 2FA"
                            />
                        </div>
                        <Button
                            type="submit"
                            loading={verifyMutation.isPending}
                        >
                            Verify Code
                        </Button>
                    </Box>
                </VStack>
            )}
        </Container>
    )
}

export default TelegramAuth