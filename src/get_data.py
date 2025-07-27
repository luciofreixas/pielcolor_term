import pandas as pd

# === CARGAR EXCELS ===
ventas_excel = "/Users/luciofreixas/Desktop/gestion_stoc_pielcolor/pielcolor-term/datos/ventas.xlsx"
stock_excel  ="/Users/luciofreixas/Desktop/gestion_stoc_pielcolor/pielcolor-term/datos/stock.xlsx"

# === PROCESAR VENTAS ===
df_ventas_raw = pd.read_excel(ventas_excel, header=None, skiprows=3)
n_meses_ventas = df_ventas_raw.shape[1] // 5

ventas_list = []
for i in range(n_meses_ventas):
    idx = n_meses_ventas - 1 - i          # mes más reciente primero
    bloque = df_ventas_raw.iloc[:, idx*5:(idx+1)*5].copy()
    bloque.columns = ["Producto", "Cantidad", "Precio", "Bruta", "Neta"]
    bloque["Mes"] = i + 1
    ventas_list.append(bloque)

ventas_df = pd.concat(ventas_list, ignore_index=True)
ventas_df["Cantidad"] = pd.to_numeric(ventas_df["Cantidad"], errors="coerce").fillna(0)
ventas_df = ventas_df[["Producto", "Cantidad", "Mes"]]

# === PROCESAR STOCK ===
df_stock_raw = pd.read_excel(stock_excel, header=None, skiprows=3)
n_meses_stock = df_stock_raw.shape[1] // 7

stock_list = []
for i in range(n_meses_stock):
    idx = n_meses_stock - 1 - i
    bloque = df_stock_raw.iloc[:, idx*7:(idx+1)*7].copy()
    bloque.columns = [
        "Producto", "Kilos", "Precio", "FechaIngreso",
        "StockValorizado", "MesesEnStock", "MesesXValor"
    ]
    bloque["Mes"] = i + 1
    stock_list.append(bloque)

stock_df = pd.concat(stock_list, ignore_index=True)
stock_df = stock_df[stock_df["Mes"] == stock_df["Mes"].max()]   # solo el mes más reciente
stock_df = stock_df[["Producto", "Kilos", "FechaIngreso"]]

# === TABLA DINÁMICA DE VENTAS ===
ventas_pivot = (
    ventas_df
    .pivot_table(index="Producto", columns="Mes", values="Cantidad", aggfunc="sum")
    .fillna(0)
)

# === FUNCIÓN DE PROYECCIÓN ===
def calcular_venta_mensual_proyectada(filas):
    m2 = filas.iloc[:2].mean() if len(filas) >= 2 else 0
    m3 = filas.iloc[:3].mean() if len(filas) >= 3 else 0
    m4 = filas.iloc[:4].mean() if len(filas) >= 4 else 0
    m6 = filas.iloc[:6].mean() if len(filas) >= 6 else 0
    return (m6 * 0.05) + (m4 * 0.10) + (m3 * 0.25) + (m2 * 0.60)

# === REDONDEAR AL MÚLTIPLO MÁS CERCANO DEL ENVASE ===
def redondear_a_envase(valor, tamaño_envase):
    if tamaño_envase and tamaño_envase > 0:
        return int(round(valor / tamaño_envase) * tamaño_envase)
    return int(round(valor))

# === RESULTADOS ===
for _, row in stock_df.iterrows():
    producto = str(row["Producto"]).strip()
    if not producto or producto.lower() == "nan":
        continue

    kilos = float(row["Kilos"]) if pd.notna(row["Kilos"]) else 0.0
    fecha_raw = row["FechaIngreso"]

    # ventas del producto
    ventas_producto = ventas_pivot.loc[producto] if producto in ventas_pivot.index \
                      else pd.Series([0] * n_meses_ventas)

    venta_mensual = round(calcular_venta_mensual_proyectada(ventas_producto), 2)
    stock_min     = round(venta_mensual * 1.5, 2)

    # formatear fecha
    try:
        fecha = pd.to_datetime(fecha_raw).strftime("%d/%m/%Y") if pd.notna(fecha_raw) else ""
    except Exception:
        fecha = ""

    # === IMPRESIÓN EN FORMATO productosData ===
    linea = (
        '{producto: "' + producto + '", '
        f'ventaMensual: {venta_mensual}, '
        f'stockMinARG: {stock_min}, '
        f'kilos: {kilos}, '
        f'fechaIngreso: "{fecha}"'
        '},'
    )
    print(linea)
