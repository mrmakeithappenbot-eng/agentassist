"""
Google Calendar Integration
Two-way sync for team tasks and personal calendar
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import httpx

class GoogleCalendarIntegration:
    """
    Google Calendar API integration for AgentAssist
    
    Features:
    - OAuth 2.0 authentication
    - Create events for team tasks
    - Two-way sync (Google Calendar ↔ AgentAssist)
    - Webhook notifications for event responses
    """
    
    SCOPES = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
    ]
    
    def __init__(self, access_token: str, refresh_token: Optional[str] = None):
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.base_url = "https://www.googleapis.com/calendar/v3"
    
    async def create_event(
        self,
        calendar_id: str,
        title: str,
        description: str,
        start_time: datetime,
        end_time: datetime,
        attendees: List[str] = [],
        send_notifications: bool = True
    ) -> Dict[str, Any]:
        """
        Create a calendar event
        
        Returns:
            Event object with event_id
        """
        try:
            async with httpx.AsyncClient() as client:
                event = {
                    'summary': title,
                    'description': description,
                    'start': {
                        'dateTime': start_time.isoformat(),
                        'timeZone': 'America/Los_Angeles',
                    },
                    'end': {
                        'dateTime': end_time.isoformat(),
                        'timeZone': 'America/Los_Angeles',
                    },
                    'attendees': [{'email': email} for email in attendees],
                    'reminders': {
                        'useDefault': False,
                        'overrides': [
                            {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                            {'method': 'popup', 'minutes': 30},  # 30 min before
                        ],
                    },
                    'guestsCanModify': False,
                    'guestsCanInviteOthers': False,
                    'guestsCanSeeOtherGuests': True,
                }
                
                response = await client.post(
                    f"{self.base_url}/calendars/{calendar_id}/events",
                    json=event,
                    headers={
                        'Authorization': f'Bearer {self.access_token}',
                        'Content-Type': 'application/json'
                    },
                    params={'sendUpdates': 'all' if send_notifications else 'none'}
                )
                
                if response.status_code == 200:
                    return {
                        'success': True,
                        'event': response.json()
                    }
                else:
                    return {
                        'success': False,
                        'error': response.text
                    }
                    
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def update_event(
        self,
        calendar_id: str,
        event_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update an existing calendar event
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.base_url}/calendars/{calendar_id}/events/{event_id}",
                    json=updates,
                    headers={
                        'Authorization': f'Bearer {self.access_token}',
                        'Content-Type': 'application/json'
                    }
                )
                
                return {
                    'success': response.status_code == 200,
                    'event': response.json() if response.status_code == 200 else None
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def delete_event(
        self,
        calendar_id: str,
        event_id: str
    ) -> bool:
        """
        Delete a calendar event
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.base_url}/calendars/{calendar_id}/events/{event_id}",
                    headers={'Authorization': f'Bearer {self.access_token}'}
                )
                
                return response.status_code == 204
                
        except Exception as e:
            print(f"Error deleting event: {e}")
            return False
    
    async def get_events(
        self,
        calendar_id: str,
        time_min: datetime,
        time_max: datetime
    ) -> List[Dict[str, Any]]:
        """
        Get events in a date range
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/calendars/{calendar_id}/events",
                    headers={'Authorization': f'Bearer {self.access_token}'},
                    params={
                        'timeMin': time_min.isoformat() + 'Z',
                        'timeMax': time_max.isoformat() + 'Z',
                        'singleEvents': True,
                        'orderBy': 'startTime'
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get('items', [])
                else:
                    return []
                    
        except Exception as e:
            print(f"Error fetching events: {e}")
            return []
    
    async def get_attendee_status(
        self,
        calendar_id: str,
        event_id: str
    ) -> Dict[str, str]:
        """
        Get acceptance status for all attendees
        
        Returns:
            Dict mapping email -> status (accepted, declined, tentative, needsAction)
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/calendars/{calendar_id}/events/{event_id}",
                    headers={'Authorization': f'Bearer {self.access_token}'}
                )
                
                if response.status_code == 200:
                    event = response.json()
                    attendees = event.get('attendees', [])
                    
                    return {
                        attendee['email']: attendee.get('responseStatus', 'needsAction')
                        for attendee in attendees
                    }
                else:
                    return {}
                    
        except Exception as e:
            print(f"Error getting attendee status: {e}")
            return {}
    
    @staticmethod
    def get_oauth_url(client_id: str, redirect_uri: str) -> str:
        """
        Get OAuth authorization URL
        """
        scopes = '+'.join(GoogleCalendarIntegration.SCOPES)
        return (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope={scopes}&"
            f"access_type=offline&"
            f"prompt=consent"
        )
    
    @staticmethod
    async def exchange_code_for_tokens(
        code: str,
        client_id: str,
        client_secret: str,
        redirect_uri: str
    ) -> Dict[str, Any]:
        """
        Exchange authorization code for access and refresh tokens
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        'code': code,
                        'client_id': client_id,
                        'client_secret': client_secret,
                        'redirect_uri': redirect_uri,
                        'grant_type': 'authorization_code'
                    }
                )
                
                return response.json()
                
        except Exception as e:
            return {'error': str(e)}
