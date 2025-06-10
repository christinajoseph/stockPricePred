import requests
import json
from app import db, PriceData, app  # Import db objects from your main app

# IMPORTANT: Replace with your actual API key from data.gov.in
API_KEY = "579b464db66ec23bdd000001336c816ed19940b97f6d3d7c35597854"
API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

def fetch_and_store_data():
    """Fetches data from the government API and stores it in the database."""
    
    params = {
        'api-key': API_KEY,
        'format': 'json',
        'offset': '0',
        'limit': '500', # Fetch up to 500 records
        'filters[state]': 'Telangana' # Filter for Telangana
    }

    try:
        print("Fetching data from data.gov.in API...")
        response = requests.get(API_URL, params=params)
        response.raise_for_status()  # Raises an exception for bad status codes (4xx or 5xx)
        
        data = response.json()
        records = data.get('records', [])
        
        if not records:
            print("No records found for Telangana.")
            return

        print(f"Found {len(records)} records. Processing and storing...")

        with app.app_context(): # Create an app context to interact with the database
            for record in records:
                # Check if a record with the same details already exists to avoid duplicates
                exists = PriceData.query.filter_by(
                    date=record.get('arrival_date'),
                    commodity=record.get('commodity'),
                    location=record.get('market')
                ).first()

                if not exists:
                    # Create a new PriceData object and add it to the database session
                    new_price = PriceData(
                        date=record.get('arrival_date'),
                        price=float(record.get('modal_price', 0)), # Modal price is the most frequent price
                        commodity=record.get('commodity'),
                        location=record.get('market')
                    )
                    db.session.add(new_price)
            
            # Commit all the new records to the database
            db.session.commit()
            print("Data import complete. New records have been added to the database.")

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from API: {e}")
    except json.JSONDecodeError:
        print("Error: Could not decode JSON response. The API might be down or returned invalid data.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == '__main__':
    fetch_and_store_data()