import { Ionicons } from '@expo/vector-icons';

import { FuncionApi } from '../../core/api/candela';
import { TonoAcento } from '../../core/theme';
import { FUNCIONES } from '../home/funciones';

/**
 * El icono y el color de cada función en el panel, sacados del grid del
 * inicio: así en "Entrenar a la IA" cada sección se reconoce de un vistazo.
 */
export function aspectoDe(funcion: FuncionApi): {
  icono: keyof typeof Ionicons.glyphMap;
  tono: TonoAcento;
} {
  const deInicio = FUNCIONES.find((f) => f.funcionApi === funcion);
  return {
    icono: deInicio?.icono ?? 'sparkles',
    tono: deInicio?.tono ?? 'rosa',
  };
}
