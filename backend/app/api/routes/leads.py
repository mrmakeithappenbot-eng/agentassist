"""
Leads API Routes
Fetch and manage leads from connected CRM
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, Optional
from pydantic import BaseModel
import csv
import io

from app.crm.boldtrail import BoldTrailCRM

router = APIRouter()

class LeadResponse(BaseModel):
    id: str
    first_name: Optional[str]
    last_name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    status: Optional[str]
    tags: List[str] = []
    location: Optional[str]
    price_range_min: Optional[int]
    price_range_max: Optional[int]

@router.post("/import")
async def import_leads_csv(file: UploadFile = File(...)):
    """
    Import leads from CSV file
    
    Accepts any CSV with columns like:
    - first_name, last_name, email, phone, status, location, price_min, price_max, tags
    
    Smart column detection - works with variations like:
    - "First Name", "firstname", "First", etc.
    """
    try:
        # Read CSV file
        contents = await file.read()
        csv_text = contents.decode('utf-8')
        csv_file = io.StringIO(csv_text)
        reader = csv.DictReader(csv_file)
        
        leads_imported = []
        
        for row in reader:
            # Smart column mapping - find the right columns regardless of naming
            lead_data = {}
            
            # Map first name
            for key in row.keys():
                key_lower = key.lower().replace(' ', '_').replace('-', '_')
                if 'first' in key_lower and 'name' in key_lower:
                    lead_data['first_name'] = row[key]
                    break
            
            # Map last name
            for key in row.keys():
                key_lower = key.lower().replace(' ', '_').replace('-', '_')
                if 'last' in key_lower and 'name' in key_lower:
                    lead_data['last_name'] = row[key]
                    break
            
            # Map email
            for key in row.keys():
                key_lower = key.lower()
                if 'email' in key_lower or 'e-mail' in key_lower:
                    lead_data['email'] = row[key]
                    break
            
            # Map phone
            for key in row.keys():
                key_lower = key.lower()
                if 'phone' in key_lower or 'mobile' in key_lower or 'cell' in key_lower:
                    lead_data['phone'] = row[key]
                    break
            
            # Map status
            for key in row.keys():
                key_lower = key.lower()
                if 'status' in key_lower or 'stage' in key_lower:
                    lead_data['status'] = row[key]
                    break
            
            # Map location
            for key in row.keys():
                key_lower = key.lower()
                if 'location' in key_lower or 'city' in key_lower or 'address' in key_lower:
                    lead_data['location'] = row[key]
                    break
            
            # Map price min
            for key in row.keys():
                key_lower = key.lower().replace(' ', '_')
                if ('price' in key_lower and 'min' in key_lower) or 'budget_min' in key_lower:
                    try:
                        lead_data['price_min'] = int(float(row[key].replace('$', '').replace(',', '')))
                    except:
                        pass
                    break
            
            # Map price max
            for key in row.keys():
                key_lower = key.lower().replace(' ', '_')
                if ('price' in key_lower and 'max' in key_lower) or 'budget_max' in key_lower:
                    try:
                        lead_data['price_max'] = int(float(row[key].replace('$', '').replace(',', '')))
                    except:
                        pass
                    break
            
            # Map tags
            for key in row.keys():
                key_lower = key.lower()
                if 'tag' in key_lower or 'label' in key_lower:
                    tags_str = row[key]
                    # Split by semicolon, comma, or pipe
                    if ';' in tags_str:
                        lead_data['tags'] = [t.strip() for t in tags_str.split(';')]
                    elif ',' in tags_str:
                        lead_data['tags'] = [t.strip() for t in tags_str.split(',')]
                    elif '|' in tags_str:
                        lead_data['tags'] = [t.strip() for t in tags_str.split('|')]
                    else:
                        lead_data['tags'] = [tags_str.strip()]
                    break
            
            # Set defaults
            if 'status' not in lead_data:
                lead_data['status'] = 'New'
            if 'tags' not in lead_data:
                lead_data['tags'] = []
            
            # Only import if we have at least name or email
            if lead_data.get('first_name') or lead_data.get('email'):
                # TODO: Save to database
                # For now, just count them
                leads_imported.append(lead_data)
        
        return {
            "success": True,
            "imported": len(leads_imported),
            "message": f"Successfully imported {len(leads_imported)} leads"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to import CSV: {str(e)}"
        }

@router.get("/")
async def get_leads(
    status: Optional[str] = None,
    limit: int = 100
):
    """
    Fetch leads from connected CRM
    
    For now, uses hardcoded BoldTrail credentials
    TODO: Get from authenticated user's stored connection
    """
    try:
        # TODO: Get from database based on authenticated user
        # For now, use the Zapier key that was provided
        credentials = {
            "zapier_key": "N2M3MTUzZjY3YTJmNjE0NDk0ZWI1ZDI3NTMwYTUwMjE6YS0yMDM0NDY2",
            "api_key": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjIwMzQ0NjYsImlhdCI6MTc3MDMyNjcyOCwiZXhwIjoxODAxODYyNzI4LCJuYmYiOjE3NzAzMjY3MjgsImF1ZCI6IioiLCJhY3QiOjM3NywianRpIjoiOTc5OWZkN2MzMmNhNTI1NmM3NzIxY2FkNzdkZDZiNTAifQ.XoPrAddcLyV5t2xWnhZ1sU0EVe9FJccCkZD_VtG35HA"
        }
        
        crm = BoldTrailCRM(credentials)
        
        # Fetch leads
        statuses = [status] if status else None
        leads = await crm.get_leads(statuses=statuses, limit=limit)
        
        # Convert to response format
        response_leads = []
        for lead in leads:
            response_leads.append(LeadResponse(
                id=lead.crm_lead_id,
                first_name=lead.first_name,
                last_name=lead.last_name,
                email=lead.email,
                phone=lead.phone,
                status=lead.status,
                tags=lead.tags or [],
                location=lead.location,
                price_range_min=lead.price_range_min,
                price_range_max=lead.price_range_max
            ))
        
        return {
            "success": True,
            "count": len(response_leads),
            "leads": response_leads
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_lead_stats():
    """
    Get lead statistics
    """
    try:
        credentials = {
            "zapier_key": "N2M3MTUzZjY3YTJmNjE0NDk0ZWI1ZDI3NTMwYTUwMjE6YS0yMDM0NDY2",
            "api_key": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjIwMzQ0NjYsImlhdCI6MTc3MDMyNjcyOCwiZXhwIjoxODAxODYyNzI4LCJuYmYiOjE3NzAzMjY3MjgsImF1ZCI6IjoiLCJhY3QiOjM3NywianRpIjoiOTc5OWZkN2MzMmNhNTI1NmM3NzIxY2FkNzdkZDZiNTAifQ.XoPrAddcLyV5t2xWnhZ1sU0EVe9FJccCkZD_VtG35HA"
        }
        
        crm = BoldTrailCRM(credentials)
        leads = await crm.get_leads(limit=1000)
        
        # Calculate stats
        total = len(leads)
        active = sum(1 for l in leads if l.status and 'active' in l.status.lower())
        
        return {
            "success": True,
            "stats": {
                "total_leads": total,
                "active_leads": active,
                "new_today": 0,  # TODO: Filter by date
                "response_rate": 0  # TODO: Calculate from messages
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "stats": {
                "total_leads": 0,
                "active_leads": 0,
                "new_today": 0,
                "response_rate": 0
            }
        }
