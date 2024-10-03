import axios from 'axios';
import { z } from 'zod';

const BOT_ID = '58b4e23e-6f7b-4f79-a937-6a10e6e67446'; // x-bot-id
const BOTPRESS_TOKEN = 'bp_pat_aXhFebEAEV7QUXVriDsoMnokqLpdVJ0VROcN';

// Define Zod schemas
const PlatformDataSchema = z.object({
  Platform: z.string().nullable().optional(),
  ID: z.string().nullable().optional(),
  Username: z.string().nullable().optional(),
  DisplayName: z.string().nullable().optional(),
  AvatarLink: z.string().nullable().optional(),
  SubscriberBadgeLink: z.string().nullable().optional(),
  RoleBadgeLink: z.string().nullable().optional(),
  SpecialtyBadgeLink: z.string().nullable().optional(),
  Roles: z.array(z.string()).nullable().optional(),
  AccountDate: z.string().nullable().optional(),
  FollowDate: z.string().nullable().optional(),
  SubscribeDate: z.string().nullable().optional(),
  SubscriberTier: z.number().nullable().optional(),
}).nullable().optional();

// Define the User Schema
const UserSchema = z.object({
  mixitupUserId: z.string().nullable(),
  userId: z.string().nullable(),
  notes: z.string().nullable(),
  customTitle: z.string().nullable(),
  lastUpdated: z.string().nullable(),
  lastActivity: z.string().nullable(),
  platformData: PlatformDataSchema.nullable(),
  currencyAmounts: z.record(z.string(), z.number()).nullable(),
  inventoryAmounts: z.record(z.string(), z.number()).nullable(),
  streamPassAmounts: z.record(z.string(), z.number()).nullable(),
  isSpecialtyExcluded: z.boolean().nullable(),
  onlineViewingMinutes: z.number().nullable(),
  platform: z.string().nullable(),
  username: z.string().nullable(),
  displayName: z.string().nullable(),
  avatarLink: z.string().nullable(),
  accountDate: z.string().nullable(),
  followDate: z.string().nullable(),
  subscribeDate: z.string().nullable(),
  subscriberTier: z.number().nullable(),
});

export async function upsertUser(mixitupUserId: string, endpointUrl: string) {
    try {
        console.log(`Fetching user data for mixitupUserId: ${mixitupUserId}`);

        // Fetch user data from MixItUp
        const response = await axios.get(`${endpointUrl}/api/v2/users/${mixitupUserId}`);
        const userData = response.data;

        console.log('Fetched User Data:', userData);

        // Extract the first platform data
        const platformKeys = Object.keys(userData.User.PlatformData || {});
        const firstPlatformKey = platformKeys.length > 0 ? platformKeys[0] : null;
        const firstPlatformData = firstPlatformKey ? userData.User.PlatformData[firstPlatformKey] : null;

        // Map the user data to match the table schema
        const mappedUserData = {
            mixitupUserId: userData.User.ID,
            userId: userData.User.ID,
            lastActivity: userData.User.LastActivity ? new Date(userData.User.LastActivity).toISOString() : null,
            lastUpdated: userData.User.LastUpdated ? new Date(userData.User.LastUpdated).toISOString() : null,
            onlineViewingMinutes: userData.User.OnlineViewingMinutes,
            currencyAmounts: userData.User.CurrencyAmounts,
            inventoryAmounts: userData.User.InventoryAmounts,
            streamPassAmounts: userData.User.StreamPassAmounts,
            customTitle: userData.User.CustomTitle,
            isSpecialtyExcluded: userData.User.IsSpecialtyExcluded,
            notes: userData.User.Notes,
            platformData: firstPlatformData, // Include first platform data here

            // Initialize additional fields to null
            platform: firstPlatformData?.Platform || null,
            username: firstPlatformData?.Username || null,
            displayName: firstPlatformData?.DisplayName || null,
            avatarLink: firstPlatformData?.AvatarLink || null,
            accountDate: firstPlatformData?.AccountDate || null,
            followDate: firstPlatformData?.FollowDate || null,
            subscribeDate: firstPlatformData?.SubscribeDate || null,
            subscriberTier: firstPlatformData?.SubscriberTier || null,
        };

        console.log('Mapped User Data:', JSON.stringify(mappedUserData, null, 2));

        // Validate the mappedUserData against UserSchema
        UserSchema.parse(mappedUserData); // This will throw if validation fails

        // Upsert to Botpress using the mappedUserData with mixitupUserId as key
        const upsertResponse = await axios.post(
            'https://api.botpress.cloud/v1/tables/UserTable/rows/upsert',
            {
                rows: [mappedUserData],
                keyColumn: 'mixitupUserId',
            },
            {
                headers: {
                    'Authorization': `Bearer ${BOTPRESS_TOKEN}`,
                    'x-bot-id': BOT_ID,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('User data upserted successfully:', upsertResponse.data);

        // Return a structured response
        return { success: true, data: mappedUserData };
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            console.error('Validation Error:', error.errors);
            return { success: false, message: 'Validation error occurred', details: error.errors };
        } else if (error instanceof Error) {
            console.error('Error fetching or upserting user data:', error.message);
            return { success: false, message: error.message };
        } else {
            console.error('An unknown error occurred while fetching or upserting user data');
            return { success: false, message: 'Unknown error occurred' };
        }
    }
}
