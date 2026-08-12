import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Serve static assets from uploads folder
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  // Enable CORS with dynamic origins (development & production/preview Vercel URLs)
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const isAllowed =
        origin.startsWith('http://localhost') ||
        /\.vercel\.app$/.test(origin) ||
        /\.onrender\.com$/.test(origin) ||
        origin.includes('hergla-park');
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });

  // Set up global validation pipe (whiteslisting non-whitelisted params)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Set up global exception filter for normalized API error JSON structures
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configure Swagger OpenAPI Builder
  const config = new DocumentBuilder()
    .setTitle('Carting Hergla Park API')
    .setDescription(
      'REST API Documentation for managing Carting Hergla Park operations (Café, Resto, Karting, KidZone). Built using NestJS, Prisma, and PostgreSQL.'
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Veuillez saisir votre token JWT',
        in: 'header',
      },
      'bearerAuth'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`[NestJS] Application is running on: http://localhost:${port}`);
  console.log(`[NestJS] Swagger Documentation: http://localhost:${port}/api-docs`);
}
bootstrap();
