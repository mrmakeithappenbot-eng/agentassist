"""
The Hunter - FSBO & Expired Listing Scraper
Automated lead generation from public sources
"""

import httpx
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from bs4 import BeautifulSoup
import asyncio

from app.core.config import settings

class FSBOLead:
    """Represents a For Sale By Owner lead"""
    
    def __init__(
        self,
        address: str,
        city: str,
        state: str,
        zip_code: str,
        price: Optional[int] = None,
        bedrooms: Optional[int] = None,
        bathrooms: Optional[float] = None,
        sqft: Optional[int] = None,
        owner_name: Optional[str] = None,
        owner_phone: Optional[str] = None,
        owner_email: Optional[str] = None,
        listing_url: Optional[str] = None,
        source: str = "Unknown",
        scraped_at: Optional[datetime] = None
    ):
        self.address = address
        self.city = city
        self.state = state
        self.zip_code = zip_code
        self.price = price
        self.bedrooms = bedrooms
        self.bathrooms = bathrooms
        self.sqft = sqft
        self.owner_name = owner_name
        self.owner_phone = owner_phone
        self.owner_email = owner_email
        self.listing_url = listing_url
        self.source = source
        self.scraped_at = scraped_at or datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "zip_code": self.zip_code,
            "price": self.price,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "sqft": self.sqft,
            "owner_name": self.owner_name,
            "owner_phone": self.owner_phone,
            "owner_email": self.owner_email,
            "listing_url": self.listing_url,
            "source": self.source,
            "scraped_at": self.scraped_at.isoformat()
        }
    
    def to_crm_lead_data(self) -> Dict[str, Any]:
        """Convert to format suitable for CRM.create_lead()"""
        # Split owner name if available
        first_name = None
        last_name = None
        if self.owner_name:
            parts = self.owner_name.split(maxsplit=1)
            first_name = parts[0] if len(parts) > 0 else None
            last_name = parts[1] if len(parts) > 1 else None
        
        return {
            "first_name": first_name,
            "last_name": last_name,
            "email": self.owner_email,
            "phone": self.owner_phone,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "zip": self.zip_code,
            "tags": ["FSBO", "The Hunter", self.source],
            "status": "New",
            "custom_fields": {
                "listing_price": self.price,
                "bedrooms": self.bedrooms,
                "bathrooms": self.bathrooms,
                "sqft": self.sqft,
                "listing_url": self.listing_url
            }
        }

