import os
import django
import logging
from django.utils import timezone  # Import timezone from Django
import requests
from pydantic import BaseModel, Field, ValidationError
from typing import Optional, Dict, List

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Set the environment variable for Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'droid7.settings')
django.setup()  # Initialize Django

# Now import your User model and other necessary modules
from .models import User  # Import your User model from the models.py file

# Define your User schema using Pydantic
class PlatformData(BaseModel):
    Platform: Optional[str]
    ID: Optional[str]
    Username: Optional[str]
    DisplayName: Optional[str]
    AvatarLink: Optional[str]
    SubscriberBadgeLink: Optional[str]
    RoleBadgeLink: Optional[str]
    SpecialtyBadgeLink: Optional[str]
    Roles: Optional[List[str]]
    AccountDate: Optional[str]
    FollowDate: Optional[str]
    SubscribeDate: Optional[str]
    SubscriberTier: Optional[int]

class UserSchema(BaseModel):
    mixitup_user_id: Optional[str]
    notes: Optional[str]
    custom_title: Optional[str]
    last_updated: Optional[str]
    last_activity: Optional[str]
    currency_amounts: Optional[Dict[str, float]]
    inventory_amounts: Optional[Dict[str, float]]
    stream_pass_amounts: Optional[Dict[str, float]]
    is_specialty_excluded: Optional[bool]
    online_viewing_minutes: Optional[int]
    platform_data: Optional[PlatformData]
    platform: Optional[str]
    username: Optional[str]
    display_name: Optional[str]
    avatar_link: Optional[str]
    account_date: Optional[str]
    follow_date: Optional[str]
    subscribe_date: Optional[str]
    subscriber_tier: Optional[int]

# Base URL for the Mixitup API
MIXITUP_BASE_URL = 'https://duckling-mighty-rhino.ngrok-free.app'
ENDPOINT_URL = f'{MIXITUP_BASE_URL}/mixitup/api/v2/users'

# Function to fetch users from external API
def fetch_all_users() -> List[UserSchema]:
    try:
        response = requests.get(ENDPOINT_URL)
        response.raise_for_status()
        
        user_data = response.json().get('Users', [])
        users = []
        
        for user in user_data:
            platform_data = user.get('PlatformData', {}).get('Twitch', {})
            user_dict = {
                'mixitup_user_id': user.get('ID'),
                'notes': user.get('Notes'),
                'custom_title': user.get('CustomTitle'),
                'last_updated': user.get('LastUpdated'),
                'last_activity': user.get('LastActivity'),
                'currency_amounts': user.get('CurrencyAmounts', {}),
                'inventory_amounts': user.get('InventoryAmounts', {}),
                'stream_pass_amounts': user.get('StreamPassAmounts', {}),
                'is_specialty_excluded': user.get('IsSpecialtyExcluded'),
                'online_viewing_minutes': user.get('OnlineViewingMinutes'),
                'platform_data': platform_data,
                'platform': platform_data.get('Platform'),
                'username': platform_data.get('Username'),
                'display_name': platform_data.get('DisplayName'),
                'avatar_link': platform_data.get('AvatarLink'),
                'account_date': platform_data.get('AccountDate'),
                'follow_date': platform_data.get('FollowDate'),
                'subscribe_date': platform_data.get('SubscribeDate'),
                'subscriber_tier': platform_data.get('SubscriberTier')
            }
            try:
                user_schema = UserSchema(**user_dict)
                users.append(user_schema)
            except ValidationError as ve:
                logging.error(f"Validation error for user {user_dict}: {ve}")

        logging.info(f"Fetched {len(users)} users.")
        return users
    except requests.RequestException as e:
        logging.error(f"Error fetching users: {e}")
        return []

def upsert_user(user_data: UserSchema):
    mixitup_user_id = user_data.mixitup_user_id  # Accessing Pydantic field, no need to use get()

    # Check if the user already exists, update or create a new user
    user, created = User.objects.update_or_create(
        mixitup_user_id=mixitup_user_id,
        defaults={
            'platform_data': user_data.platform_data.dict() if user_data.platform_data else None,  # Ensure platform_data is converted to dict
            'online_viewing_minutes': user_data.online_viewing_minutes,
            'username': user_data.username,
            'display_name': user_data.display_name,
            'notes': user_data.notes,
            'avatar_link': user_data.avatar_link,
            'account_date': user_data.account_date,
            'follow_date': user_data.follow_date,
            'subscribe_date': user_data.subscribe_date,
            'subscriber_tier': user_data.subscriber_tier,
            'last_updated': timezone.now(),
            'last_activity': user_data.last_activity,
            'custom_title': user_data.custom_title,
            'currency_amounts': user_data.currency_amounts,
            'inventory_amounts': user_data.inventory_amounts,
            'stream_pass_amounts': user_data.stream_pass_amounts,
            'is_specialty_excluded': user_data.is_specialty_excluded or False,
        }
    )

    action = 'Created' if created else 'Updated'
    logging.info(f"{action} user with mixitup_user_id: {mixitup_user_id}")

    return user, created

def fetch_and_upsert_users():
    users = fetch_all_users()
    logging.info(f"Upserting {len(users)} users into the database.")
    for user in users:
        upsert_user(user)  # Implement the upsert logic for the User model

if __name__ == "__main__":
    fetch_and_upsert_users()
