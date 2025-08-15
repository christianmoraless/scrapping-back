export enum SocialMediaSource {
    INSTAGRAM = 'instagram',
    YOUTUBE = 'youtube',
    FACEBOOK = 'facebook',
    TIKTOK = 'tiktok',
    TWITTER = 'twitter'
}

export interface UnifiedPost {
    id: string;
    source: SocialMediaSource;
    url: string;
    content: string;
    likesCount: number;
    commentsCount: number;
    timestamp: Date;
    author: string;
    authorUrl?: string;
    thumbnailUrl?: string;
    extra?: {
        type?: string;
        duration?: string;
        viewCount?: number;
    };
    comments: UnifiedComment[];
}

export interface UnifiedComment {
    id: string;
    text: string;
    author: string;
    timestamp?: Date;
    timeText?: string;
    likesCount: number;
}