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
from app.storage import leads_storage

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
            
            # Map phone - try multiple phone fields
            phone_fields = ['cell phone 1', 'cell_phone_1', 'work phone', 'work_phone', 
                          'home phone', 'home_phone', 'cell phone', 'mobile', 'phone']
            for key in row.keys():
                key_lower = key.lower().replace(' ', '_')
                if key_lower in phone_fields or 'phone' in key_lower or 'mobile' in key_lower or 'cell' in key_lower:
                    if row[key].strip():  # Only use if not empty
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
            
            # Map notes
            for key in row.keys():
                key_lower = key.lower()
                if 'note' in key_lower or 'comment' in key_lower or 'description' in key_lower:
                    lead_data['notes'] = row[key]
                    break
            
            # Map additional BoldTrail fields
            for key in row.keys():
                key_lower = key.lower().replace(' ', '_')
                if 'deal_type' in key_lower or 'dealtype' in key_lower:
                    lead_data['deal_type'] = row[key]
                elif 'source' in key_lower and 'agent' not in key_lower:
                    lead_data['source'] = row[key]
                elif 'rating' in key_lower:
                    lead_data['rating'] = row[key]
                elif 'business_type' in key_lower or 'businesstype' in key_lower:
                    lead_data['business_type'] = row[key]
            
            # Set defaults
            if 'status' not in lead_data:
                lead_data['status'] = 'New'
            if 'tags' not in lead_data:
                lead_data['tags'] = []
            
            # Only import if we have at least name or email
            if lead_data.get('first_name') or lead_data.get('email'):
                leads_imported.append(lead_data)
        
        # Save imported leads to storage
        if leads_imported:
            leads_storage.add_leads(leads_imported)
        
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
    Fetch leads - returns imported leads from storage
    """
    try:
        # Get leads from in-memory storage
        all_leads = leads_storage.get_all_leads()
        
        # Filter by status if provided
        if status:
            filtered_leads = [l for l in all_leads if l.get('status', '').lower() == status.lower()]
        else:
            filtered_leads = all_leads
        
        # Limit results
        limited_leads = filtered_leads[:limit]
        
        # Convert to response format
        response_leads = []
        for lead in limited_leads:
            response_leads.append(LeadResponse(
                id=lead.get('id', 'unknown'),
                first_name=lead.get('first_name'),
                last_name=lead.get('last_name'),
                email=lead.get('email'),
                phone=lead.get('phone'),
                status=lead.get('status'),
                tags=lead.get('tags', []),
                location=lead.get('location'),
                price_range_min=lead.get('price_min'),
                price_range_max=lead.get('price_max')
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
    Get lead statistics from imported leads
    """
    try:
        stats = leads_storage.get_stats()
        
        return {
            "success": True,
            "stats": stats
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
