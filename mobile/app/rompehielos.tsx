import { PantallaGeneracion } from '../src/features/generacion/PantallaGeneracion';

export default function Rompehielos() {
  return (
    <PantallaGeneracion
      funcion="ROMPEHIELOS"
      titulo="Rompehielos"
      gancho="El primer mensaje"
      ganchoDestacado="lo es todo"
      subGancho="La IA te da un rompehielos básico al instante."
      icono="flash"
      tono="rosa"
      textoBoton="Generar rompehielos"
      // El modo Básico se aplica solo: la pantalla promete un rompehielos
      // al instante, así que no se le pide elegir nada. Los cuatro tonos
      // premium quedan visibles únicamente como incentivo.
      tonoImplicito
    />
  );
}
