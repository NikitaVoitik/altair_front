import {Badge, Box, EmptyState, Flex, Heading, Input, Table, Text, VStack} from "@chakra-ui/react"
import {useQuery} from "@tanstack/react-query"
import {createFileRoute, useNavigate} from "@tanstack/react-router"
import {FiSearch} from "react-icons/fi"
import {z} from "zod"
import {ChangeEvent} from "react"

import {ItemsService} from "@/client"
import {ItemActionsMenu} from "@/components/Common/ItemActionsMenu"
import AddItem from "@/components/Items/AddItem"
import PendingItems from "@/components/Pending/PendingItems"
import {
    PaginationItems,
    PaginationNextTrigger,
    PaginationPrevTrigger,
    PaginationRoot,
} from "@/components/ui/pagination.tsx"

export type CategoryEnum = "meeting" | "task" | "information" | "thought";
export type PriorityEnum = "low" | "medium" | "high";

const itemsSearchSchema = z.object({
    page: z.number().catch(1),
    search: z.string().optional(),
    category: z.enum(["meeting", "task", "information", "thought"]).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    source: z.string().optional(),
    messageType: z.string().optional(),
    actionRequired: z.boolean().optional(),
    contact: z.string().optional(),
})

const PER_PAGE = 5

function getItemsQueryOptions({page, search, category, priority, source, messageType, actionRequired, contact}: {
    page: number;
    search?: string;
    category?: string;
    priority?: string;
    source?: string;
    messageType?: string;
    actionRequired?: boolean;
    contact?: string;
}) {
    return {
        queryFn: () =>
            ItemsService.readItems({
                skip: (page - 1) * PER_PAGE,
                limit: PER_PAGE,
                search,
                category: category as CategoryEnum,
                priority: priority as PriorityEnum,
                source,
                messageType: messageType,
                contact,
            }),
        queryKey: ["items", {page, search, category, priority, source, messageType, actionRequired, contact}],
    }
}

export const Route = createFileRoute("/_layout/items")({
    component: Items,
    validateSearch: (search) => itemsSearchSchema.parse(search),
})

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function FilterForm() {
    const navigate = useNavigate({from: Route.fullPath})
    const {search, category, priority, source, contact} = Route.useSearch()

    const handleChange = (field: string, value: any) => {
        // Convert empty strings to undefined for enum fields
        const processedValue = (field === 'category' || field === 'priority') && value === '' ? undefined : value;
        
        navigate({
            search: (prev: Record<string, any>) => ({...prev, [field]: processedValue, page: 1}),
            replace: true,
        })
    }

    return (
        <Box p={4} display="flex" gap={4} flexWrap="wrap">
            <Input
                placeholder="Search..."
                value={search || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("search", e.target.value)}
            />
            <Box>
                <select
                    value={category || ""}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => handleChange("category", e.target.value)}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        fontSize: '14px',
                        minWidth: '120px'
                    }}
                >
                    <option value="">Category</option>
                    <option value="meeting">Meeting</option>
                    <option value="task">Task</option>
                    <option value="information">Information</option>
                    <option value="thought">Thought</option>
                </select>
            </Box>
            <Box>
                <select
                    value={priority || ""}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => handleChange("priority", e.target.value)}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        fontSize: '14px',
                        minWidth: '120px'
                    }}
                >
                    <option value="">Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
            </Box>
            <Input
                placeholder="Source"
                value={source || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("source", e.target.value)}
            />
            <Input
                placeholder="Contact name"
                value={contact || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("contact", e.target.value)}
            />
        </Box>
    )
}

function ClassificationDisplay({classification}: { classification: any }) {
    if (!classification) {
        return <Text color="gray.500" fontSize="sm">No classification</Text>
    }

    return (
        <Box>
            <Flex gap={1} mb={1} flexWrap="wrap">
                <Badge colorScheme="blue" size="sm">
                    {classification.category}
                </Badge>
                <Badge
                    colorScheme={classification.priority === 'high' ? 'red' : classification.priority === 'medium' ? 'orange' : 'green'}
                    size="sm"
                >
                    {classification.priority}
                </Badge>
                {classification.action_required && (
                    <Badge colorScheme="purple" size="sm">
                        Action Required
                    </Badge>
                )}
            </Flex>
            {classification.summary && (
                <Text fontSize="xs" color="gray.600">
                    {classification.summary}
                </Text>
            )}
        </Box>
    )
}

