import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScrapperModule } from './scrapper/scrapper.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [ScrapperModule,
    // MongooseModule.forRoot('mongodb://localhost:27017/socialmedia', {}),
  ],
  controllers: [AppController],
  providers: [AppService],

})
export class AppModule { }
