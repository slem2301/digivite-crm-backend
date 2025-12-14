import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { PrismaService } from './prisma.service'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	const prismaService = app.get(PrismaService)
	// await prismaService.enableShutdownHooks(app)

	// Добавьте обработчики событий к объекту process
	process.on('SIGINT', async () => {
		await prismaService.$disconnect()
		process.exit(0)
	})

	process.on('SIGTERM', async () => {
		await prismaService.$disconnect()
		process.exit(0)
	})



	app.setGlobalPrefix('api')
	app.enableCors()

	await app.listen(4200)
}
bootstrap()
