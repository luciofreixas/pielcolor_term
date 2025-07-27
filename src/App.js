// src/App.js
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale";
import { differenceInDays } from "date-fns";

const productosData = [
  {producto: "AA4625 X60", ventaMensual: 373.19, stockMinARG: 559.78, kilos: 300.0, fechaIngreso: "28/05/2025"},
  {producto: "AK0386 X115", ventaMensual: 0.0, stockMinARG: 0.0, kilos: 345.0, fechaIngreso: "02/05/2025"},
  {producto: "AK4387 X60", ventaMensual: 9.0, stockMinARG: 13.5, kilos: 255.0, fechaIngreso: "08/06/2018"},
  {producto: "AT7610 X30", ventaMensual: 19.41, stockMinARG: 29.12, kilos: 150.0, fechaIngreso: "28/05/2025"},
  {producto: "AT7612 X25", ventaMensual: 9.17, stockMinARG: 13.76, kilos: 75.0, fechaIngreso: "28/05/2025"},
  {producto: "CP2818 X120", ventaMensual: 561.66, stockMinARG: 842.49, kilos: 600.0, fechaIngreso: "28/05/2025"},
  {producto: "CP2876 X120", ventaMensual: 116.12, stockMinARG: 174.18, kilos: 340.0, fechaIngreso: "28/05/2025"},
  {producto: "RE2319 X120", ventaMensual: 0.0, stockMinARG: 0.0, kilos: 238.0, fechaIngreso: "10/11/2024"},
  {producto: "UR1435 X120", ventaMensual: 0.5, stockMinARG: 0.75, kilos: 60.0, fechaIngreso: "28/05/2025"},
  {producto: "UR1441 X120", ventaMensual: 0.5, stockMinARG: 0.75, kilos: 60.0, fechaIngreso: "28/05/2025"},
  {producto: "UR1693 X110", ventaMensual: 277.3, stockMinARG: 415.95, kilos: 660.0, fechaIngreso: "28/05/2025"},
  {producto: "UR1721 X120", ventaMensual: 43.0, stockMinARG: 64.5, kilos: 590.0, fechaIngreso: "28/05/2025"},
  {producto: "UR1786 X 120", ventaMensual: 496.96, stockMinARG: 745.44, kilos: 220.0, fechaIngreso: "28/05/2025"},
  {producto: "WA0435 X120", ventaMensual: 8.0, stockMinARG: 12.0, kilos: 103.0, fechaIngreso: "22/06/2024"},
];

function App() {
  const [datos, setDatos] = useState(
    productosData.reduce((obj, p) => {
      obj[p.producto] = { stockUY: "", fechaUY: new Date() };
      return obj;
    }, {})
  );

  const handleChange = (prod, campo, valor) => {
    setDatos({ ...datos, [prod]: { ...datos[prod], [campo]: valor } });
  };

  const diasEnUY = (fechaDate) => differenceInDays(new Date(), fechaDate);

  const obtenerTamanoEnvase = (nombreProducto) => {
    const match = nombreProducto.match(/X\s?(\d+)/);
    return match ? parseInt(match[1], 10) : 1; // Si no se encuentra, usar 1 como fallback
  };
  
  const redondearAlMultiplo = (valor, multiplo) => {
    if (valor === 0) return 0;
    return Math.ceil(valor / multiplo) * multiplo;
  };  

  const calcularReposicion = ({ stockMinARG, kilos, ventaMensual }, prod) => {
    const stockUY = parseFloat(datos[prod].stockUY) || 0;
    const dias = diasEnUY(datos[prod].fechaUY);

    const tamEnvase = obtenerTamanoEnvase(prod);
  
    let pedidoARG = 0;
    let pedidoUY = 0;
  
    // === 1) Si pasaron 90 días o más en UY: mandar TODO el stock UY a ARG ===
    if (dias >= 90) {
      pedidoARG = redondearAlMultiplo(stockUY, tamEnvase);
      pedidoUY = redondearAlMultiplo(stockUY * (4 / 3), tamEnvase);
      return { pedidoARG, pedidoUY };
    }
  
    // === 2) Reposición normal ===
    const stockARG = kilos;
  
    if (stockARG - ventaMensual === 0) {
      pedidoARG = stockMinARG;
    } else if (stockARG - ventaMensual > stockMinARG) {
      pedidoARG = 0;
    } else if (stockARG - ventaMensual < stockMinARG) {
      pedidoARG = stockMinARG + stockARG - ventaMensual;
    }
  
    pedidoARG = Math.max(0, Math.round(pedidoARG * 100) / 100);
  
    // UY siempre debe tener 1.33 × stockMinARG
    const stockMinUY = stockMinARG * (4 / 3);
    const diffUY = stockMinUY - stockUY;
    pedidoUY = diffUY > 0 ? diffUY : 0;
    
    pedidoARG = pedidoARG > 0 ? redondearAlMultiplo(pedidoARG, tamEnvase) : 0;
    pedidoUY = pedidoUY > 0 ? redondearAlMultiplo(pedidoUY, tamEnvase) : 0;
  
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
            <th>Fecha Ingreso UY</th>
            <th>Venta Mensual ARG</th>
            <th>Stock Mín. ARG</th>
            <th>Días en UY</th>
          </tr>
        </thead>
        <tbody>
          {productosData.map((p) => {
            const stockUY = parseFloat(datos[p.producto].stockUY) || 0;
            const dias = diasEnUY(datos[p.producto].fechaUY);

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
                <td>
                  <DatePicker
                    selected={datos[p.producto].fechaUY}
                    onChange={(date) => handleChange(p.producto, "fechaUY", date)}
                    dateFormat="dd/MM/yyyy"
                    locale={es}
                    className="border px-2 w-28"
                  />
                </td>
                <td>{p.ventaMensual}</td>
                <td>{p.stockMinARG}</td>
                <td
                  className={
                    dias > 60 ? "text-red-600 font-bold" : ""
                  }
                >
                  {dias}
                </td>
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
            const dias = diasEnUY(datos[p.producto].fechaUY);
            const { pedidoARG, pedidoUY } = calcularReposicion(p, p.producto, dias, stockUY);

            return (
              <li key={p.producto} className="mb-1">
                <strong>{p.producto}</strong>: ARG debe pedir{" "}
                <strong>{pedidoARG}</strong> kg a UY. UY debe pedir{" "}
                <strong>{pedidoUY}</strong> kg a ESP.{" "}
                {dias >= 60 && (
                  <span className="text-red-600 font-semibold ml-2">
                    Este producto está hace más de 2 meses.
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default App;
