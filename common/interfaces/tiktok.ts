export interface SimplifiedTikTokPost {
    id: string;
    text: string;
    createTimeISO: Date;
    isAd: boolean;
    author: {
        id: string;
        nickname: string;
        verified: boolean;
        followers: number;
        following: number;
    };
    metrics: {
        likes: number;
        shares: number;
        plays: number;
        saves: number;
        comments: number;
    };
    music?: {
        name: string;
        author: string;
        isOriginal: boolean;
    };
    video: {
        url: string;
        duration: number;
        thumbnail: string;
        resolution: string;
    };
    hashtags: string[];
    mentions: string[];
    webUrl: string;
}

export interface SimplifiedTikTokComment {
    id: string;
    videoId: string;
    text: string;
    createTimeISO: Date;
    likes: number;
    author: {
        id: string;
        nickname: string;
        avatar: string;
    };
    isPinned: boolean;
    isLikedByAuthor: boolean;
    replyCount: number;
}

export interface TikTokVideoWithComments {
    video: SimplifiedTikTokPost;
    comments: SimplifiedTikTokComment[];
}

// tiktok.interfaces.ts
export interface Post {
    id: string;
    text: string;
    createTimeISO: Date;
    isAd: boolean;
    author: Author;
    metrics: Metrics;
    music?: Music;
    video: Video;
    hashtags: string[];
    mentions: string[];
    webUrl: string;
    comments: Comment[];
}

export interface Author {
    id?: string;
    nickname?: string;
    verified?: boolean;
    followers?: number;
    following?: number;
}

export interface Metrics {
    likes?: number;
    shares?: number;
    plays?: number;
    saves?: number;
    comments?: number;
}

export interface Music {
    name?: string;
    author?: string;
    isOriginal?: boolean;
}

export interface Video {
    url?: string;
    duration?: number;
    thumbnail?: string;
    resolution?: string;
    subtitles?: Subtitle[];
}

export interface Subtitle {
    language: string;
    sourceType: string;
}

export interface Comment {
    id?: string;
    text?: string;
    createTimeISO?: Date;
    likes?: number;
    author?: CommentAuthor;
    isPinned?: boolean;
    isLikedByAuthor?: boolean;
    replyCount?: number;
}

export interface CommentAuthor {
    id: string;
    nickname: string;
    avatar: string;
}