import { z } from 'zod';

// Define Zod schema for each payload type
export const TextPayloadSchema = z.object({
    type: z.literal('text'),
    text: z.string(),
});

export const ImagePayloadSchema = z.object({
    type: z.literal('image'),
    title: z.string(),
    imageUrl: z.string().url(),
});

export const AudioPayloadSchema = z.object({
    type: z.literal('audio'),
    audioUrl: z.string().url(),
});

export const VideoPayloadSchema = z.object({
    type: z.literal('video'),
    title: z.string(),
    videoUrl: z.string().url(),
});

export const FilePayloadSchema = z.object({
    type: z.literal('file'),
    title: z.string(),
    fileUrl: z.string().url(),
});

export const CardPayloadSchema = z.object({
    type: z.literal('card'),
    title: z.string(),
    subtitle: z.string().optional(),
    imageUrl: z.string().url().optional(),
    actions: z.array(
        z.object({
            action: z.enum(['postback', 'url', 'say']),
            label: z.string(),
            value: z.string(),
        })
    ),
});

export const CarouselPayloadSchema = z.object({
    type: z.literal('carousel'),
    cards: z.array(CardPayloadSchema), // Array of card schemas
});

export const LocationPayloadSchema = z.object({
    type: z.literal('location'),
    latitude: z.number(),
    longitude: z.number(),
});

// Create a union type for all the payloads
export const PayloadSchema = z.union([
    TextPayloadSchema,
    ImagePayloadSchema,
    AudioPayloadSchema,
    VideoPayloadSchema,
    FilePayloadSchema,
    CardPayloadSchema,
    CarouselPayloadSchema,
    LocationPayloadSchema,
]);

// Type definition for Payload using Zod's infer
export type Payload = z.infer<typeof PayloadSchema>;

// Export type guards for each payload type
export function isTextPayload(payload: Payload): payload is z.infer<typeof TextPayloadSchema> {
    return payload.type === 'text';
}

export function isImagePayload(payload: Payload): payload is z.infer<typeof ImagePayloadSchema> {
    return payload.type === 'image';
}

export function isAudioPayload(payload: Payload): payload is z.infer<typeof AudioPayloadSchema> {
    return payload.type === 'audio';
}

export function isVideoPayload(payload: Payload): payload is z.infer<typeof VideoPayloadSchema> {
    return payload.type === 'video';
}

export function isFilePayload(payload: Payload): payload is z.infer<typeof FilePayloadSchema> {
    return payload.type === 'file';
}

export function isCardPayload(payload: Payload): payload is z.infer<typeof CardPayloadSchema> {
    return payload.type === 'card';
}

export function isCarouselPayload(payload: Payload): payload is z.infer<typeof CarouselPayloadSchema> {
    return payload.type === 'carousel';
}

export function isLocationPayload(payload: Payload): payload is z.infer<typeof LocationPayloadSchema> {
    return payload.type === 'location';
}
