export {
  isClientProvidedEntityId,
  createClient,
  getAllClients,
  getClientById,
  getClientTags,
  getClientTagsForClients,
  setClientTags,
  updateClient,
} from './internal/client-queries'

export {
  createClientFollowUp,
  getClientFollowUps,
  getClientSummary,
  updateClientFollowUpStatus,
} from './internal/client-followup-queries'
