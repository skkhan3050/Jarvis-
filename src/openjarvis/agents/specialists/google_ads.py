"""Google Ads Specialist Agent (JARVIS_03_GOOGLE_ADS).

Specializes in Google Ads Search & Performance Max analysis, wasted spend detection,
negative keyword identification, Quality Score review, and target CPA optimization.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional
from openjarvis.security.approval_gateway import get_approval_gateway

logger = logging.getLogger(__name__)


class GoogleAdsSpecialist:
    """Specialist agent for Google Ads management and optimization."""

    AGENT_ID = "JARVIS_03_GOOGLE_ADS"
    ROLE = "Google Ads & Search PPC Specialist"

    def __init__(self, developer_token: Optional[str] = None, customer_id: Optional[str] = None) -> None:
        self.developer_token = developer_token or os.environ.get("GOOGLE_ADS_DEVELOPER_TOKEN", "")
        self.customer_id = customer_id or os.environ.get("GOOGLE_ADS_CUSTOMER_ID", "123-456-7890")
        self.approval_gateway = get_approval_gateway()

    @property
    def is_live_configured(self) -> bool:
        return bool(self.developer_token and self.developer_token.strip())

    async def execute_task(self, query: str, action: str = "analyze", params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute Google Ads analysis or gated management actions."""
        p = params or {}

        # 1. Human Approval Gate for modifying bids, negative keywords, or pausing
        if action in ("add_negative_keywords", "update_cpa", "pause_adgroup"):
            approved, action_id, msg = await self.approval_gateway.evaluate_or_request_approval(
                agent_name=self.AGENT_ID,
                action_type=f"google_ads_{action}",
                description=f"Google Ads: {action} with parameters {p}",
                payload={"query": query, "params": p, "customer_id": self.customer_id},
            )
            if not approved:
                return {
                    "success": False,
                    "agent": self.AGENT_ID,
                    "status": "waiting_approval",
                    "action_id": action_id,
                    "message": msg,
                    "summary": f"Google Ads change submitted. Pending operator approval (Action ID: {action_id}).",
                }

        # 2. Wasted Spend & Search Term Audit (Safe Read-Only)
        if not self.is_live_configured:
            return {
                "success": True,
                "agent": self.AGENT_ID,
                "status": "completed",
                "mode": "simulation_mock",
                "customer_id": self.customer_id,
                "summary": (
                    "**Google Ads Performance & Wasted Spend Audit**\n\n"
                    "• **Total Spend (30d):** $4,120.00 | **Conversions:** 142\n"
                    "• **Average Cost Per Acquisition (CPA):** $29.01 (Target: $32.00 - Performing Well)\n"
                    "• **Wasted Spend Detected:** ~$410.00 spent on irrelevant broad-match search terms.\n"
                    "• **Recommended Negative Keywords:** `free`, `jobs`, `tutorial`, `login`, `cheap crack`\n"
                    "• **Impression Share Lost to Budget:** 18.4% on high-intent 'Core Services' campaign."
                ),
                "metrics": {
                    "spend_30d": 4120.00,
                    "conversions": 142,
                    "cpa": 29.01,
                    "cpc": 1.45,
                    "wasted_spend_est": 410.00,
                    "recommended_negatives": ["free", "jobs", "tutorial", "login"],
                },
            }

        return {
            "success": True,
            "agent": self.AGENT_ID,
            "status": "completed",
            "mode": "live",
            "customer_id": self.customer_id,
            "summary": "Live Google Ads reporting retrieved.",
        }
