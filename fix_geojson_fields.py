import json
import os

data_dir = r"C:\Users\AlbertG\IGGA.SAS\PERSONAL\DEV\SHEY\RENDER\visualizador-3d\public\data"

# Fix loteo.geojson: add _LABEL and _MANZANA fields
loteo_path = os.path.join(data_dir, "loteo.geojson")
with open(loteo_path, 'r', encoding='utf-8') as f:
    loteo = json.load(f)

for feat in loteo['features']:
    props = feat['properties']
    etiqueta = props.get('ETIQUETA', '')
    lote = props.get('LOTE', '')
    manzana = props.get('Manzana', '')
    
    if etiqueta and etiqueta not in ('', '0', 0):
        props['_LABEL'] = f"Lt {etiqueta}"
    elif lote and lote not in ('', 'REMANENTE'):
        props['_LABEL'] = f"Lote {lote}"
    else:
        props['_LABEL'] = f"Lote {props.get('fid', feat.get('id', '?'))}"
    
    if manzana:
        props['_MANZANA'] = manzana
    else:
        props['_MANZANA'] = ''

with open(loteo_path, 'w', encoding='utf-8') as f:
    json.dump(loteo, f, ensure_ascii=False, indent=2)
print(f"Updated loteo.geojson with _LABEL and _MANZANA")

# Fix manzana.geojson: ensure Manzana field exists
manzana_path = os.path.join(data_dir, "manzana.geojson")
with open(manzana_path, 'r', encoding='utf-8') as f:
    manzana = json.load(f)

for feat in manzana['features']:
    props = feat['properties']
    if 'Manzana' not in props or not props['Manzana']:
        # Try to find any field that looks like manzana name
        for k, v in props.items():
            if isinstance(v, str) and v.startswith('MZ-'):
                props['Manzana'] = v
                break

with open(manzana_path, 'w', encoding='utf-8') as f:
    json.dump(manzana, f, ensure_ascii=False, indent=2)
print(f"Updated manzana.geojson")

# Fix predio.geojson: ensure LOTE field exists
predio_path = os.path.join(data_dir, "predio.geojson")
with open(predio_path, 'r', encoding='utf-8') as f:
    predio = json.load(f)

for feat in predio['features']:
    props = feat['properties']
    if 'LOTE' not in props:
        props['LOTE'] = 'PREDIO'
    if 'ETIQUETA' not in props:
        props['ETIQUETA'] = 'Predio'

with open(predio_path, 'w', encoding='utf-8') as f:
    json.dump(predio, f, ensure_ascii=False, indent=2)
print(f"Updated predio.geojson")

print("\nAll GeoJSON files updated!")
