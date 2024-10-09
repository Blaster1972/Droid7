from django.core.management.base import BaseCommand
from droid.upsert import fetch_and_upsert_users  # Adjust the import if needed

class Command(BaseCommand):
    help = 'Fetch users from the external API and upsert them into the database'

    def handle(self, *args, **kwargs):
        try:
            self.stdout.write(self.style.NOTICE('Starting to fetch and upsert users...'))
            fetch_and_upsert_users()
            self.stdout.write(self.style.SUCCESS('Successfully fetched and upserted users!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {e}'))
