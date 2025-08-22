import { Injectable } from '@nestjs/common';
import { ApifyClient } from 'apify-client';
import { SocialMediaSource, UnifiedPost } from '../../common/interfaces/UnifiedPostsComments';
import { InstagramPost } from 'common/interfaces';
import { SimplifiedTikTokComment, SimplifiedTikTokPost } from 'common/interfaces/tiktok';
import * as _ from 'lodash';

interface UnifiedProfile {
  platform: string;
  username: string;
  displayName: string;
  description: string;
  followers: number;
  following: number;
  posts: number;
  likes: number;
  verified: boolean;
  profilePicture: string;
  profileUrl: string;
  additionalInfo?: any;
}

interface UnifiedMetrics {
  totalFollowers: number;
  totalLikes: number;
  totalPosts: number;
  totalFollowing: number;
  verifiedAccounts: number;
  platformsCount: number;
  averageEngagement: number;
}

export interface ProfilesResponse {
  unified: UnifiedProfile[];
  metrics: UnifiedMetrics;
  byPlatform: {
    instagram?: any;
    facebook?: any;
    tiktok?: any;
    youtube?: any;
    twitter?: any;
  };
}

interface SimplifiedInstagramPost {
  id: string;
  shortCode: string;
  type: string;
  caption: string;
  url: string;
  commentsCount: number;
  likesCount: number;
  timestamp: string;
  ownerUsername: string;
  displayUrl?: string;
  videoUrl?: string;
  videoViewCount?: number;
  musicInfo?: {
    artist_name: string;
    song_name: string;
  };
}

interface SimplifiedComment {
  id: string;
  text: string;
  ownerUsername: string;
  timestamp: string;
  likesCount: number;
  repliesCount: number;
}


function simplifyPost(post: any): any {
  return {
    id: post.id,
    shortCode: post.shortCode,
    type: post.type,
    caption: post.caption,
    url: post.url,
    commentsCount: post.commentsCount,
    likesCount: post.likesCount,
    timestamp: post.timestamp,
    ownerUsername: post.ownerUsername,
  };
}

function processComments(rawComments: any[]): Record<string, SimplifiedComment[]> {
  const commentsByPostId: Record<string, SimplifiedComment[]> = {};

  rawComments.forEach(comment => {
    const postId = this.extractPostIdFromComment(comment);
    if (!postId) return;

    if (!commentsByPostId[postId]) {
      commentsByPostId[postId] = [];
    }

    commentsByPostId[postId].push({
      id: comment.id,
      text: comment.text,
      ownerUsername: comment.ownerUsername,
      timestamp: comment.timestamp,
      likesCount: comment.likesCount || 0,
      repliesCount: 0
    });
  });

  return commentsByPostId;
}

const extractFacebookPostId = (url: string): string | null => {
  if (!url) return null;

  try {
    // Extraer el ID de diferentes patrones de URL de Facebook
    const patterns = [
      /\/posts\/(pfbid[^\/]+)/, // Nuevo formato con pfbid
      /\/posts\/([^\/]+)/,       // Formato tradicional
      /\/photos\/([^\/]+)/,      // Fotos
      /\/videos\/([^\/]+)/       // Videos
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }

    // Si no coincide con ningún patrón, usar el último segmento
    const cleanUrl = url.split('?')[0]; // Eliminar parámetros
    const segments = cleanUrl.split('/').filter(Boolean);
    return segments.pop() || null;
  } catch (e) {
    console.error('Error extracting Facebook post ID:', e);
    return null;
  }
};


// Interfaces actualizadas para Facebook
export interface SimplifiedFacebookPost {
  id: string;
  text: string;
  time: Date;
  user: {
    id: string;
    name: string;
    profileUrl: string;
  };
  likes: number;
  commentsCount?: number;
  shares: number;
  url: string;
  isVideo?: boolean;
  viewsCount?: number;
  thumbnailUrl?: string;
}

export interface SimplifiedFacebookComment {
  id?: string; // Puede ser opcional si no viene en los datos
  postId: string;
  text: string;
  likes: number;
  author?: {
    name?: string;
  };
  facebookUrl: string;
}

export interface FacebookPostWithComments {
  post: SimplifiedFacebookPost;
  comments: SimplifiedFacebookComment[];
}

interface TwitterTweet {
  id: string;
  url: string;
  verified: boolean;
  username: string;
  fullname: string;
  avatar: string;
  timestamp: string;
  text: string;
  links?: string[];
  images?: string[];
  isQuote: boolean;
  isRetweet: boolean;
  isReply: boolean;
  replyingTo?: string[];
  likes: number;
  replies: number;
  retweets: number;
  quotes: number;
  searchQuery: string;
  tweetUserId?: string;
}

export interface TwitterTweetWithReplies extends TwitterTweet {
  repliesData?: TwitterTweet[];
}

