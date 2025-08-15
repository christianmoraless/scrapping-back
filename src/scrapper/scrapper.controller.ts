import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus } from '@nestjs/common';
import { ScrapperService } from './scrapper.service';
import { CreateScrapperDto } from './dto/create-scrapper.dto';
import { UpdateScrapperDto } from './dto/update-scrapper.dto';

@Controller('scrapper')
export class ScrapperController {
  constructor(private readonly scrapperService: ScrapperService) { }

  @Get('info-profiles')
  async getProfilesInformation(
    // @Res() res,
  ) {
    const response = await this.scrapperService.getProfilesInfo();
    return {
      data: response,
      status: HttpStatus.OK
    }
    // return res.status(response.status).send({
    //   message: response.message,
    //   data: response.data,
    // });
  }

  @Get('info-instagram')
  async getInstagramPostAndComments() {
    return await this.scrapperService.getInstagramPostAndComments();
  }

  @Get('info-youtube')
  async getYouTubeVideosAndComments() {
    return await this.scrapperService.getYouTubeVideosAndComments();
  }

  @Get('info-facebook')
  async getFacebookPostAndComments() {
    return await this.scrapperService.getFacebookPostAndComments();
  }

  @Get('info-tiktok')
  async getTikTokVideosAndComments() {
    return await this.scrapperService.getTiktokVideosAndComments();
  }

  @Get('info-twitter')
  async getTwitterTweetsAndReplies() {
    return await this.scrapperService.getTwitterTweetsAndReplies();
  }

  @Get('unified-social-posts')
  async getUnifiedSocialPosts() {
    return this.scrapperService.getUnifiedSocialPosts();
  }

}
