import pandas as pd

# ESTE ARCHIVO SE ENCARGA DE EXTRAER LOS PRODUCTOS DE LOS EXCELS CON SUS RESPECTIVOS DATOS DE STOCK Y VENTAS

# ---- DEFINIMOS LAS RUTAS A LOS EXCELS ----
ventas_excel = "datos/ventas.xlsx"
stock_excel  = "datos/stock.xlsx"

# ---- LEEMOS LOS DATOS DEL EXCEL DE VENTAS ----
df_ventas_raw = pd.read_excel(ventas_excel, header=None, skiprows=6) # salteo las primeras 6 filas que no contienen datos
n_meses_ventas = df_ventas_raw.shape[1] // 5 # cada bloque de 5 columnas corresponde a un mes

# LOGICA PARA EXTRAER LOS DATOS DE VENTAS Y SEPARAR EN MESES. NOTA: MES 1 CORRESPONDE A ENERO
ventas_list = []
for i in range(n_meses_ventas):
    idx = n_meses_ventas - 1 - i # mes más reciente primero
    bloque = df_ventas_raw.iloc[:, idx*5:(idx+1)*5].copy()
    bloque.columns = ["Producto", "Cantidad", "Precio", "Bruta", "Neta"]
    bloque["Mes"] = i + 1
    ventas_list.append(bloque)

ventas_df = pd.concat(ventas_list, ignore_index=True)
ventas_df["Cantidad"] = pd.to_numeric(ventas_df["Cantidad"], errors="coerce").fillna(0)
ventas_df = ventas_df[["Producto", "Cantidad", "Mes"]]

# ---- LEEMOS LOS DATOS DEL EXCEL DE STOCK ----
df_stock_raw = pd.read_excel(stock_excel, header=None, skiprows=3)
n_meses_stock = df_stock_raw.shape[1] // 7 # cada bloque de 7 columnas corresponde a un mes

# LOGICA PARA EXTRAER LOS DATOS DE STOCK Y SEPARAR EN MESES.
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
stock_df = stock_df[stock_df["Mes"] == stock_df["Mes"].max()] # solo el mes más reciente
stock_df = stock_df[["Producto", "Kilos"]]

# ---- CALCULAMOS LA VENTA MENSUAL PROYECTADA POR PRODUCTO ----
def calcular_venta_mensual_proyectada(filas):
    m2 = filas.iloc[-2:].mean() if len(filas) >= 2 else filas.mean()
    m3 = filas.iloc[-3:].mean() if len(filas) >= 3 else filas.mean()
    m4 = filas.iloc[-4:].mean() if len(filas) >= 4 else filas.mean()
    m6 = filas.iloc[-6:].mean() if len(filas) >= 6 else filas.mean()

    return (m6 * 0.05) + (m4 * 0.10) + (m3 * 0.25) + (m2 * 0.60)

ventas_pivot = (
    ventas_df
    .pivot_table(index="Producto", columns="Mes", values="Cantidad", aggfunc="sum")
    .fillna(0)
)

ventas_pivot = ventas_pivot.iloc[:, :-1] # corrección lucio

# ---- IMPRIMIMOS LOS RESULTADOS ----

for _, row in stock_df.iterrows():
    producto = str(row["Producto"]).strip()
    if not producto or producto.lower() == "nan":
        continue

    kilos = float(row["Kilos"]) if pd.notna(row["Kilos"]) else 0.0

    # ventas del producto
    ventas_producto = ventas_pivot.loc[producto] if producto in ventas_pivot.index \
                      else pd.Series([0] * n_meses_ventas)

    venta_mensual = round(calcular_venta_mensual_proyectada(ventas_producto), 2)
    stock_min = round(venta_mensual * 1.5, 2)

    # esto para imprimir en el formato correspondiente
    linea = (
        '{producto: "' + producto + '", '
        f'ventaMensual: {venta_mensual}, '
        f'stockMinARG: {stock_min}, '
        f'kilos: {kilos}'
        '},'
    )
    print(linea)
