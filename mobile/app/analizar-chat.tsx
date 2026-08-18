import { PantallaGeneracion } from '../src/features/generacion/PantallaGeneracion';

export default function AnalizarChat() {
  return (
    <PantallaGeneracion
      funcion="ANALIZAR_CHAT"
      titulo="Analizar chat"
      gancho="Sube la captura y la IA responde por ti."
      subGancho="Elige un modo y obtén la mejor respuesta."
      icono="chatbubble-ellipses"
      tono="azul"
      textoBoton="Analizar chat"
      mostrarTonoEnBanner
    />
  );
}