export interface EnrichedTweet extends TwitterTweet {
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore?: number;
  keywords?: string[];
  language?: string;
  engagementRate?: number;
  repliesData?: EnrichedTweet[];
}

interface ProcessingConfig {
  relevanceThreshold: number;
  minEngagement: number;
  brandKeywords: string[];
  excludeWords: string[];
  sentimentAnalysis: boolean;
  languageFilter?: string[];
  maxTweets?: number;
}

const config = {
  relevanceThreshold: 0.7, // Solo tweets muy relevantes
  minEngagement: 5, // Mínimo engagement para considerar
  brandKeywords: ['notco', 'not co', 'plant based', 'proteína vegetal'],
  excludeWords: ['spam', 'bot', 'fake'],
  maxTweets: 50 // Limitar resultados
};
@Injectable()
export class ScrapperService {
  private apifyClient: ApifyClient;

  private readonly DATASETS = {
    INSTAGRAM: 'gjkeBGTOVEBlflX5M',
    FACEBOOK: 'tV1Wp5R4OOxrjvbBR',
    TIKTOK: 'pvH1ClJb9mzmKA8BB',
    YOUTUBE: 'AQtowJadIbhbg3D5O',
    TWITTER: 'EqtVzraqFvClGSygS',
    //* INSTAGRAM 
    INSTAGRAM_POSTS: 'rWaDvIHOtBgthcXdV',
    INSTAGRAM_COMMENTS: 'wqhoPL96OvzYSCDpa',
    //* FACEBOOK 
    FACEBOOK_POSTS: 'e4PQ99lfcJWJHY3EF',
    FACEBOOK_COMMENTS: 'RWvVc2zNsZrjCQ4Io',
    //* YOUTUBE 
    YOUTUBE_VIDEOS: '18IeUuuYUnas5afmO',
    YOUTUBE_COMMENTS: 'IXNdVX6NTJQZYsHrj',
    //* TIKTOK 
    TIKTOK_VIDEOS: 'nAuHvWg3ojFCfagaJ',
    TIKTOK_COMMENTS: 'x5BXWbJPgTDD3KAZm',
    //* Twiiter 
    TWITTER_TWEETS: 'u1Ye5ngb6TYYTp8Dm'
  };

