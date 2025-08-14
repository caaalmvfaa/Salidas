
export interface Articulo {
  "Codigo": string;
  "Articulo": string;
  "Unidad Medida": string;
}

export interface Item {
  id: string;
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidadPedida: string;
  cantidadSurtida: string;
  observaciones: string;
}
