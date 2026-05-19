"""Customer Support Executive AI agent."""

from app.agents.base import BaseAgent


class SupportAgent(BaseAgent):
    """AI employee for customer support — auto-reply, ticket management, escalation."""

    def default_system_prompt(self) -> str:
        return """You are a Customer Support Executive AI employee. You handle customer inquiries professionally and efficiently.

Your capabilities:
- Respond to customer queries via email and DMs
- Categorize and prioritize support tickets
- Look up order information from Shopify
- Generate FAQ responses based on common questions
- Escalate complex issues to humans when needed
- Follow up on unresolved tickets

Rules:
- Be empathetic, professional, and helpful
- Keep responses concise but thorough
- Never make promises you can't keep (refunds, changes that need approval)
- Always acknowledge the customer's concern first
- If you're unsure, escalate rather than guess
- Mark tasks for approval when the response involves refunds, cancellations, or account changes
- Include order numbers and relevant details in responses
- Maintain a friendly but professional tone"""

    async def get_tools(self) -> list[dict]:
        return [
            {
                "name": "reply_email",
                "description": "Send a reply to a customer email",
                "parameters": {
                    "to": "Customer email address",
                    "subject": "Reply subject",
                    "body": "Reply body",
                    "thread_id": "Original email thread ID",
                },
            },
            {
                "name": "lookup_order",
                "description": "Look up an order in Shopify",
                "parameters": {
                    "order_id": "Shopify order ID or number",
                },
            },
            {
                "name": "reply_dm",
                "description": "Reply to an Instagram DM",
                "parameters": {
                    "conversation_id": "DM conversation ID",
                    "message": "Reply message text",
                },
            },
            {
                "name": "escalate",
                "description": "Escalate issue to human support",
                "parameters": {
                    "reason": "Why this needs human attention",
                    "priority": "low, medium, high, urgent",
                },
            },
        ]

    async def execute_task(self, task: dict) -> dict:
        """Handle customer support tasks."""
        task_type = task.get("input_data", {}).get("type", "general")

        if task_type == "auto_reply":
            return await self._auto_reply(task)
        elif task_type == "categorize":
            return await self._categorize_ticket(task)
        elif task_type == "faq":
            return await self._generate_faq(task)
        else:
            return await super().execute_task(task)

    async def _auto_reply(self, task: dict) -> dict:
        """Generate an automatic reply to a customer query."""
        customer_message = task.get("input_data", {}).get("message", "")
        customer_name = task.get("input_data", {}).get("customer_name", "Customer")
        platform = task.get("platform", "email")

        messages = [
            {
                "role": "user",
                "content": f"""A customer ({customer_name}) sent a message via {platform}:

"{customer_message}"

Generate an appropriate response. Consider:
- What is the customer asking/complaining about?
- Can you resolve this immediately or does it need escalation?
- Include any relevant order/account information if available

Respond with:
1. Classified intent (inquiry/complaint/request/feedback)
2. Priority (low/medium/high/urgent)
3. Suggested response to the customer
4. Whether this needs human approval before sending (yes/no)
5. Any follow-up actions needed""",
            }
        ]
        response = await self.think(messages)
        return {"status": "completed", "output": response, "type": "auto_reply"}

    async def _categorize_ticket(self, task: dict) -> dict:
        """Categorize a support ticket."""
        messages = [
            {
                "role": "user",
                "content": f"""Categorize this support ticket:

Subject: {task.get('title')}
Message: {task.get('description')}

Provide:
1. Category (billing, shipping, product, technical, account, other)
2. Sub-category
3. Priority (low/medium/high/urgent)
4. Estimated resolution time
5. Suggested assignee (AI auto-handle / human-required)
6. Quick response template""",
            }
        ]
        response = await self.think(messages)
        return {"status": "completed", "output": response, "type": "categorize"}

    async def _generate_faq(self, task: dict) -> dict:
        """Generate FAQ entries from common queries."""
        messages = [
            {
                "role": "user",
                "content": f"""Based on the following common customer questions, generate FAQ entries:

Context: {task.get('description', 'General business queries')}
Questions: {task.get('input_data', {}).get('questions', [])}

For each FAQ entry, provide:
1. Question (clear, concise)
2. Answer (helpful, complete, friendly)
3. Related questions customers might also ask""",
            }
        ]
        response = await self.think(messages)
        return {"status": "completed", "output": response, "type": "faq"}
