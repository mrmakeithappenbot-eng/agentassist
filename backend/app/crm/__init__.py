"""
CRM Integration Module
Factory for creating CRM handlers
"""

from typing import Dict, Any
from app.crm.base import CRM_Handler, CRMProvider
from app.crm.followupboss import FollowUpBossCRM
from app.crm.boldtrail import BoldTrailCRM

class CRMFactory:
    """
    Factory class to create the appropriate CRM handler
    based on provider type
    """
    
    @staticmethod
    def create_handler(provider: str, credentials: Dict[str, Any]) -> CRM_Handler:
        """
        Create a CRM handler instance
        
        Args:
            provider: CRM provider name (e.g., 'followupboss')
            credentials: Decrypted credentials dictionary
        
        Returns:
            CRM_Handler instance
        
        Raises:
            ValueError: If provider is not supported
        """
        provider = provider.lower()
        
        if provider == CRMProvider.FOLLOWUPBOSS:
            return FollowUpBossCRM(credentials)
        
        elif provider == CRMProvider.KVCORE:
            # TODO: Implement kvCORE handler
            raise NotImplementedError("kvCORE integration coming soon")
        
        elif provider == CRMProvider.LIONDESK:
            # TODO: Implement LionDesk handler
            raise NotImplementedError("LionDesk integration coming soon")
        
        elif provider == CRMProvider.SALESFORCE:
            # TODO: Implement Salesforce handler
            raise NotImplementedError("Salesforce integration coming soon")
        
        elif provider == CRMProvider.HUBSPOT:
            # TODO: Implement HubSpot handler
            raise NotImplementedError("HubSpot integration coming soon")
        
        elif provider == CRMProvider.BOOMTOWN:
            # TODO: Implement BoomTown handler
            raise NotImplementedError("BoomTown integration coming soon")
        
        elif provider == CRMProvider.BOLDTRAIL:
            return BoldTrailCRM(credentials)
        
        else:
            raise ValueError(f"Unsupported CRM provider: {provider}")

__all__ = ['CRM_Handler', 'CRMProvider', 'CRMFactory', 'FollowUpBossCRM', 'BoldTrailCRM']
