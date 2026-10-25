// Source-verified integration roles for existing public portfolio projects.
// These explain implementation capability, not provider availability or client results.
// In particular, Chargewell uses Claude for outreach copy, not qualification decisions.
import type { Feature } from './projects';

const PROJECT_INTEGRATIONS: Record<string, readonly Feature[]> = {
	vault: [
		{ label: 'Groq Whisper', detail: 'Transcribes spoken money notes into text.' },
		{ label: 'DeepSeek', detail: 'Parses the transcript into a structured transaction for confirmation, and answers questions about spending.' },
		{ label: 'Supabase', detail: 'Authentication and stored finance records support the app across devices.' }
	],
	grimoire: [
		{ label: 'MCP / FastMCP', detail: 'Exposes shared knowledge and memory tools to coding agents through one MCP gateway.' },
		{ label: 'DeepSeek', detail: 'Provides completions over retrieved knowledge and drives the planner agent’s tool calls.' },
		{ label: 'Ollama', detail: 'Supplies embeddings for semantic retrieval and a local completion fallback.' }
	],
	goatedtracking: [
		{ label: 'Django REST API', detail: 'Connects the dashboard and QR-based worker pages to herd records, health history and pen transfers.' }
	],
	leadflow_cockpit: [
		{ label: 'HubSpot', detail: 'Synchronizes companies, contacts and deals between the CRM and the team workspace.' },
		{ label: 'Supabase', detail: 'Stores shared business records and enforces team access through authenticated API calls.' }
	],
	leadflow_visenza_dashboard: [
		{ label: 'Brevo', detail: 'Reads newsletter subscription status into the dashboard without overwriting the contact’s consent record.' },
		{ label: 'Supabase', detail: 'Connects authenticated staff to CRM contacts, quiz results and lead stages.' }
	],
	whatsapp_offer: [
		{ label: 'Claude API', detail: 'The Anthropic Messages API personalizes outreach and follow-up copy. Workflow rules control qualification and next steps.' },
		{ label: 'Asana', detail: 'Creates the team task and photo-review step before an offer can proceed.' },
		{ label: 'Tally', detail: 'Receives structured form responses and photos through webhooks.' }
	],
	booking_invoice: [
		{ label: 'Mollie', detail: 'Creates the payment checkout and verifies payment status before the paid workflow proceeds.' },
		{ label: 'Yousign', detail: 'Creates embedded signature requests and receives signature-completion webhooks.' },
		{ label: 'everbill', detail: 'Connects the workshop flow to draft invoice creation.' },
		{ label: 'HubSpot', detail: 'Creates or updates the deal as the customer progresses through the booking flow.' },
		{ label: 'Brevo', detail: 'Sends transactional confirmations and follow-up emails.' }
	],
	leadflow_invoice_webhook: [
		{ label: 'Stripe', detail: 'Verifies webhook signatures and handles successful or failed payment events.' },
		{ label: 'Zoho Books', detail: 'Creates draft invoices from successful payment events, without sending them automatically.' },
		{ label: 'Telegram', detail: 'Reports invoice activity and payment failures to the team.' }
	],
	quiz_funnel: [
		{ label: 'AWS Bedrock', detail: 'Personalizes the report text around the quiz’s rule-based profile scoring.' },
		{ label: 'Brevo', detail: 'Handles double opt-in and report-delivery emails.' }
	],
	tq_chatbot: [
		{ label: 'DeepSeek', detail: 'Generates conversation replies and extracts lead-scoring signals, with a deterministic fallback.' },
		{ label: 'n8n webhooks', detail: 'Routes qualified-lead events to the client’s notification and follow-up workflows.' }
	]
};

export function integrationsFor(projectId: string): readonly Feature[] {
	return PROJECT_INTEGRATIONS[projectId] ?? [];
}

export const INTEGRATION_GROUPS = [
	{
		id: 'payments', title: 'Payments & invoicing',
		description: 'Mollie and Stripe payment workflows connect to e-signatures, invoices and CRM updates.',
		projectIds: ['booking_invoice', 'leadflow_invoice_webhook']
	},
	{
		id: 'crm', title: 'CRM & business APIs',
		description: 'HubSpot sync and Brevo subscription data connect business systems to the dashboards.',
		projectIds: ['leadflow_cockpit', 'leadflow_visenza_dashboard']
	},
	{
		id: 'llms', title: 'LLM APIs',
		description: 'Claude personalizes outreach. DeepSeek scores chatbot leads and parses voice records. Bedrock personalizes quiz reports.',
		projectIds: ['whatsapp_offer', 'tq_chatbot', 'vault', 'quiz_funnel']
	},
	{
		id: 'mcp', title: 'MCP & tool servers',
		description: 'FastMCP exposes shared knowledge tools. Ollama supplies embeddings, with DeepSeek for completions.',
		projectIds: ['grimoire']
	}
] as const;
