"""Application configuration from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/employeai"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Auth
    secret_key: str = "change-this-to-a-random-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # Supabase
    supabase_url: str = "http://localhost:54321"
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # LLM
    llm_provider: str = "lmstudio"  # "groq" | "lmstudio" | "openai_compatible"
    llm_base_url: str = "http://localhost:1234/v1"
    llm_api_key: str = ""
    llm_model: str = "default"

    # Groq
    groq_api_key: str = ""
    groq_base_url: str = "https://api.groq.com/openai/v1"

    # Encryption
    encryption_key: str = "change-this-to-a-32-byte-hex-key"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    # App
    app_url: str = "http://localhost:3000"
    api_url: str = "http://localhost:8000"
    debug: bool = True

    # Celery
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # OAuth - Google (Gmail)
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/integrations/oauth/gmail/callback"

    # OAuth - LinkedIn
    linkedin_client_id: str = ""
    linkedin_client_secret: str = ""
    linkedin_redirect_uri: str = "http://localhost:8000/api/integrations/oauth/linkedin/callback"

    class Config:
        env_file = "../../.env"
        extra = "ignore"


settings = Settings()
