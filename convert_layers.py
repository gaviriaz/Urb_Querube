import geopandas as gpd
import json
import os

src_dir = r"C:\Users\AlbertG\IGGA.SAS\PERSONAL\DEV\SHEY\RENDER"
dst_dir = r"C:\Users\AlbertG\IGGA.SAS\PERSONAL\DEV\SHEY\RENDER\visualizador-3d\public\data"

files = {
    "Cotas.gpkg": "cotas.geojson",
    "Loteo.gpkg": "loteo.geojson",
    "Manzana.gpkg": "manzana.geojson",
    "predio.shp": "predio.geojson",
    "Vias.gpkg": "vias.geojson",
}

for src_name, dst_name in files.items():
    src_path = os.path.join(src_dir, src_name)
    dst_path = os.path.join(dst_dir, dst_name)
    try:
        gdf = gpd.read_file(src_path)
        print(f"{src_name}: loaded {len(gdf)} features, CRS={gdf.crs}")
        if gdf.crs is not None and gdf.crs.to_epsg() != 4326:
            gdf = gdf.to_crs(epsg=4326)
            print(f"  reprojected to EPSG:4326")
        gdf.to_file(dst_path, driver="GeoJSON")
        print(f"  -> saved to {dst_path}")
    except Exception as e:
        print(f"ERROR processing {src_name}: {e}")

print("\nDone!")
