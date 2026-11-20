"""Specialist AI Agents package for Jarvis Personal AI OS."""

from openjarvis.agents.specialists.meta_ads import MetaAdsSpecialist
from openjarvis.agents.specialists.google_ads import GoogleAdsSpecialist
from openjarvis.agents.specialists.seo import SEOSpecialist
from openjarvis.agents.specialists.research import ResearchSpecialist
from openjarvis.agents.specialists.gmail import GmailSpecialist
from openjarvis.agents.specialists.personal import PersonalAssistantSpecialist

__all__ = [
    "MetaAdsSpecialist",
    "GoogleAdsSpecialist",
    "SEOSpecialist",
    "ResearchSpecialist",
    "GmailSpecialist",
    "PersonalAssistantSpecialist",
]
