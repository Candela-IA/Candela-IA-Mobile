import { PantallaGeneracion } from '../src/features/generacion/PantallaGeneracion';

export default function AnalizarStories() {
  return (
    <PantallaGeneracion
      funcion="ANALIZAR_STORIES"
      titulo="Analizar Stories"
      gancho="Descubre lo que"
      ganchoDestacado="quiere decir"
      subGancho="Sube su historia y responde como nadie."
      icono="logo-instagram"
      tono="purpura"
      textoBoton="Analizar historia"
      capturaVertical
    />
  );
}
