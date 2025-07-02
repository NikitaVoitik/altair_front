import {
    Box,
    Container,
    Text,
    VStack,
    Heading,
    SimpleGrid,
    Flex,
    Spinner
} from "@chakra-ui/react"
import {createFileRoute} from "@tanstack/react-router"
import {useEffect, useState} from "react"

import useAuth from "@/hooks/useAuth"
import TelegramAuth from "@/components/TelegramAuth.tsx"
import {GoogleOAuthButton} from "@/components/GoogleOAuthButton.tsx"
import {ItemsService} from "@/client";

export const Route = createFileRoute("/_layout/")({
    component: Dashboard,
})

function Dashboard() {
    const {user: currentUser} = useAuth()
    const [messageCount, setMessageCount] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchMessageCount = async () => {
            try {
                setIsLoading(true)
                // Fetch items with minimal limit to get the count efficiently
                const response = await ItemsService.readItems({limit: 1})
                setMessageCount(response.count || 0)
            } catch (error) {
                console.error('Failed to fetch message count:', error)
                setMessageCount(0)
            } finally {
                setIsLoading(false)
            }
        }

        fetchMessageCount()
    }, [])

    const formatMessageCount = (count: number | null) => {
        if (count === null) return "Loading..."
        if (count === 0) return "No messages yet"
        return `${count.toLocaleString()} Message${count === 1 ? '' : 's'} Processed`
    }

    return (
        <Box minH="100vh" bg="gray.50">
            <Container maxW="7xl" py={8}>
                {/* Welcome Header */}
                <Box mb={8} p={6} bg="white" borderRadius="xl" shadow="sm">
                    <Flex align="center" mb={4}>
                        <Box mr={4}>
                            <Text fontSize="4xl">👋</Text>
                        </Box>
                        <VStack align="start">
                            <Heading size="xl" color="gray.800">
                                Welcome back, {currentUser?.full_name?.split(' ')[0] || 'User'}!
                            </Heading>
                            <Text color="gray.600" fontSize="lg">
                                {currentUser?.email}
                            </Text>
                        </VStack>
                    </Flex>
                    <Text color="gray.500">
                        Manage your integrations and monitor your connected accounts from here.
                    </Text>
                    <Flex justify="space-between" align="center" p={4}>
                        <Flex align="center">
                            {isLoading ? (
                                <Flex align="center">
                                    <Spinner size="sm" mr={2}/>
                                    <Text fontSize="2xl" fontWeight="bold">
                                        Loading...
                                    </Text>
                                </Flex>
                            ) : (
                                <Text fontSize="2xl" fontWeight="bold">
                                    {formatMessageCount(messageCount)}
                                </Text>
                            )}
                        </Flex>
                    </Flex>
                </Box>

                {/* Integration Cards */}
                <SimpleGrid columns={{base: 1, lg: 2}} gap={8}>

                    {/* Telegram Integration Card */}
                    <Box bg="white" borderRadius="xl" shadow="sm" overflow="hidden">
                        <Box p={6} borderBottom="1px" borderColor="gray.200">
                            <Flex align="center">
                                <Text fontSize="2xl" mr={3}>
                                    💙
                                </Text>
                                <VStack align="start">
                                    <Heading size="md">Telegram Integration</Heading>
                                    <Text fontSize="sm" color="gray.500">
                                        Monitor and capture Telegram messages
                                    </Text>
                                </VStack>
                            </Flex>
                        </Box>
                        <Box p={6}>
                            <TelegramAuth/>
                        </Box>
                    </Box>

                    {/* Gmail Integration Card */}
                    <Box bg="white" borderRadius="xl" shadow="sm" overflow="hidden">
                        <Box p={6} borderBottom="1px" borderColor="gray.200">
                            <Flex align="center">
                                <Text fontSize="2xl" mr={3}>
                                    📧
                                </Text>
                                <VStack align="start">
                                    <Heading size="md">Gmail Integration</Heading>
                                    <Text fontSize="sm" color="gray.500">
                                        Connect your Gmail account for email processing
                                    </Text>
                                </VStack>
                            </Flex>
                        </Box>
                        <Box p={6}>
                            <VStack align="stretch">
                                <Text color="gray.600">
                                    Connect your Gmail account to automatically process and analyze your emails
                                    alongside your Telegram messages.
                                </Text>
                                <GoogleOAuthButton/>
                            </VStack>
                        </Box>
                    </Box>
                </SimpleGrid>
            </Container>
        </Box>
    )
}