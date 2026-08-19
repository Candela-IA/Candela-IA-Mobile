import { PantallaGeneracion } from '../src/features/generacion/PantallaGeneracion';

export default function CrearNotas() {
  return (
    <PantallaGeneracion
      funcion="CREAR_NOTAS"
      titulo="Crear notas"
      gancho="Notas que"
      ganchoDestacado="se notan"
      subGancho="Publica y deja que te escriban primero."
      icono="create"
      tono="cian"
      textoBoton="Generar nota"
      // Sin captura ni contexto, la nota es lo unico que hay que mirar: va
      // arriba, antes de los modos de respuesta.
      previaArriba
    />
  );
}
