import pdfplumber
import re

def extraer_tamanos_envases(path_pdf):
    envases = {}
    with pdfplumber.open(path_pdf) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue
            lines = text.split('\n')
            for line in lines:
                partes = line.split()
                if len(partes) < 2:
                    continue
                descripcion = ' '.join(partes[:-1])
                match = re.search(r'X\s?(\d+)', descripcion)
                if match:
                    producto = descripcion.strip()
                    tam_envase = int(match.group(1))
                    envases[producto] = tam_envase
    return envases
