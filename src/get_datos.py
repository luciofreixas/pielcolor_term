import os
import pandas as pd
from leer_envases import extraer_tamano_envase
import pdfplumber

# Ruta base del proyecto
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Rutas a los archivos
ventas_path = os.path.join(BASE_DIR, "datos", "ventas.xlsx")
stock_path = os.path.join(BASE_DIR, "datos", "stock.xlsx")
pdf_path = os.path.join(BASE_DIR, "datos", "stock_envases_pielcolor.pdf")

# ---------- Leer Excel de stock ----------
df_stock = pd.read_excel(stock_path, header=None).iloc[:, [0, 1]].dropna()
df_stock.columns = ["Producto", "Stock"]

# ---------- Leer PDF de envases ----------
envases_por_producto = {}
with pdfplumber.open(pdf_path) as pdf:
    for pagina in pdf.pages:
        tabla = pagina.extract_table()
        if tabla:
            for fila in tabla[1:]:
                if fila[0]:
                    descripcion = fila[0]
                    nombre_producto = " ".join(descripcion.split()[:2])
                    tamaño = extraer_tamano_envase(descripcion)
                    if tamaño:
                        envases_por_producto[nombre_producto.upper()] = tamaño

# ---------- Leer Excel de ventas ----------
df_ventas = pd.read_excel(ventas_path)
df_ventas = df_ventas.groupby("Producto")["Cantidad"].sum().reset_index()
df_ventas["VentaMensual"] = df_ventas["Cantidad"] / 6

# ---------- Generar array final ----------
print("const productosData = [")

for _, row in df_stock.iterrows():
    nombre = row["Producto"]
    kilos = float(row["Stock"])
    venta_mensual = df_ventas[df_ventas["Producto"] == nombre]["VentaMensual"]
    venta_mensual = float(venta_mensual.iloc[0]) if not venta_mensual.empty else 0.0

    stock_min = round(venta_mensual * 1.5, 2)

    # Envase
    envase = envases_por_producto.get(nombre.upper(), 1)
    kilos_redondeados = int(-(-kilos // envase)) * envase  # redondeo hacia arriba

    print(f'  {{ producto: "{nombre}", ventaMensual: {round(venta_mensual, 2)}, stockMinARG: {stock_min}, kilos: {kilos_redondeados}, fechaIngreso: "" }},')

print("];")
