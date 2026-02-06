"""
Leads API Routes with Database
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
import csv
import io

from app.core.database import get_db
from app.models.leads import Lead

router = APIRouter()

class LeadCreate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = "New"
    tags: List[str] = []
    location: Optional[str] = None
    price_min: Optional[int] = None
    price_max: Optional[int] = None
    notes: Optional[str] = None

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

@router.post("/create")
async def create_lead(lead: LeadCreate, db: Session = Depends(get_db)):
    """
    Create a single lead manually
    """
    try:
        # Validate at least one contact method
        if not lead.email and not lead.phone and not lead.first_name:
            raise HTTPException(
                status_code=400, 
                detail="Must provide at least first name, email, or phone"
            )
        
        # Create lead in database
        db_lead = Lead(
            first_name=lead.first_name,
            last_name=lead.last_name,
            email=lead.email,
            phone=lead.phone,
            status=lead.status or 'New',
            tags=lead.tags or [],
            location=lead.location,
            price_min=lead.price_min,
            price_max=lead.price_max,
            notes=lead.notes,
            imported_from='Manual'
        )
        db.add(db_lead)
        db.commit()
        db.refresh(db_lead)
        
        return {
            "success": True,
            "message": "Lead created successfully",
            "lead": LeadResponse(
                id=str(db_lead.id),
                first_name=db_lead.first_name,
                last_name=db_lead.last_name,
                email=db_lead.email,
                phone=db_lead.phone,
                status=db_lead.status,
                tags=db_lead.tags or [],
                location=db_lead.location,
                price_range_min=db_lead.price_min,
                price_range_max=db_lead.price_max
            )
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import")
async def import_leads_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Import leads from CSV file - Saves to database
    
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
                # Save to database
                db_lead = Lead(
                    first_name=lead_data.get('first_name'),
                    last_name=lead_data.get('last_name'),
                    email=lead_data.get('email'),
                    phone=lead_data.get('phone'),
                    status=lead_data.get('status', 'New'),
                    tags=lead_data.get('tags', []),
                    location=lead_data.get('location'),
                    price_min=lead_data.get('price_min'),
                    price_max=lead_data.get('price_max'),
                    notes=lead_data.get('notes'),
                    deal_type=lead_data.get('deal_type'),
                    source=lead_data.get('source'),
                    rating=lead_data.get('rating'),
                    business_type=lead_data.get('business_type'),
                    imported_from='CSV'
                )
                db.add(db_lead)
                leads_imported.append(lead_data)
        
        # Commit all leads to database
        if leads_imported:
            db.commit()
        
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
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Fetch leads from database
    """
    try:
        # Query database
        query = db.query(Lead)
        
        # Filter by status if provided
        if status:
            query = query.filter(Lead.status.ilike(f"%{status}%"))
        
        # Order by most recent first
        query = query.order_by(Lead.created_at.desc())
        
        # Limit results
        leads = query.limit(limit).all()
        
        # Convert to response format
        response_leads = []
        for lead in leads:
            response_leads.append(LeadResponse(
                id=str(lead.id),
                first_name=lead.first_name,
                last_name=lead.last_name,
                email=lead.email,
                phone=lead.phone,
                status=lead.status,
                tags=lead.tags or [],
                location=lead.location,
                price_range_min=lead.price_min,
                price_range_max=lead.price_max
            ))
        
        return {
            "success": True,
            "count": len(response_leads),
            "leads": response_leads
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_lead_stats(db: Session = Depends(get_db)):
    """
    Get lead statistics from database
    """
    try:
        # Count total leads
        total = db.query(Lead).count()
        
        # Count active leads
        active = db.query(Lead).filter(
            Lead.status.in_(['Active', 'New', 'active', 'new'])
        ).count()
        
        return {
            "success": True,
            "stats": {
                "total_leads": total,
                "active_leads": active,
                "new_today": 0,  # TODO: Filter by date
                "response_rate": 0
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