  constructor() {
    this.apifyClient = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });
  }

  public async getProfilesInfo(): Promise<ProfilesResponse> {
    try {
      const [instagram, facebook, tiktok, youtube, twitter] = await Promise.allSettled([
        this.getInstagramProfile(),
        this.getFacebookProfile(),
        this.getTiktokProfile(),
        this.getYoutubeProfile(),
        this.getTwitterProfile()
      ]);

      const profiles = this.processProfileData({
        instagram: instagram.status === 'fulfilled' ? instagram.value : null,
        facebook: facebook.status === 'fulfilled' ? facebook.value : null,
        tiktok: tiktok.status === 'fulfilled' ? tiktok.value : null,
        youtube: youtube.status === 'fulfilled' ? youtube.value : null,
        twitter: twitter.status === 'fulfilled' ? twitter.value : null
      });

      return profiles;
    } catch (error) {
      console.error('Error al obtener perfiles:', error);
      throw new Error('Error al obtener información de perfiles');
    }
  }

  processProfileData(rawData: any): ProfilesResponse {
    const unified: UnifiedProfile[] = [];
    const byPlatform: any = {};

    // Procesar Instagram
    if (rawData.instagram) {
      byPlatform.instagram = rawData.instagram;
      unified.push({
        platform: 'instagram',
        username: rawData.instagram.username,
        displayName: rawData.instagram.fullName,
        description: rawData.instagram.biography,
        followers: rawData.instagram.followersCount,
        following: rawData.instagram.followsCount,
        posts: rawData.instagram.postsCount,
        likes: 0, // Instagram no proporciona likes totales
        verified: rawData.instagram.verified,
        profilePicture: rawData.instagram.profilePicUrl,
        profileUrl: `https://instagram.com/${rawData.instagram.username}`,
        additionalInfo: {
          businessAccount: rawData.instagram.isBusinessAccount,
          businessCategory: rawData.instagram.businessCategoryName,
          externalUrl: rawData.instagram.externalUrl
        }
      });
    }

    // Procesar Facebook
    if (rawData.facebook) {
      byPlatform.facebook = rawData.facebook;
      unified.push({
        platform: 'facebook',
        username: rawData.facebook.title,
        displayName: rawData.facebook.title,
        description: rawData.facebook.intro,
        followers: rawData.facebook.followers,
        following: 0, // Facebook no proporciona following
        posts: 0, // No disponible en los datos actuales
        likes: rawData.facebook.likes,
        verified: false, // No disponible en los datos actuales
        profilePicture: rawData.facebook.profilePictureUrl,
        profileUrl: rawData.facebook.pageUrl,
        additionalInfo: {
          email: rawData.facebook.email,
          website: rawData.facebook.website,
          categories: rawData.facebook.categories,
          creationDate: rawData.facebook.creation_date
        }
      });
    }

    // Procesar TikTok
    if (rawData.tiktok) {
      byPlatform.tiktok = rawData.tiktok;
      unified.push({
        platform: 'tiktok',
        username: rawData.tiktok.username,
        displayName: rawData.tiktok.nickname,
        description: rawData.tiktok.bio,
        followers: rawData.tiktok.followers,
        following: 0, // No disponible en los datos actuales
        posts: rawData.tiktok.videos,
        likes: rawData.tiktok.likes,
        verified: rawData.tiktok.verified,
        profilePicture: rawData.tiktok.avatar,
        profileUrl: rawData.tiktok.profileUrl,
        additionalInfo: {
          website: rawData.tiktok.website,
          category: rawData.tiktok.category
        }
      });
    }

    // Procesar YouTube
    if (rawData.youtube) {
      byPlatform.youtube = rawData.youtube;
      unified.push({
        platform: 'youtube',
        username: rawData.youtube.channelName,
        displayName: rawData.youtube.channelName,
        description: rawData.youtube.channelDescription,
        followers: rawData.youtube.subscribersCount,
        following: 0, // YouTube no tiene following
        posts: rawData.youtube.totalVideos,
        likes: 0, // No disponible a nivel de canal
        verified: rawData.youtube.isVerified,
        profilePicture: rawData.youtube.channelAvatarUrl,
        profileUrl: rawData.youtube.channelUrl,
        additionalInfo: {
          totalViews: rawData.youtube.totalViews,
          joinDate: rawData.youtube.joinDate,
          socialLinks: rawData.youtube.socialLinks
        }
      });
    }

    // Procesar Twitter
    if (rawData.twitter) {
      byPlatform.twitter = rawData.twitter;
      unified.push({
        platform: 'twitter',
        username: rawData.twitter.userName,
        displayName: rawData.twitter.name,
        description: rawData.twitter.description,
        followers: rawData.twitter.followers,
        following: rawData.twitter.following,
        posts: rawData.twitter.tweetsCount,
        likes: 0, // No disponible a nivel de perfil
        verified: rawData.twitter.isVerified,
        profilePicture: rawData.twitter.profilePicture,
        profileUrl: rawData.twitter.profileUrl,
        additionalInfo: {
          createdAt: rawData.twitter.createdAt,
          coverPicture: rawData.twitter.coverPicture
        }
      });
    }

    // Calcular métricas unificadas
    const metrics = this.calculateUnifiedMetrics(unified);

    return {
      unified,
      metrics,
      byPlatform
    };
  }

  calculateUnifiedMetrics(profiles: UnifiedProfile[]): UnifiedMetrics {
    const totalFollowers = profiles.reduce((sum, profile) => sum + profile.followers, 0);
    const totalLikes = profiles.reduce((sum, profile) => sum + profile.likes, 0);
    const totalPosts = profiles.reduce((sum, profile) => sum + profile.posts, 0);
    const totalFollowing = profiles.reduce((sum, profile) => sum + profile.following, 0);
    const verifiedAccounts = profiles.filter(profile => profile.verified).length;
    const platformsCount = profiles.length;

    // Calcular engagement promedio (seguidores/posts como métrica básica)
    const averageEngagement = totalPosts > 0 ? totalFollowers / totalPosts : 0;

    return {
      totalFollowers,
      totalLikes,
      totalPosts,
      totalFollowing,
      verifiedAccounts,
      platformsCount,
      averageEngagement: Math.round(averageEngagement * 100) / 100
    };
  }

  // Métodos privados para obtener datos de cada plataforma
  async getInstagramProfile() {
    try {
      const response = await this.apifyClient.dataset(this.DATASETS.INSTAGRAM).listItems();
      return response.items?.[0];
    } catch (error) {
      console.error('Error al obtener perfil de Instagram:', error);
      throw error;
    }
  }

  async getFacebookProfile() {
    try {
      const response = await this.apifyClient.dataset(this.DATASETS.FACEBOOK).listItems();
      return response.items?.[0];
    } catch (error) {
      console.error('Error al obtener perfil de Facebook:', error);
      throw error;
    }
  }

  async getTiktokProfile() {
    try {
      const response = await this.apifyClient.dataset(this.DATASETS.TIKTOK).listItems();
      return response.items?.[0];
    } catch (error) {
      console.error('Error al obtener perfil de TikTok:', error);
      throw error;
    }
  }

  async getYoutubeProfile() {
    try {
      const response = await this.apifyClient.dataset(this.DATASETS.YOUTUBE).listItems();
      const channelData: any = response.items?.[0];

      if (!channelData) return null;

      const socialLinks = channelData.channelDescriptionLinks
        ?.filter(link => link.url && !link.url.includes('www.notco.com'))
        .map(link => ({
          platform: link.text,
          url: link.url
        })) || [];

      return {
        channelName: channelData.aboutChannelInfo.channelName,
        channelDescription: channelData.aboutChannelInfo.channelDescription,
        channelUrl: channelData.aboutChannelInfo.channelUrl,
        channelAvatarUrl: channelData.aboutChannelInfo.channelAvatarUrl,
        channelBannerUrl: channelData.aboutChannelInfo.channelBannerUrl,
        subscribersCount: channelData.aboutChannelInfo.numberOfSubscribers,
        totalViews: channelData.aboutChannelInfo.channelTotalViews,
        totalVideos: channelData.aboutChannelInfo.channelTotalVideos,
        isVerified: channelData.aboutChannelInfo.isChannelVerified,
        joinDate: channelData.aboutChannelInfo.channelJoinedDate,
        socialLinks
      };
    } catch (error) {
      console.error('Error al obtener perfil de YouTube:', error);
      throw error;
    }
  }

  async getTwitterProfile() {
    try {
      const response = await this.apifyClient.dataset(this.DATASETS.TWITTER).listItems();

      const twitterProfile = response.items?.find(item =>
        item.type === 'user' && item.userName === 'notcous'
      );

      if (!twitterProfile) return null;

      return {
        userName: twitterProfile.userName,
        name: twitterProfile.name,
        description: twitterProfile.description,
        followers: twitterProfile.followers,
        following: twitterProfile.following,
        tweetsCount: twitterProfile.statusesCount,
        createdAt: twitterProfile.createdAt,
        isVerified: twitterProfile.isVerified,
        profilePicture: twitterProfile.profilePicture,
        coverPicture: twitterProfile.coverPicture,
        profileUrl: twitterProfile.twitterUrl
      };
    } catch (error) {
      console.error('Error al obtener perfil de Twitter:', error);
      throw error;
    }
  }


  //* INSTAGRAM DATA GETTING */
  async getInstagramPostAndComments() {
    try {
      const [postsResult, commentsResult] = await Promise.allSettled([
        this.getInstagramPosts(),
        this.getInstagramComments(),
      ]);

      const instagramPosts = postsResult.status === 'fulfilled' ? postsResult.value : [];
      const instagramComments = commentsResult.status === 'fulfilled' ? commentsResult.value : [];

      const simplifiedPosts = instagramPosts.map(post => simplifyPost(post));

      const simplifiedComment = instagramComments.map(comment => {
        return {
          id: comment.id,
          postUrl: comment.postUrl,
          commentUrl: comment.commentUrl,
          text: comment.text,
          ownerUsername: comment.ownerUsername,
          timestamp: comment.timestamp,
          likesCount: comment.likesCount,
          owner: comment.owner
        }
      });

      const postAndcommentsUnification = simplifiedPosts.map((post) => {
        return {
          ...post,
          comments: simplifiedComment.filter((comment) => post.url == comment.postUrl)
        }
      });

      return postAndcommentsUnification;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  async getInstagramPosts() {
    try {
      const response = await this.apifyClient.dataset(this.DATASETS.INSTAGRAM_POSTS).listItems();
      return response.items;
    } catch (error) {
      console.error('Error al obtener perfil de Instagram:', error);
      throw error;
    }
  }

  async getInstagramComments() {
    try {
      const response = await this.apifyClient.dataset(this.DATASETS.INSTAGRAM_COMMENTS).listItems();
      return response.items;
    } catch (error) {
      console.error('Error al obtener perfil de Instagram:', error);
      throw error;
    }
  }

  //* FACEBOOK DATA GETTING */
  async getFacebookPostAndComments(): Promise<any[]> {
    try {
      const [postsResult, commentsResult] = await Promise.allSettled([
        this.getFacebookPosts(),
        this.getFacebookComments(),
      ]);

      const posts = postsResult.status === 'fulfilled' ? postsResult.value : [];
      const rawComments = commentsResult.status === 'fulfilled' ? commentsResult.value : [];

      // Paso 1: Crear mapa de posts por ID y URL
      const postMapById = new Map<string, any>();
      const postMapByUrl = new Map<string, any>();

      // Primero procesamos todos los posts
      const processedPosts = posts.map(post => {
        const simplifiedPost: any = {
          id: post.postId,
          text: post.text,
          time: post.time,
          user: {
            id: post.user.id,
            name: post.user.name,
            profileUrl: post.user.profileUrl
          },
          likes: post.likes,
          commentsCount: post.comments,
          shares: post.shares,
          url: post.url,
          isVideo: post.isVideo,
          viewsCount: post.viewsCount,
          thumbnailUrl: post.media?.[0]?.thumbnail || '',
          comments: []
        };

        postMapById.set(post.postId, simplifiedPost);
        postMapByUrl.set(post.url, simplifiedPost);
        return simplifiedPost;
      });

      // Paso 2: Asignar comentarios a los posts correspondientes
      rawComments.forEach(comment => {
        // Buscar el post por URL del comentario
        const postIdFromUrl = extractFacebookPostId(comment.facebookUrl);
        let targetPost = postIdFromUrl ? postMapById.get(postIdFromUrl) : undefined;

        // Si no se encontró por ID, intentar por URL completa
        if (!targetPost) {
          targetPost = postMapByUrl.get(comment.facebookUrl);
        }

        // Si encontramos el post, agregar el comentario
        if (targetPost) {
          targetPost.comments.push({
            text: comment.text,
            likes: parseInt(comment.likesCount) || 0,
            author: comment.author ? { name: comment.author.name } : undefined,
            facebookUrl: comment.facebookUrl,
            timestamp: comment.createTimeISO // Si está disponible
          });
        }
      });

      return processedPosts;

    } catch (error) {
      console.error('Error processing Facebook data:', error);
      throw error;
    }
  }

  async getFacebookPosts(): Promise<any[]> {
    try {
      const response = await this.apifyClient.dataset(this.DATASETS.FACEBOOK_POSTS).listItems();
      return response.items;
    } catch (error) {
      console.error('Error fetching Facebook posts:', error);
      throw error;
    }
  }

  async getFacebookComments(): Promise<any[]> {
    try {
      const response = await this.apifyClient.dataset(this.DATASETS.FACEBOOK_COMMENTS).listItems();
      return response.items;
    } catch (error) {
      console.error('Error fetching Facebook comments:', error);
      throw error;
    }
  }


  //* YOUTUBE DATA GETTING */
  async getYouTubeVideosAndComments() {
    try {
      const [videosResult, commentsResult] = await Promise.allSettled([
        this.getYouTubeVideos(),
        this.getYouTubeComments(),
      ]);

      const youtubeVideos = videosResult.status === 'fulfilled' ? videosResult.value : [];
      const youtubeComments = commentsResult.status === 'fulfilled' ? commentsResult.value : [];

      const extractVideoId = (url: string): string | null => {
        if (!url) return null;

        try {
          const urlObj = new URL(url);
          const videoId = urlObj.searchParams.get('v');
          if (videoId) return videoId;

          if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.split('/').pop() || null;
          }

          if (url.includes('/channel/') && url.includes('/videos/')) {
            const segments = url.split('/');
            return segments.pop() || null;
          }

          return null;
        } catch (e) {
          return null;
        }
      };

      const simplifiedVideos = youtubeVideos.map(video => {
        return {
          id: video.id,
          title: video.title,
          url: video.url,
          thumbnailUrl: video.thumbnailUrl,
          viewCount: video.viewCount,
          date: video.date,
          likes: video.likes,
          commentsCount: video.commentsCount,
          channelName: video.channelName,
          channelUrl: video.channelUrl,
          channelId: video.channelId,
          duration: video.duration,
          text: video.text,
          hashtags: video.hashtags
        };
      });

      // Simplificar comentarios
      const simplifiedComments = youtubeComments.map((comment: any) => {
        // Obtener video ID de múltiples fuentes
        let videoId = comment.videoId;

        if (!videoId && comment.pageUrl) {
          videoId = extractVideoId(comment.pageUrl);
        }

        return {
          id: comment.cid,
          videoId: videoId || '',
          commentText: comment.comment,
          author: comment.author,
          publishedTimeText: comment.publishedTimeText,
          replyCount: comment.replyCount,
          voteCount: comment.voteCount,
          isReply: comment.type === 'reply',
          replyToCid: comment.replyToCid,
          pageUrl: comment.pageUrl
        };
      });

      // Unificar videos con comentarios
      const videosWithComments = simplifiedVideos.map(video => {
        return {
          ...video,
          comments: simplifiedComments.filter(comment =>
            comment.videoId && video.id &&
            comment.videoId === video.id
          )
        };
      });

      return videosWithComments;
    } catch (error) {
      console.error('Error processing YouTube data:', error);
      throw error;
    }
  }

  async getYouTubeVideos() {
    try {
      const response = await this.apifyClient.dataset(this.DATASETS.YOUTUBE_VIDEOS).listItems();
      return response.items;
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
      throw error;
    }
  }

  async getYouTubeComments() {
    try {
      const response = await this.apifyClient.dataset(this.DATASETS.YOUTUBE_COMMENTS).listItems();
      return response.items;
    } catch (error) {
      console.error('Error fetching YouTube comments:', error);
      throw error;
    }
  }

  //* TIKTOK DATA GETTING */

  async getTiktokVideosAndComments() {
    try {
      const [videosResult, commentsResult] = await Promise.allSettled([
        this.getTiktokVideos(),
        this.getTiktokComments(),
      ]);

      const videos = videosResult.status === 'fulfilled' ? videosResult.value : [];
      const rawComments = commentsResult.status === 'fulfilled' ? commentsResult.value : [];

      // Función para extraer ID de video de URL de TikTok
      const extractTikTokVideoId = (url: string): string | null => {
        if (!url) return null;

        // Buscar el patrón típico de URL de video de TikTok
        const match = url.match(/\/video\/(\d+)/);
        if (match && match[1]) return match[1];

        // Si falla, intentar con el último segmento numérico
        const segments = url.split('/');
        const lastSegment = segments.pop() || '';
        return /^\d+$/.test(lastSegment) ? lastSegment : null;
      };

      // Simplificar comentarios y extraer videoId
      const simplifiedComments = rawComments.map(comment => {
        // Intentar con múltiples campos que contienen la URL
        const urlsToTry = [comment.videoWebUrl, comment.submittedVideoUrl, comment.input];
        let videoId;

        for (const url of urlsToTry) {
          videoId = extractTikTokVideoId(url);
          if (videoId) break;
        }

        return {
          id: comment.cid,
          videoId: videoId || '',
          text: comment.text,
          createTimeISO: comment.createTimeISO,
          likes: comment.diggCount,
          author: {
            id: comment.uid,
            nickname: comment.uniqueId,
            avatar: comment.avatarThumbnail
          },
          isPinned: comment.pinnedByAuthor,
          isLikedByAuthor: comment.likedByAuthor,
          replyCount: comment.replyCommentTotal
        };
      });

      // Unificar videos con comentarios
      const videosWithComments = videos.map(video => {
        // Extraer videoId de la URL del video para asegurarnos
        const videoId = extractTikTokVideoId(video.webUrl) || video.id;

        return {
          ...video,
          comments: simplifiedComments.filter(comment =>
            comment.videoId && videoId &&
            comment.videoId === videoId.toString()
          )
        };
      });

      return videosWithComments;
    } catch (error) {
      console.error('Error processing TikTok data:', error);
      throw error;
    }
  }

  async getTiktokVideos(): Promise<SimplifiedTikTokPost[]> {
    try {
      const response = await this.apifyClient.dataset(this.DATASETS.TIKTOK_VIDEOS).listItems();

      return response.items.map((item: any) => ({
        id: item.id,
        text: item.text,
        createTimeISO: item.createTimeISO,
        isAd: item.isAd,
        author: {
          id: item.authorMeta.id || '',
          nickname: item.authorMeta.nickName || '',
          verified: item.authorMeta.verified || false,
          followers: item.authorMeta.fans || 0,
          following: item.authorMeta.following || 0
        },
        metrics: {
          likes: item.diggCount,
          shares: item.shareCount,
          plays: item.playCount,
          saves: item.collectCount,
          comments: item.commentCount
        },
        music: item.musicMeta ? {
          name: item.musicMeta.musicName || '',
          author: item.musicMeta.musicAuthor || '',
          isOriginal: item.musicMeta.musicOriginal || false
        } : undefined,
        video: {
          url: item.webVideoUrl,
          duration: item.videoMeta?.duration || 0,
          thumbnail: item.videoMeta?.coverUrl || '',
          resolution: item.videoMeta?.definition || '',
          subtitles: (item.videoMeta?.subtitleLinks || []).map(sub => ({
            language: sub.language,
            sourceType: sub.sourceUnabbreviated
          }))
        },
        hashtags: item.hashtags.map(tag => tag.name),
        mentions: item.detailedMentions.map(m => m.nickName),
        webUrl: item.webVideoUrl
      }));
    } catch (error) {
      console.error('Error processing TikTok videos:', error);
      throw new Error('Failed to process TikTok videos');
    }
  }

  async getTiktokComments(): Promise<any[]> {
    try {
      const response = await this.apifyClient.dataset(this.DATASETS.TIKTOK_COMMENTS).listItems();
      return response.items;
    } catch (error) {
      console.error('Error fetching TikTok comments:', error);
      throw error;
    }
  }

  //* TWITTER DATA GETTING */

  /**
   * Transformador para tweets de Twitter
   */
  private transformTwitterPost(tweet: TwitterTweetWithReplies): any {
    return {
      id: `twitter_${tweet.id}`,
      source: 'twitter',
      url: tweet.url,
      content: tweet.text,
      likesCount: tweet.likes,
      commentsCount: tweet.repliesData?.length || 0,
      timestamp: tweet.timestamp,
      author: tweet.username.replace('@', ''), // Remover @ del username
      extra: {
        verified: tweet.verified,
        retweets: tweet.retweets,
        quotes: tweet.quotes,
        fullname: tweet.fullname,
        isRetweet: tweet.isRetweet,
        isQuote: tweet.isQuote,
        ...(tweet.images && tweet.images.length > 0 && { images: tweet.images }),
        ...(tweet.links && tweet.links.length > 0 && { links: tweet.links })
      },
      comments: (tweet.repliesData || []).map(reply => this.transformTwitterReply(reply))
    };
  }

  /**
   * Transformador para respuestas de Twitter
   */
  private transformTwitterReply(reply: TwitterTweet): any {
    return {
      id: reply.id,
      text: reply.text,
      author: reply.username.replace('@', ''), // Remover @ del username
      timestamp: reply.timestamp,
      likesCount: reply.likes
    };
  }

  /**
   * Función específica para obtener solo tweets relevantes
   * (la que ya creamos anteriormente)
   */
  async getTwitterTweetsAndReplies(): Promise<{
    tweets: TwitterTweetWithReplies[];
    total: number;
  }> {
    try {
      console.log('Starting Twitter data processing...');

      const [tweetsResult] = await Promise.allSettled([
        this.getTwitterTweetsData(),
      ]);

      if (tweetsResult.status === 'rejected') {
        console.error('Failed to fetch Twitter data:', tweetsResult.reason);
        return { tweets: [], total: 0 };
      }

      const allTweets: any = tweetsResult.value || [];
      console.log(`Fetched ${allTweets.length} tweets from API`);

      // Filtrar por keywords y agrupar - SOLO MAIN TWEETS
      const relevantTweets = this.filterRelevantTweets(allTweets);

      console.log(`Returning ${relevantTweets.length} relevant main tweets`);

      return {
        tweets: relevantTweets, // Ya son solo main tweets con sus respuestas
        total: relevantTweets.length
      };

    } catch (error) {
      console.error('Error processing Twitter data:', error);
      throw error;
    }
  }

  private keywords = [
    'notco',
    'not co',
    'not company',
    'vegan',
    'proteína vegetal',
    'not'
  ];

  /**
   * Filtra tweets por keywords y agrupa con respuestas - SOLO MAIN TWEETS
   */
  private filterRelevantTweets(tweets: TwitterTweet[]): TwitterTweetWithReplies[] {
    if (!tweets || !Array.isArray(tweets)) {
      console.log('No tweets to process or invalid data');
      return [];
    }

    // 1. Filtrar todos los tweets por keywords
    const relevantTweets = tweets.filter(tweet => {
      if (!tweet || typeof tweet !== 'object') {
        return false;
      }
      return this.containsKeywords(tweet.text);
    });

    console.log(`Filtered ${relevantTweets.length} relevant tweets from ${tweets.length} total`);

    // 2. Separar SOLO main tweets y respuestas
    const mainTweets = relevantTweets.filter(tweet => !tweet.isReply);
    const replies = relevantTweets.filter(tweet => tweet.isReply);

    console.log(`Main tweets: ${mainTweets.length}, Replies: ${replies.length}`);

    // 3. Agrupar respuestas con tweets principales
    return this.groupTweetsWithReplies(mainTweets, replies);
  }

  private containsKeywords(text: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }

    const textLower = text.toLowerCase();
    return this.keywords.some(keyword =>
      textLower.includes(keyword.toLowerCase())
    );
  }

  private groupTweetsWithReplies(
    mainTweets: TwitterTweet[],
    replies: TwitterTweet[]
  ): TwitterTweetWithReplies[] {

    const tweetsWithReplies: TwitterTweetWithReplies[] = mainTweets.map(tweet => ({
      ...tweet,
      repliesData: []
    }));

    replies.forEach((reply: any) => {
      if (reply.replyingTo && reply.replyingTo.length > 0) {
        const mainTweet = tweetsWithReplies.find(tweet => {
          const replyingToUsername = reply.replyingTo[0].replace('/', '@');
          return tweet.username === replyingToUsername ||
            tweet.username === reply.replyingTo[0];
        });

        if (mainTweet && mainTweet.repliesData) {
          mainTweet.repliesData.push(reply);
        }
      }
    });

    return tweetsWithReplies;
  }

  async getTwitterTweetsData() {
    try {
      const response = await this.apifyClient.dataset(this.DATASETS.TWITTER_TWEETS).listItems();
      return Promise.resolve(response.items);
    } catch (error) {
      console.error('Error fetching Twitter tweets:', error);
      return Promise.reject(error);
    }
  }

  async getUnifiedMetrics(): Promise<UnifiedMetrics> {
    const profiles = await this.getProfilesInfo();
    return profiles.metrics;
  }

  async getProfilesByPlatform(platform: string): Promise<UnifiedProfile | null> {
    const profiles = await this.getProfilesInfo();
    return profiles.unified.find(p => p.platform === platform) || null;
  }

  async getTopPlatformsByFollowers(): Promise<UnifiedProfile[]> {
    const profiles = await this.getProfilesInfo();
    return profiles.unified.sort((a, b) => b.followers - a.followers);
  }

  async getUnifiedSocialPosts(): Promise<UnifiedPost[]> {
    try {
      const [instagramResult, youtubeResult, tiktokResult, facebookResult, twitterResult] = await Promise.allSettled([
        this.getInstagramPostAndComments(),
        this.getYouTubeVideosAndComments(),
        this.getTiktokVideosAndComments(),
        this.getFacebookPostsWithComments(),
        this.getTwitterTweetsAndReplies(),
      ]);


      const instagramPosts = instagramResult.status === 'fulfilled' ? instagramResult.value : [];
      const youtubePosts = youtubeResult.status === 'fulfilled' ? youtubeResult.value : [];
      const tiktokPosts = tiktokResult.status === 'fulfilled' ? tiktokResult.value : [];
      const facebookPosts = facebookResult.status === 'fulfilled' ? facebookResult.value : [];
      const twitterPosts = twitterResult.status === 'fulfilled' ? twitterResult.value.tweets : [];

      const unifiedInstagram = instagramPosts.map(post => this.transformInstagramPost(post));
      const unifiedYoutube = youtubePosts.map(video => this.transformYoutubeVideo(video));
      const unifiedTiktok = tiktokPosts.map(video => this.transformTikTokPost(video));
      const unifiedFacebook = facebookPosts.map(video => this.transformFacebookPost(video));
      const unifiedTwitter = twitterPosts.map(tweet => this.transformTwitterPost(tweet));



      return [...unifiedInstagram, ...unifiedYoutube, ...unifiedTiktok, ...unifiedFacebook, ...unifiedTwitter]

    } catch (error) {
      console.error('Error unifying social media posts:', error);
      throw error;
    }
  }

  /* UNIFICAR POSTS */
  private transformInstagramPost(post: any): UnifiedPost {
    return {
      id: `instagram_${post.id}`,
      source: SocialMediaSource.INSTAGRAM,
      url: post.url,
      content: post.caption || '',
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      timestamp: post.timestamp,
      author: post.ownerUsername || '',
      thumbnailUrl: undefined,
      extra: {
        type: post.type,
      },
      comments: post.comments.map(comment => ({
        id: comment.id || '',
        text: comment.text || '',
        author: comment.ownerUsername || '',
        timestamp: comment.timestamp,
        likesCount: comment.likesCount || 0,
      })),
    };
  }

  private transformYoutubeVideo(video: any): UnifiedPost {
    return {
      id: `youtube_${video.id}`,
      source: SocialMediaSource.YOUTUBE,
      url: video.url,
      content: video.title || '',
      likesCount: video.likes || 0,
      commentsCount: video.commentsCount || 0,
      timestamp: video.date,
      author: video.channelName || '',
      authorUrl: video.channelUrl,
      thumbnailUrl: video.thumbnailUrl,
      extra: {
        duration: video.duration,
        viewCount: video.viewCount,
      },
      comments: video.comments.map(comment => ({
        id: comment.id || '',
        text: comment.commentText || '',
        author: comment.author || '',
        timeText: comment.publishedTimeText,
        likesCount: comment.voteCount || 0,
      })),
    };
  }

  private transformTikTokPost(post: any) {
    return {
      id: `tiktok_${post.id}`,
      source: SocialMediaSource.TIKTOK,
      url: post.webUrl,
      content: post.text || '',
      likesCount: post.metrics?.likes || 0,
      commentsCount: post.metrics?.comments || 0,
      timestamp: post.createTimeISO,
      author: post.author?.nickname || '',
      thumbnailUrl: post.video?.thumbnail,
      extra: {
        isAd: post.isAd,
        shares: post.metrics?.shares,
        plays: post.metrics?.plays,
        saves: post.metrics?.saves,
        music: post.music ? {
          name: post.music.name,
          author: post.music.author,
          isOriginal: post.music.isOriginal
        } : undefined,
        hashtags: post.hashtags,
        mentions: post.mentions,
        duration: post.video?.duration,
        resolution: post.video?.resolution,
      },
      comments: post.comments.map(comment => this.transformTikTokComment(comment))
    };
  }

  private transformTikTokComment(comment: any): any {
    return {
      id: comment.id || '',
      text: comment.text || '',
      author: comment.author?.nickname || '',
      timestamp: comment.createTimeISO,
      likesCount: comment.likes || 0,
    };
  }

  async getFacebookPostsWithComments(): Promise<any[]> {
    return await this.getFacebookPostAndComments();
  }

  private transformFacebookPost(post: any): any {
    // console.log({ post })
    console.log({ post })
    return {
      id: `facebook_${post.id}`,
      source: SocialMediaSource.FACEBOOK,
      url: post.url,
      content: post.text || '',
      likesCount: post.likes || 0,
      commentsCount: post.commentsCount || 0,
      timestamp: new Date(post.time),
      author: post.user.name || '',
      authorUrl: post.user?.profileUrl,
      thumbnailUrl: post.thumbnailUrl,
      extra: {
        shares: post.shares,
        isVideo: post.isVideo,
        viewsCount: post.viewsCount
      },
      comments: post.comments.map(comment => this.transformFacebookComment(comment))
    };
  }

  private transformFacebookComment(comment: any): any {
    return {
      id: '', // Facebook no proporciona un ID en los datos mostrados
      text: comment.text || '',
      author: comment.author?.name || '',
      likesCount: comment.likes || 0,
      // Facebook no proporciona timestamp en los comentarios mostrados
      // Si está disponible en los datos reales, usar: timestamp: new Date(comment.timestamp)
    };
  }

}