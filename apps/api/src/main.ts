import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000', // Next.js web
      'exp://localhost:8081', // Expo dev
    ],
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.warn(`Plan2Skill API running on http://localhost:${port}`);
}

bootstrap();
