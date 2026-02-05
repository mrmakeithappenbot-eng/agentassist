"""
Temporary in-memory storage for imported leads
TODO: Replace with proper database storage
"""

from typing import List, Dict, Any
import uuid

# In-memory storage (temporary until database is set up)
_imported_leads: List[Dict[str, Any]] = []

def add_leads(leads: List[Dict[str, Any]]) -> int:
    """Add imported leads to storage"""
    global _imported_leads
    
    count = 0
    for lead in leads:
        # Add unique ID if not present
        if 'id' not in lead:
            lead['id'] = str(uuid.uuid4())
        
        _imported_leads.append(lead)
        count += 1
    
    return count

def get_all_leads() -> List[Dict[str, Any]]:
    """Get all imported leads"""
    return _imported_leads

def get_lead_by_id(lead_id: str) -> Dict[str, Any] | None:
    """Get a specific lead by ID"""
    for lead in _imported_leads:
        if lead.get('id') == lead_id:
            return lead
    return None

def clear_leads():
    """Clear all leads (for testing)"""
    global _imported_leads
    _imported_leads = []

def get_stats():
    """Get lead statistics"""
    total = len(_imported_leads)
    active = sum(1 for lead in _imported_leads if lead.get('status', '').lower() in ['active', 'new'])
    
    return {
        'total_leads': total,
        'active_leads': active,
        'new_today': 0,  # TODO: Filter by date
        'response_rate': 0
    }
