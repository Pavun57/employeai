"""Digital Marketing Manager AI agent."""

from app.agents.base import BaseAgent


class MarketingAgent(BaseAgent):
    """AI employee for digital marketing — email campaigns, ad copy, content strategy."""

    def default_system_prompt(self) -> str:
        return """You are a Digital Marketing Manager AI employee. You work for a small/medium business and handle all marketing tasks autonomously.

Your capabilities:
- Create email marketing campaigns (subject lines, body copy, CTAs)
- Write ad copy for social media and search ads
- Develop content calendars and marketing strategies
- Analyze marketing metrics and provide optimization recommendations
- Draft newsletters and promotional content
- Suggest A/B testing variations

Rules:
- Always maintain the brand voice specified in your configuration
- Be concise and action-oriented
- Provide specific, actionable recommendations
- When drafting emails, include subject line, preview text, and body
- Format outputs in a structured way that's easy to review
- If you need more information about the business, ask clearly

You have access to Gmail for sending campaigns and reading analytics data."""

    async def get_tools(self) -> list[dict]:
        return [
            {
                "name": "send_email",
                "description": "Send an email via Gmail",
                "parameters": {
                    "to": "Recipient email address",
                    "subject": "Email subject line",
                    "body": "Email body (HTML supported)",
                },
            },
            {
                "name": "read_emails",
                "description": "Read recent emails for context",
                "parameters": {
                    "query": "Search query for emails",
                    "limit": "Number of emails to fetch",
                },
            },
            {
                "name": "create_draft",
                "description": "Create an email draft for review",
                "parameters": {
                    "to": "Recipient email address",
                    "subject": "Email subject line",
                    "body": "Email body content",
                },
            },
        ]

    async def execute_task(self, task: dict) -> dict:
        """Execute marketing-specific tasks."""
        task_type = task.get("input_data", {}).get("type", "general")

        if task_type == "email_campaign":
            return await self._create_email_campaign(task)
        elif task_type == "ad_copy":
            return await self._generate_ad_copy(task)
        elif task_type == "content_calendar":
            return await self._plan_content_calendar(task)
        else:
            return await super().execute_task(task)

    async def _create_email_campaign(self, task: dict) -> dict:
        """Create an email marketing campaign."""
        messages = [
            {
                "role": "user",
                "content": f"""Create an email marketing campaign.

Goal: {task.get('title')}
Details: {task.get('description', 'No additional details')}
Target audience: {task.get('input_data', {}).get('audience', 'General customers')}

Please provide:
1. Campaign name
2. Subject line (with 2 A/B variants)
3. Preview text
4. Email body (formatted, with clear CTA)
5. Suggested send time
6. Follow-up email concept""",
            }
        ]
        response = await self.think(messages)
        return {"status": "completed", "output": response, "type": "email_campaign"}

    async def _generate_ad_copy(self, task: dict) -> dict:
        """Generate advertising copy."""
        messages = [
            {
                "role": "user",
                "content": f"""Generate ad copy for the following:

Product/Service: {task.get('title')}
Platform: {task.get('input_data', {}).get('platform', 'social media')}
Objective: {task.get('description', 'Increase awareness')}

Provide 3 variations with:
- Headline
- Body copy
- Call-to-action
- Suggested visual direction""",
            }
        ]
        response = await self.think(messages)
        return {"status": "completed", "output": response, "type": "ad_copy"}

    async def _plan_content_calendar(self, task: dict) -> dict:
        """Plan a content calendar."""
        messages = [
            {
                "role": "user",
                "content": f"""Plan a weekly content calendar.

Business: {task.get('title')}
Goals: {task.get('description', 'Increase engagement')}
Platforms: {task.get('input_data', {}).get('platforms', 'Instagram, LinkedIn')}

Provide a 7-day calendar with:
- Day and time
- Platform
- Content type (post, story, reel, article)
- Topic/theme
- Caption draft
- Hashtag suggestions""",
            }
        ]
        response = await self.think(messages)
        return {"status": "completed", "output": response, "type": "content_calendar"}
