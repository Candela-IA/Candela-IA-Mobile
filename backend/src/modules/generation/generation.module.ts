import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthModule } from '../../shared/infrastructure/auth/auth.module';
import { DevicesModule } from '../devices/devices.module';
import { GenerarRespuestaUseCase } from './application/generar-respuesta.use-case';
import { AI_PROVIDER, AiProvider } from './domain/ai-provider.port';
import { MockAiProvider } from './infrastructure/mock.provider';
import { OpenAiProvider } from './infrastructure/openai.provider';
import { CatalogoController } from './infrastructure/http/catalogo.controller';
import { GenerarController } from './infrastructure/http/generar.controller';

@Module({
  imports: [AuthModule, DevicesModule],
  controllers: [CatalogoController, GenerarController],
  providers: [
    GenerarRespuestaUseCase,
    /**
     * Único punto donde el proyecto decide con qué IA habla.
     *
     * Para probar Gemini o Claude: se escribe otro adaptador que cumpla
     * `AiProvider` y se agrega aquí. Ni el caso de uso ni el controlador ni
     * el dominio se enteran.
     *
     * Se construye solo el que se va a usar, así el proveedor descartado ni
     * se instancia ni ensucia los logs con avisos que no aplican.
     *
     * El valor por defecto es SIEMPRE 'openai'. Que el modo falso requiera
     * ponerlo explícitamente evita el peor escenario posible: producción
     * sirviendo frases enlatadas sin que nadie se dé cuenta.
     */
    {
      provide: AI_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): AiProvider =>
        config.get<string>('AI_PROVIDER') === 'mock'
          ? new MockAiProvider()
          : new OpenAiProvider(config),
    },
  ],
})
export class GenerationModule {}
