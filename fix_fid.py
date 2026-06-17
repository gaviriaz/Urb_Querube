import json

loteo_path = r"C:\Users\AlbertG\IGGA.SAS\PERSONAL\DEV\SHEY\RENDER\visualizador-3d\public\data\loteo.geojson"

with open(loteo_path, 'r', encoding='utf-8') as f:
    loteo = json.load(f)

# Assign unique fid to each feature
lot_idx = 0
for feat in loteo['features']:
    props = feat['properties']
    lote = props.get('LOTE', '')
    if lote == 'REMANENTE':
        props['fid'] = -1
    else:
        props['fid'] = 1000 + lot_idx
        lot_idx += 1

with open(loteo_path, 'w', encoding='utf-8') as f:
    json.dump(loteo, f, ensure_ascii=False, indent=2)

print(f"Updated {lot_idx} lots with unique fid values")
print("Done!")