class HunterScraper:
    """
    The Hunter - FSBO Lead Generation Engine
    
    Scrapes FSBO listings from multiple sources and enriches with contact info
    """
    
    def __init__(self):
        self.headers = {
            "User-Agent": settings.SCRAPER_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        }
    
    async def scrape_zillow_fsbo(self, zip_codes: List[str]) -> List[FSBOLead]:
        """
        Scrape FSBO listings from Zillow
        
        Note: Zillow has anti-scraping measures. This is a simplified implementation.
        Production should use rotating proxies and respect robots.txt.
        
        Args:
            zip_codes: List of ZIP codes to search
        
        Returns:
            List of FSBOLead objects
        """
        leads = []
        
        for zip_code in zip_codes:
            try:
                # Zillow FSBO search URL pattern
                # Note: Actual URL structure may vary
                url = f"https://www.zillow.com/homes/for_sale/fsbo/{zip_code}_rb/"
                
                async with httpx.AsyncClient(headers=self.headers, timeout=30.0) as client:
                    response = await client.get(url)
                    
                    if response.status_code != 200:
                        print(f"Zillow scrape failed for {zip_code}: HTTP {response.status_code}")
                        continue
                    
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Parse listing cards
                    # Note: Zillow's HTML structure changes frequently
                    # This is a placeholder - real implementation needs to adapt to current structure
                    listings = soup.find_all('article', class_=re.compile('list-card'))
                    
                    for listing in listings:
                        try:
                            lead = self._parse_zillow_listing(listing, zip_code)
                            if lead:
                                leads.append(lead)
                        except Exception as e:
                            print(f"Error parsing Zillow listing: {e}")
                            continue
                
                # Rate limiting - be respectful
                await asyncio.sleep(2)
                
            except Exception as e:
                print(f"Error scraping Zillow for {zip_code}: {e}")
                continue
        
        return leads
    
    def _parse_zillow_listing(self, listing_element, zip_code: str) -> Optional[FSBOLead]:
        """
        Parse a Zillow listing card into FSBOLead
        
        Note: This is a simplified parser. Real implementation needs to handle
        Zillow's complex DOM structure and dynamic content.
        """
        try:
            # Extract address
            address_elem = listing_element.find('address')
            if not address_elem:
                return None
            
            address_text = address_elem.get_text(strip=True)
            
            # Parse address components
            # Example: "123 Main St, Austin, TX 78701"
            parts = address_text.split(',')
            street = parts[0].strip() if len(parts) > 0 else ""
            city = parts[1].strip() if len(parts) > 1 else ""
            state_zip = parts[2].strip() if len(parts) > 2 else ""
            
            # Extract state and zip
            state = ""
            extracted_zip = zip_code
            if state_zip:
                state_zip_parts = state_zip.split()
                state = state_zip_parts[0] if len(state_zip_parts) > 0 else ""
                extracted_zip = state_zip_parts[1] if len(state_zip_parts) > 1 else zip_code
            
            # Extract price
            price = None
            price_elem = listing_element.find('span', class_=re.compile('price'))
            if price_elem:
                price_text = price_elem.get_text(strip=True)
                price = self._extract_price(price_text)
            
            # Extract beds/baths
            beds = None
            baths = None
            details_elem = listing_element.find('ul', class_=re.compile('list-card-details'))
            if details_elem:
                items = details_elem.find_all('li')
                for item in items:
                    text = item.get_text(strip=True).lower()
                    if 'bd' in text:
                        beds = self._extract_number(text)
                    elif 'ba' in text:
                        baths = self._extract_number(text)
            
            # Extract sqft
            sqft = None
            sqft_elem = listing_element.find('span', string=re.compile('sqft'))
            if sqft_elem:
                sqft_text = sqft_elem.get_text(strip=True)
                sqft = self._extract_number(sqft_text)
            
            # Extract listing URL
            link_elem = listing_element.find('a', href=True)
            listing_url = None
            if link_elem:
                href = link_elem['href']
                if href.startswith('/'):
                    listing_url = f"https://www.zillow.com{href}"
                else:
                    listing_url = href
            
            # Note: Zillow FSBO pages typically don't show owner contact info directly
            # This would require:
            # 1. Visiting individual listing pages
            # 2. Using Skip Trace API to find contact info
            # 3. County clerk records lookup
            
            return FSBOLead(
                address=street,
                city=city,
                state=state,
                zip_code=extracted_zip,
                price=price,
                bedrooms=beds,
                bathrooms=baths,
                sqft=sqft,
                listing_url=listing_url,
                source="Zillow FSBO"
            )
            
        except Exception as e:
            print(f"Error parsing Zillow listing: {e}")
            return None
    
    def _extract_price(self, price_text: str) -> Optional[int]:
        """Extract numeric price from text like '$450,000'"""
        try:
            # Remove non-numeric characters except digits
            numeric = re.sub(r'[^\d]', '', price_text)
            return int(numeric) if numeric else None
        except:
            return None
    
    def _extract_number(self, text: str) -> Optional[float]:
        """Extract first number from text"""
        try:
            match = re.search(r'[\d.]+', text)
            return float(match.group()) if match else None
        except:
            return None
    
    async def scrape_craigslist_fsbo(self, city: str, state: str) -> List[FSBOLead]:
        """
        Scrape FSBO listings from Craigslist
        
        Args:
            city: City name (e.g., "austin")
            state: State code (e.g., "tx")
        
        Returns:
            List of FSBOLead objects
        """
        leads = []
        
        try:
            # Craigslist subdomain pattern: {city}.craigslist.org
            # Real estate for sale by owner is in /reo/
            city_slug = city.lower().replace(' ', '')
            url = f"https://{city_slug}.craigslist.org/search/reo"
            
            async with httpx.AsyncClient(headers=self.headers, timeout=30.0) as client:
                response = await client.get(url)
                
                if response.status_code != 200:
                    print(f"Craigslist scrape failed: HTTP {response.status_code}")
                    return leads
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Craigslist uses result-info class for listings
                listings = soup.find_all('li', class_='result-row')
                
                for listing in listings:
                    try:
                        lead = self._parse_craigslist_listing(listing, city, state)
                        if lead:
                            leads.append(lead)
                    except Exception as e:
                        print(f"Error parsing Craigslist listing: {e}")
                        continue
            
        except Exception as e:
            print(f"Error scraping Craigslist: {e}")
        
        return leads
    
    def _parse_craigslist_listing(self, listing_element, city: str, state: str) -> Optional[FSBOLead]:
        """Parse a Craigslist listing"""
        try:
            # Extract title and URL
            title_elem = listing_element.find('a', class_='result-title')
            if not title_elem:
                return None
            
            title = title_elem.get_text(strip=True)
            listing_url = title_elem['href']
            
            # Extract price
            price = None
            price_elem = listing_element.find('span', class_='result-price')
            if price_elem:
                price_text = price_elem.get_text(strip=True)
                price = self._extract_price(price_text)
            
            # Extract neighborhood/location
            hood_elem = listing_element.find('span', class_='result-hood')
            neighborhood = hood_elem.get_text(strip=True).strip('()') if hood_elem else ""
            
            # Craigslist typically doesn't show full address in listings
            # Would need to visit individual listing page
            
            return FSBOLead(
                address=title,  # Title often contains address info
                city=city,
                state=state,
                zip_code="",  # Not available in list view
                price=price,
                listing_url=listing_url,
                source="Craigslist FSBO"
            )
            
        except Exception as e:
            print(f"Error parsing Craigslist listing: {e}")
            return None
    
    async def enrich_with_skip_trace(self, lead: FSBOLead) -> FSBOLead:
        """
        Enrich lead with contact info using Skip Trace API
        
        This is a placeholder for skip tracing integration.
        In production, integrate with services like:
        - BatchLeads
        - REIReply
        - PropStream
        - TLOxp
        
        Args:
            lead: FSBOLead with address info
        
        Returns:
            FSBOLead with enriched contact info
        """
        if not settings.SKIP_TRACE_API_KEY:
            print("Skip trace API key not configured")
            return lead
        
        try:
            # Placeholder - actual implementation depends on chosen skip trace provider
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    settings.SKIP_TRACE_API_URL,
                    headers={"Authorization": f"Bearer {settings.SKIP_TRACE_API_KEY}"},
                    json={
                        "address": lead.address,
                        "city": lead.city,
                        "state": lead.state,
                        "zip": lead.zip_code
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    # Enrich lead with found data
                    lead.owner_name = data.get("owner_name")
                    lead.owner_phone = data.get("phone")
                    lead.owner_email = data.get("email")
                
        except Exception as e:
            print(f"Skip trace enrichment failed: {e}")
        
        return lead
    
    async def generate_icebreaker_message(self, lead: FSBOLead) -> str:
        """
        Generate a personalized icebreaker message using AI
        
        Uses the cheaper scraper model for cost efficiency
        """
        # Simple template for now - can be enhanced with LLM
        message = (
            f"Hi! I noticed you're selling {lead.address} yourself. "
            f"I work with buyers in {lead.city} and wanted to reach out. "
            f"Would you be open to a buyer's agent bringing a qualified client to view the property?"
        )
        
        # TODO: Use OpenAI/Anthropic to generate more personalized messages
        # based on property details and market data
        
        return message

# Singleton instance
hunter_scraper = HunterScraper()