function ContactsDisplay({contact}: { contact: string }) {
    if (!contact) {
        return <Text color="gray.500" fontSize="sm">No contact</Text>
    }

    return (
        <Box>
            <Flex gap={1} flexWrap="wrap">
                <Badge colorScheme="teal" size="sm">
                    {contact}
                </Badge>
            </Flex>
        </Box>
    )
}

function ItemsTable() {
    const navigate = useNavigate({from: Route.fullPath})
    const {page, search, category, priority, source, messageType, actionRequired, contact} = Route.useSearch()

    const {data, isLoading} = useQuery({
        ...getItemsQueryOptions({page, search, category, priority, source, messageType, actionRequired, contact}),
        placeholderData: (prevData) => prevData,
    })

    const setPage = (page: number) =>
        navigate({
            search: (prev: Record<string, any>) => ({...prev, page}),
        })

    const items = data?.data.slice(0, PER_PAGE) ?? []
    const count = data?.count ?? 0

    if (isLoading) {
        return <PendingItems/>
    }

    if (items.length === 0) {
        return (
            <EmptyState.Root>
                <EmptyState.Content>
                    <EmptyState.Indicator>
                        <FiSearch/>
                    </EmptyState.Indicator>
                    <VStack textAlign="center">
                        <EmptyState.Title>No items found</EmptyState.Title>
                        <EmptyState.Description>
                            Try adjusting your search criteria or add a new item
                        </EmptyState.Description>
                    </VStack>
                </EmptyState.Content>
            </EmptyState.Root>
        )
    }

    return (
        <Box>
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>Title</Table.ColumnHeader>
                        <Table.ColumnHeader>Description</Table.ColumnHeader>
                        <Table.ColumnHeader>Classification</Table.ColumnHeader>
                        <Table.ColumnHeader>Contacts</Table.ColumnHeader>
                        <Table.ColumnHeader>Source</Table.ColumnHeader>
                        <Table.ColumnHeader>Created</Table.ColumnHeader>
                        <Table.ColumnHeader>Actions</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {items.map((item) => (
                        <Table.Row key={item.id}>
                            <Table.Cell>
                                <Text fontWeight="medium">
                                    {item.title || 'Untitled'}
                                </Text>
                            </Table.Cell>
                            <Table.Cell>
                                <Text color="gray.600">
                                    {item.description || 'No description'}
                                </Text>
                            </Table.Cell>
                            <Table.Cell>
                                <ClassificationDisplay classification={item.classification}/>
                            </Table.Cell>
                            <Table.Cell>
                                <ContactsDisplay contact={item.classification?.contact || ""}/>
                            </Table.Cell>
                            <Table.Cell>
                                <Text fontSize="sm" color="gray.500">
                                    {item.source || 'Unknown'}
                                </Text>
                            </Table.Cell>
                            <Table.Cell>
                                <Text fontSize="sm" color="gray.500">
                                    {formatDate(item.created_at)}
                                </Text>
                            </Table.Cell>
                            <Table.Cell>
                                <ItemActionsMenu item={item}/>
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>

            {count > PER_PAGE && (
                <PaginationRoot
                    count={count}
                    pageSize={PER_PAGE}
                    page={page}
                    onPageChange={(e) => setPage(e.page)}
                >
                    <PaginationPrevTrigger/>
                    <PaginationItems/>
                    <PaginationNextTrigger/>
                </PaginationRoot>
            )}
        </Box>
    )
}

function Items() {
    return (
        <VStack gap={4} align="stretch">
            <Flex justify="space-between" align="center">
                <Heading size="lg">Items</Heading>
                <AddItem/>
            </Flex>
            <FilterForm/>
            <ItemsTable/>
        </VStack>
    )
}