import { z } from 'zod';

// Define Zod schema for each payload type
export const TextPayloadSchema = z.object({
    type: z.literal('text'),
    text: z.string(),
});

export const AudioPayloadSchema = z.object({
    type: z.literal('audio'),
    audioUrl: z.string().url(),
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

export const ChoicePayloadSchema = z.object({
    type: z.literal('choice'),
    text: z.string(),
    options: z.array(
        z.object({
            label: z.string(),
            value: z.string(),
        })
    ),
});

// Create a union type for all the payloads
export const PayloadSchema = z.union([
    TextPayloadSchema,
    AudioPayloadSchema,
    CardPayloadSchema,
    ChoicePayloadSchema,
]);

// Type definition for Payload using Zod's infer
export type Payload = z.infer<typeof PayloadSchema>;

// Export type guards for each payload type
export function isTextPayload(payload: Payload): payload is z.infer<typeof TextPayloadSchema> {
    return payload.type === 'text';
}

export function isAudioPayload(payload: Payload): payload is z.infer<typeof AudioPayloadSchema> {
    return payload.type === 'audio';
}

export function isCardPayload(payload: Payload): payload is z.infer<typeof CardPayloadSchema> {
    return payload.type === 'card';
}

export function isChoicePayload(payload: Payload): payload is z.infer<typeof ChoicePayloadSchema> {
    return payload.type === 'choice';
}
