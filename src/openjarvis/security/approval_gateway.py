"""Centralized Human Approval Gateway for Jarvis Personal AI OS.

Ensures that sensitive, irreversible, or high-risk actions (e.g. ad budget updates,
campaign modifications, live email sends, file overwrites) require explicit human
authorization before execution.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, Optional, Tuple

from openjarvis.tools.approval_store import (
    STATUS_APPROVED,
    STATUS_DENIED,
    STATUS_PENDING,
    TIER_HIGH,
    TIER_LOW,
    TIER_MEDIUM,
    TIER_TRIVIAL,
    ApprovalStore,
    PendingAction,
)

TIER_CRITICAL = "critical"
from openjarvis.services.supabase_service import get_supabase_service

logger = logging.getLogger(__name__)

# Registry of sensitive action types and their minimum required tiers
RISK_CLASSIFICATION: Dict[str, str] = {
    # Meta Ads
    "meta_ads_read_insights": TIER_TRIVIAL,
    "meta_ads_audit_creatives": TIER_TRIVIAL,
    "meta_ads_update_budget": TIER_HIGH,
    "meta_ads_pause_campaign": TIER_MEDIUM,
    "meta_ads_activate_campaign": TIER_HIGH,
    
    # Google Ads
    "google_ads_report": TIER_TRIVIAL,
    "google_ads_negative_keywords": TIER_MEDIUM,
    "google_ads_update_cpa": TIER_HIGH,
    "google_ads_pause_adgroup": TIER_MEDIUM,
    
    # SEO
    "seo_audit": TIER_TRIVIAL,
    "seo_keyword_research": TIER_TRIVIAL,
    
    # Research
    "research_search": TIER_TRIVIAL,
    "research_competitors": TIER_TRIVIAL,
    
    # Gmail
    "gmail_read_inbox": TIER_TRIVIAL,
    "gmail_search_threads": TIER_TRIVIAL,
    "gmail_create_draft": TIER_LOW,
    "gmail_send_message": TIER_HIGH,
    "gmail_delete_message": TIER_HIGH,
    
    # System / Automation
    "n8n_execute_safe": TIER_TRIVIAL,
    "n8n_execute_write": TIER_HIGH,
    "system_write_file": TIER_HIGH,
    "system_delete_file": TIER_CRITICAL,
}


class ApprovalGateway:
    """Evaluates and gates tool/agent actions against security policies."""

    def __init__(self, store: Optional[ApprovalStore] = None) -> None:
        self.store = store or ApprovalStore()
        self.supabase = get_supabase_service()

    def get_action_tier(self, action_type: str) -> str:
        """Get the risk tier for a given action type."""
        return RISK_CLASSIFICATION.get(action_type, TIER_MEDIUM)

    def is_auto_approved(self, action_type: str) -> bool:
        """Check if action is safe for autonomous execution."""
        tier = self.get_action_tier(action_type)
        return tier in (TIER_TRIVIAL, TIER_LOW)

    async def evaluate_or_request_approval(
        self,
        agent_name: str,
        action_type: str,
        description: str,
        payload: Dict[str, Any],
        permission_key: Optional[str] = None,
    ) -> Tuple[bool, Optional[str], str]:
        """
        Evaluate if an action can proceed immediately or requires user approval.

        Returns:
            (is_approved: bool, action_id: Optional[str], message: str)
        """
        tier = self.get_action_tier(action_type)
        key = permission_key or f"{agent_name}:{action_type}"

        # 1. Check if user previously granted permanent permission
        rule = self.store.get_permission(key)
        if rule and rule.decision == "always_approve":
            logger.info("Action %s auto-approved by remembered permission %s", action_type, key)
            return True, None, "Auto-approved via remembered policy"

        if rule and rule.decision == "always_deny":
            logger.warning("Action %s blocked by remembered denial %s", action_type, key)
            return False, None, "Blocked by user permanent policy"

        # 2. Check risk tier
        if tier in (TIER_TRIVIAL, TIER_LOW):
            # Safe action, allow immediate execution
            return True, None, "Safe operation auto-approved"

        # 3. High/Critical action: Create a PendingAction requiring explicit user sign-off
        action = self.store.queue_action(
            action_type=action_type,
            description=description,
            payload=payload,
            permission_key=key,
            tier=tier,
        )
        action_id = action.id

        # Audit log in Supabase / Local storage
        await self.supabase.log_event(
            level="WARN",
            component="ApprovalGateway",
            message=f"Approval requested for {action_type} by {agent_name}: {description}",
            metadata={"action_id": action_id, "tier": tier, "payload": payload},
        )

        return (
            False,
            action_id,
            f"Action '{action_type}' requires human authorization (Tier: {tier.upper()}). Action ID: {action_id}",
        )

    def check_approval_status(self, action_id: str) -> str:
        """Check the status of a pending action."""
        action = self.store.get_action(action_id)
        if not action:
            return "not_found"
        return action.status


_gateway_instance: Optional[ApprovalGateway] = None


def get_approval_gateway() -> ApprovalGateway:
    """Return the global ApprovalGateway instance."""
    global _gateway_instance
    if _gateway_instance is None:
        _gateway_instance = ApprovalGateway()
    return _gateway_instance
