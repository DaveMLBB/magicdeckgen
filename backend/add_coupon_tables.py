"""
Script per aggiungere le tabelle coupon_codes e coupon_redemptions al database
"""
from app.database import engine, Base
from app.models import CouponCode, CouponRedemption
from sqlalchemy import text

def add_coupon_tables():
    print("Creazione tabelle coupon...")
    
    # Crea le tabelle
    Base.metadata.create_all(bind=engine, tables=[
        CouponCode.__table__,
        CouponRedemption.__table__
    ])
    
    print("✓ Tabelle coupon_codes e coupon_redemptions create con successo!")
    
    # Inserisci il coupon 1000FoilWar
    from sqlalchemy.orm import Session
    db = Session(bind=engine)
    
    try:
        # Verifica se il coupon esiste già
        existing = db.execute(
            text("SELECT id FROM coupon_codes WHERE code = '1000FoilWar'")
        ).fetchone()
        
        if not existing:
            db.execute(
                text("""
                    INSERT INTO coupon_codes (code, token_amount, description, is_active, created_at)
                    VALUES ('1000FoilWar', 1000, 'Coupon promozionale 1000 token', true, NOW())
                """)
            )
            db.commit()
            print("✓ Coupon '1000FoilWar' inserito con successo!")
        else:
            print("ℹ Coupon '1000FoilWar' già esistente")
            
    except Exception as e:
        print(f"✗ Errore durante l'inserimento del coupon: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_coupon_tables()
