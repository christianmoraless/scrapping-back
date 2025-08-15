export interface InstagramProfile {
    username: string;
    fullName: string;
    biography: string;
    followersCount: number;
    followsCount: number;
    postsCount: number;
    profilePicUrl: string;
    profilePicUrlHD: string;
    isBusinessAccount: boolean;
    businessCategoryName?: string;
    verified: boolean;
    externalUrl?: string;
}

export interface InstagramPost {
    id: string;
    caption?: string;
    imageUrl?: string;
    likesCount?: number;
    commentsCount?: number;
}

export interface InstagramVideo {
    id: string;
    title?: string;
    coverImageUrl?: string;
    viewsCount?: number;
}

export interface FullInstagramProfileResponse {
    profile: InstagramProfile;
    latestPosts?: InstagramPost[];
    latestVideos?: InstagramVideo[];
}