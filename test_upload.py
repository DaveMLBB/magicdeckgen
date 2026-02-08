#!/usr/bin/env python3
import pandas as pd
import json

# Simula quello che fa il backend
df = pd.read_excel('csv carte in vendita.xlsx')

column_mapping = {'name': 'nome', 'quantity': 'quantity'}

print(f"📋 Mapping: {column_mapping}")
print(f"📋 Colonne: {df.columns.tolist()}")
print(f"📋 Totale righe: {len(df)}\n")

cards_added = 0

for idx, row in df.iterrows():
    if idx >= 5:  # Solo prime 5 per test
        break
        
    name_col = column_mapping.get('name')
    if not name_col or name_col not in df.columns:
        print(f"❌ Colonna nome '{name_col}' non trovata")
        continue
        
    name = str(row[name_col]) if pd.notna(row[name_col]) else ''
    
    if not name or name == 'nan' or name.strip() == '':
        print(f"Riga {idx}: SKIP - nome vuoto")
        continue
    
    quantity_col = column_mapping.get('quantity')
    quantity_raw = row[quantity_col] if quantity_col and quantity_col in df.columns else 1
    
    if pd.notna(quantity_raw):
        try:
            quantity = int(float(quantity_raw))
        except:
            quantity = 1
    else:
        quantity = 1
    
    print(f"Riga {idx}: ✓ {name} x{quantity}")
    cards_added += 1

print(f"\n✅ Totale: {cards_added} carte")
