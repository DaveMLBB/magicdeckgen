#!/usr/bin/env python3
"""
Script per analizzare quali colonne di mtg_cards sono vuote o poco utilizzate.
Genera un report con la percentuale di NULL per ogni colonna.
"""
import sys
from pathlib import Path

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import inspect, func
from app.database import engine, SessionLocal
from app.models import MTGCard

print("🔍 Analisi colonne tabella mtg_cards\n")

db = SessionLocal()

try:
    # Get total count
    total = db.query(func.count(MTGCard.uuid)).scalar()
    print(f"📊 Totale carte nel DB: {total:,}\n")
    
    if total == 0:
        print("⚠️  Nessuna carta nel database. Esegui prima il sync Scryfall.")
        sys.exit(0)
    
    # Get all columns
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('mtg_cards')]
    
    # Analyze each column
    results = []
    
    for col_name in columns:
        if col_name == 'id':
            continue  # Skip primary key
        
        col = getattr(MTGCard, col_name, None)
        if col is None:
            continue
        
        # Count NULL values
        null_count = db.query(func.count(MTGCard.uuid)).filter(col.is_(None)).scalar()
        
        # Count empty strings for string columns
        empty_count = 0
        try:
            empty_count = db.query(func.count(MTGCard.uuid)).filter(col == '').scalar()
        except:
            pass  # Not a string column
        
        null_or_empty = null_count + empty_count
        percentage = (null_or_empty / total * 100) if total > 0 else 0
        
        results.append({
            'column': col_name,
            'null_count': null_count,
            'empty_count': empty_count,
            'total_empty': null_or_empty,
            'percentage': percentage,
            'filled': total - null_or_empty
        })
    
    # Sort by percentage (most empty first)
    results.sort(key=lambda x: x['percentage'], reverse=True)
    
    print("=" * 80)
    print(f"{'Colonna':<30} {'Vuote':<12} {'Piene':<12} {'% Vuote':<10}")
    print("=" * 80)
    
    # Categorize columns
    always_empty = []
    mostly_empty = []
    sometimes_empty = []
    rarely_empty = []
    
    for r in results:
        status = ""
        if r['percentage'] == 100:
            status = "🔴 SEMPRE VUOTA"
            always_empty.append(r['column'])
        elif r['percentage'] >= 90:
            status = "🟠 QUASI SEMPRE VUOTA"
            mostly_empty.append(r['column'])
        elif r['percentage'] >= 50:
            status = "🟡 SPESSO VUOTA"
            sometimes_empty.append(r['column'])
        elif r['percentage'] >= 10:
            status = "🟢 RARAMENTE VUOTA"
            rarely_empty.append(r['column'])
        else:
            status = "✅ QUASI SEMPRE PIENA"
        
        print(f"{r['column']:<30} {r['total_empty']:<12,} {r['filled']:<12,} {r['percentage']:>6.1f}%  {status}")
    
    print("=" * 80)
    
    # Summary
    print("\n📋 RIEPILOGO\n")
    
    if always_empty:
        print(f"🔴 Colonne SEMPRE VUOTE ({len(always_empty)}):")
        for col in always_empty:
            print(f"   - {col}")
        print()
    
    if mostly_empty:
        print(f"🟠 Colonne QUASI SEMPRE VUOTE (≥90% NULL) ({len(mostly_empty)}):")
        for col in mostly_empty:
            print(f"   - {col}")
        print()
    
    if sometimes_empty:
        print(f"🟡 Colonne SPESSO VUOTE (50-90% NULL) ({len(sometimes_empty)}):")
        for col in sometimes_empty:
            print(f"   - {col}")
        print()
    
    print("\n💡 RACCOMANDAZIONI:\n")
    print("1. Colonne SEMPRE VUOTE → Possono essere eliminate immediatamente")
    print("2. Colonne QUASI SEMPRE VUOTE → Verificare se servono per casi edge, altrimenti eliminare")
    print("3. Colonne SPESSO VUOTE → Mantenere se usate nel codice, altrimenti considerare eliminazione")
    print()
    
    # Check if sync is needed
    synced_count = db.query(func.count(MTGCard.uuid)).filter(MTGCard.last_synced_at.isnot(None)).scalar()
    if synced_count == 0:
        print("⚠️  ATTENZIONE: Nessuna carta ha last_synced_at valorizzato!")
        print("   Il database potrebbe non essere aggiornato. Esegui: python -m app.services.scryfall_sync")
    else:
        print(f"✅ {synced_count:,} carte sincronizzate con Scryfall")
    
except Exception as e:
    print(f"\n❌ Errore: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
