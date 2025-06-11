import pandas as pd
from app import db, PriceData, app  # Import SQLAlchemy and your model
import os

# Path to your static CSV file
CSV_PATH = os.path.join('data', 'commodity_prices.csv')

def import_from_csv():
    """Reads data from static CSV and inserts into the database."""
    
    try:
        print("Reading CSV data from:", CSV_PATH)
        df = pd.read_csv(CSV_PATH)

        if df.empty:
            print("CSV file is empty.")
            return

        with app.app_context():
            for _, row in df.iterrows():
                # Avoid duplicate entries
                exists = PriceData.query.filter_by(
                    date=row['arrival_date'],
                    commodity=row['commodity'],
                    location=row['market']
                ).first()

                if not exists:
                    new_entry = PriceData(
                        date=row['arrival_date'],
                        price=float(row['modal_price']),
                        commodity=row['commodity'],
                        location=row['market']
                    )
                    db.session.add(new_entry)
            
            db.session.commit()
            print("CSV data imported successfully.")

    except Exception as e:
        print(f"Error importing from CSV: {e}")

if __name__ == '__main__':
    import_from_csv()