import { Module } from '@nestjs/common';

import { AuthModule } from '../../shared/infrastructure/auth/auth.module';
import { GenerationModule } from '../generation/generation.module';
import { PanelPromptsService } from './application/panel-prompts.service';
import { AdminGuard } from './infrastructure/admin.guard';
import { AdminController } from './infrastructure/http/admin.controller';

/**
 * Panel "Entrenar a la IA": el cliente cambia desde la app cómo responde
 * cada tono, detrás de la contraseña `ADMIN_PASSWORD`.
 */
@Module({
  imports: [AuthModule, GenerationModule],
  controllers: [AdminController],
  providers: [PanelPromptsService, AdminGuard],
})
export class AdminModule {}
