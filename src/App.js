// src/App.js
import { useState } from "react";

// DATOS DE LOS PRODUCTOS
const productosData = [
  {producto: "AA4625 X60", ventaMensual: 498.56, stockMinARG: 747.84, kilos: 300.0},
  {producto: "AK0386 X115", ventaMensual: 0.0, stockMinARG: 0.0, kilos: 345.0},
  {producto: "AK4387 X60", ventaMensual: 2.5, stockMinARG: 3.75, kilos: 255.0},
  {producto: "AT7610 X30", ventaMensual: 51.92, stockMinARG: 77.88, kilos: 150.0},
  {producto: "AT7612 X25", ventaMensual: 23.33, stockMinARG: 34.99, kilos: 75.0},
  {producto: "CP2818 X120", ventaMensual: 1067.42, stockMinARG: 1601.13, kilos: 600.0},
  {producto: "CP2876 X120", ventaMensual: 238.25, stockMinARG: 357.38, kilos: 340.0},
  {producto: "RE2319 X120", ventaMensual: 0.0, stockMinARG: 0.0, kilos: 238.0},
  {producto: "UR1435 X120", ventaMensual: 25.0, stockMinARG: 37.5, kilos: 60.0},
  {producto: "UR1441 X120", ventaMensual: 25.0, stockMinARG: 37.5, kilos: 60.0},
  {producto: "UR1693 X110", ventaMensual: 240.46, stockMinARG: 360.69, kilos: 660.0},
  {producto: "UR1721 X120", ventaMensual: 62.0, stockMinARG: 93.0, kilos: 590.0},
  {producto: "UR1786 X 120", ventaMensual: 279.33, stockMinARG: 419.0, kilos: 220.0},
  {producto: "WA0435 X120", ventaMensual: 28.0, stockMinARG: 42.0, kilos: 103.0},
];

function App() {
  const [datos, setDatos] = useState(
    productosData.reduce((obj, p) => {
      obj[p.producto] = { stockUY: ""};
      return obj;
    }, {})
  );

  const handleChange = (prod, campo, valor) => {
    setDatos({ ...datos, [prod]: { ...datos[prod], [campo]: valor } });
  };

  const obtenerTamanoEnvase = (nombreProducto) => {
    const match = nombreProducto.match(/X\s?(\d+)/);
    return match ? parseInt(match[1], 10) : 1; // Si no se encuentra, usar 1 como fallback
  };
  
  const redondearAlMultiplo = (valor, multiplo) => {
    if (valor === 0) return 0;
    return Math.ceil(valor / multiplo) * multiplo;
  };  

  const calcularReposicion = ({ ventaMensual, stockMinARG, kilos }, prod) => {
    /*
    ESTA FUNCION ES LA QUE SE ENCARGA DE DEVOLVER LOS PEDIDOS QUE TIENE QUE HACER ARGENTINA A URUGUAY Y URUGUAY A ESPAÑA.
    */
    
    const stockUY = parseFloat(datos[prod].stockUY) || 0;
    const tamEnvase = obtenerTamanoEnvase(prod);

    // DEFINIMOS VARIABLES
  
    let pedidoARG = 0;
    let pedidoUY = 0;

    let K = 1; // esta es la constante que usas para [ kilos a fin de mes en ARG = (venta mensual estimada) * K ]
    let M = 2; // esta es la constante que usas para [ kilos a fin de mes en UY = (venta mensual estimada) * M ] 

    // CALCULO PARA LO QUE LE TIENE QUE PEDIR ARG A UY

    let stock_final_ARG = ventaMensual * K; // stock final en ARG
    let stock_inicial_ARG = kilos;

    pedidoARG = stock_final_ARG + ventaMensual - stock_inicial_ARG; // cuanto tiene que pedirle ARG a UY
    pedidoARG = pedidoARG < 0 ? 0 : Math.round(pedidoARG * 100) / 100;; // no puede ser negativo
    // pedidoARG = pedidoARG > 0 ? redondearAlMultiplo(pedidoARG, tamEnvase) : 0; // ESTO ES PARA REDONDEAR

    // CALCULO PARA LO QUE LE TIENE QUE PEDIR UY A ESP

    let stock_final_UY = ventaMensual * M; // stock final en UY
    let stock_inicial_UY = stockUY; // stock inicial en UY lo ingresa el usuario
    let envioARG = pedidoARG; // kilos que envía ARG a UY

    pedidoUY = stock_final_UY - stock_inicial_UY + envioARG; // cuanto tiene que pedirle UY a ESP
    pedidoUY = pedidoUY < 0 ? 0 : Math.round(pedidoUY * 100) / 100;
    // pedidoUY = pedidoUY > 0 ? redondearAlMultiplo(pedidoUY, tamEnvase) : 0; // ESTO ES PARA REDONDEAR

    return { pedidoARG, pedidoUY };
  };  

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📦 Gestión de Productos Terminación Pielcolor</h1>

      <table className="table-auto w-full border text-sm">
  <thead className="bg-gray-100">
    <tr>
      <th className="p-2">Producto</th>
      <th>Stock UY</th>
      <th>Venta Mensual ARG</th>
      <th>Stock Mín. ARG</th>
    </tr>
  </thead>
  <tbody>
    {productosData.map((p) => {
      const stockUY = parseFloat(datos[p.producto].stockUY) || 0;

      return (
        <tr key={p.producto} className="text-center border-t">
          <td className="p-1 font-semibold">{p.producto}</td>
          <td>
            <input
              type="number"
              className="border px-2 w-20"
              value={datos[p.producto].stockUY}
              onChange={(e) =>
                handleChange(p.producto, "stockUY", e.target.value)
              }
            />
          </td>
          <td>{p.ventaMensual}</td>
          <td>{p.stockMinARG}</td>
        </tr>
      );
    })}
  </tbody>
</table>
      <div className="mt-10 p-6 border border-blue-300 rounded-xl bg-blue-50">
        <h2 className="text-xl font-bold text-blue-900 mb-2">📦 Reposición sugerida</h2>
        <ul className="list-disc pl-6 text-sm">
          {productosData.map((p) => {
            const stockUY = parseFloat(datos[p.producto].stockUY) || 0;
            const { pedidoARG, pedidoUY } = calcularReposicion(p, p.producto);
            return (
              <li key={p.producto} className="mb-1">
                <strong>{p.producto}</strong>: ARG debe pedir{" "}
                <strong>{pedidoARG}</strong> kg a UY. UY debe pedir{" "}
                <strong>{pedidoUY}</strong> kg a ESP.{" "}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default App;
