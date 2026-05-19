"""Social Media Manager AI agent."""

from app.agents.base import BaseAgent


class SocialMediaAgent(BaseAgent):
    """AI employee for social media — content creation, scheduling, engagement."""

    def default_system_prompt(self) -> str:
        return """You are a Social Media Manager AI employee. You create engaging content and manage social media presence.

Your capabilities:
- Create posts for Instagram and LinkedIn
- Write captions with relevant hashtags
- Plan content calendars
- Respond to comments and engagement
- Research trending topics and hashtags
- Suggest content ideas based on industry trends
- Create story/reel concepts

Rules:
- Match the brand voice and tone
- Use appropriate hashtags (not too many, not too few)
- Vary content types (educational, entertaining, promotional, behind-the-scenes)
- Keep platform-specific best practices in mind (Instagram vs LinkedIn)
- Instagram: visual-first, stories, reels, carousels, max 30 hashtags
- LinkedIn: professional tone, industry insights, thought leadership
- Suggest posting times based on engagement best practices
- Always include a call-to-action where appropriate"""

    async def get_tools(self) -> list[dict]:
        return [
            {
                "name": "post_instagram",
                "description": "Create an Instagram post",
                "parameters": {
                    "caption": "Post caption",
                    "hashtags": "List of hashtags",
                    "media_type": "image, carousel, reel",
                    "media_description": "Description of visual content needed",
                },
            },
            {
                "name": "post_linkedin",
                "description": "Publish a LinkedIn post",
                "parameters": {
                    "content": "Post content text",
                    "media_url": "Optional media attachment URL",
                },
            },
            {
                "name": "reply_comment",
                "description": "Reply to a social media comment",
                "parameters": {
                    "platform": "instagram or linkedin",
                    "comment_id": "ID of the comment to reply to",
                    "reply": "Reply text",
                },
            },
            {
                "name": "search_hashtags",
                "description": "Research relevant hashtags",
                "parameters": {
                    "topic": "Topic to find hashtags for",
                    "platform": "instagram or linkedin",
                },
            },
        ]

    async def execute_task(self, task: dict) -> dict:
        """Handle social media tasks."""
        task_type = task.get("input_data", {}).get("type", "general")

        if task_type == "create_post":
            return await self._create_post(task)
        elif task_type == "engagement_reply":
            return await self._reply_engagement(task)
        elif task_type == "content_ideas":
            return await self._generate_ideas(task)
        elif task_type == "hashtag_research":
            return await self._research_hashtags(task)
        else:
            return await super().execute_task(task)

    async def _create_post(self, task: dict) -> dict:
        """Create a social media post."""
        platform = task.get("input_data", {}).get("platform", "instagram")
        topic = task.get("title", "")

        messages = [
            {
                "role": "user",
                "content": f"""Create a {platform} post about: {topic}

Additional context: {task.get('description', '')}
Content type: {task.get('input_data', {}).get('content_type', 'standard post')}

Provide:
1. Caption/Content (platform-appropriate length)
2. Hashtags (relevant, mix of popular and niche)
3. Visual suggestion (what image/video would work best)
4. Best posting time
5. Engagement hook (question or CTA to drive comments)""",
            }
        ]
        response = await self.think(messages)
        return {"status": "completed", "output": response, "type": "create_post"}

    async def _reply_engagement(self, task: dict) -> dict:
        """Generate replies to social media engagement."""
        comments = task.get("input_data", {}).get("comments", [])

        messages = [
            {
                "role": "user",
                "content": f"""Generate replies to these social media comments/messages:

{chr(10).join(f'- "{c}"' for c in comments) if comments else 'No specific comments provided.'}

Context: {task.get('description', '')}

For each comment, provide:
1. Sentiment analysis (positive/neutral/negative)
2. Suggested reply (friendly, on-brand)
3. Whether it needs human review (yes/no)
4. Priority (low/medium/high)""",
            }
        ]
        response = await self.think(messages)
        return {"status": "completed", "output": response, "type": "engagement_reply"}

    async def _generate_ideas(self, task: dict) -> dict:
        """Generate content ideas."""
        messages = [
            {
                "role": "user",
                "content": f"""Generate 10 content ideas for social media.

Business/Niche: {task.get('title', 'General')}
Platforms: {task.get('input_data', {}).get('platforms', 'Instagram, LinkedIn')}
Goals: {task.get('description', 'Increase engagement and followers')}

For each idea, provide:
1. Content concept (one line)
2. Platform (where it works best)
3. Content type (post, story, reel, carousel, article)
4. Brief caption draft
5. Engagement potential (low/medium/high)""",
            }
        ]
        response = await self.think(messages)
        return {"status": "completed", "output": response, "type": "content_ideas"}

    async def _research_hashtags(self, task: dict) -> dict:
        """Research hashtags for a topic."""
        messages = [
            {
                "role": "user",
                "content": f"""Research hashtags for: {task.get('title', '')}

Platform: {task.get('input_data', {}).get('platform', 'instagram')}
Industry: {task.get('description', 'General')}

Provide:
1. High-volume hashtags (5-7) — broad reach
2. Medium-volume hashtags (5-7) — targeted audience
3. Niche hashtags (5-7) — highly specific, less competition
4. Branded hashtag suggestion
5. Hashtags to avoid
6. Optimal number to use per post""",
            }
        ]
        response = await self.think(messages)
        return {"status": "completed", "output": response, "type": "hashtag_research"}
