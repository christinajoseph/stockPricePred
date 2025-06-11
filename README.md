Stock Price Tracker for Farming (Telangana Edition)
🌾 Project Overview
This project is a full-stack web application designed to empower farmers in Telangana, India, with real-time market intelligence. By providing up-to-date prices for major agricultural commodities from local markets (mandis), this tool helps farmers make informed decisions about when and where to sell their produce, aiming to improve their profitability.

The application features a dynamic frontend built with React that visualizes historical and predicted price trends, and a robust backend powered by Python/Flask that serves data from a live database and integrates machine learning models for price forecasting.

The initial version focuses on key crops and markets relevant to Hyderabad and the surrounding Telangana region, using live data sourced directly from the Government of India's official platforms.

🛠️ Technology Stack
Category

Technology / Library

Frontend: React.js, Recharts (for charts), Tailwind CSS (for styling)

Backend: Python, Flask

Database: SQLite (via Flask-SQLAlchemy)

ML Models: Scikit-learn (Random Forest, MLP), Joblib

Data Source: data.gov.in (AGMARKNET API)

Development: Vite.js (Frontend build tool)

✨ Features
Localized Data: Displays prices for key crops like Rice, Maize, and Cotton from markets in Telangana.

Live Data Integration: Fetches near real-time market data from the official data.gov.in API.

Interactive Charts: Visualizes historical price data using line and bar charts, allowing users to switch views.

Dynamic Filtering: Users can filter data by specific commodities and market locations.

ML-Powered Predictions: Utilizes a trained Random Forest model to predict future prices for selected commodities.

Persistent Storage: Uses an SQLite database to store and serve historical market data efficiently.

Responsive UI: Clean, modern interface that works on different screen sizes.

Setup and Installation Instructions
To get this project running locally, you will need to set up both the backend server and the frontend application.

Prerequisites:

Node.js and npm installed (for the frontend).

Python and pip installed (for the backend).

Step 1: Clone the Repository
First, clone this repository to your local machine.

git clone [https://github.com/christinajoseph/stockPricePred.git](https://github.com/christinajoseph/stockPricePred.git)
cd stockPricePred

Step 2: Backend Setup (Flask Server)
The backend is responsible for the database, machine learning models, and serving data to the frontend.

Navigate to the backend directory:

cd backend

Install Python dependencies:

pip install -r requirements.txt

Get a Government Data API Key:

Go to data.gov.in and register for a free account.
Variety-wise Daily Market Prices Data

Find and subscribe to the "Variety-wise Daily Market Prices Data of Commodity" API to get your API Key.

Open the backend/data_importer.py file and replace "YOUR_API_KEY_HERE" with the key you received.

Train the Machine Learning Models:
This script will create and save the models in a new models/ directory.

python train_model.py

Initialize the Database:
This command creates the commodities.db file and fills it with initial data.

# For Windows

set FLASK_APP=app
flask init-db

# For macOS/Linux

export FLASK_APP=app
flask init-db

Import Live Data:
pip install requests
to install in system or virtual environment: .\venv\Scripts\activate
This script fetches the latest data from the government API and populates your database.

python data_importer.py

Step 3: Frontend Setup (React App)
The frontend provides the user interface.

Navigate back to the project root directory:

# If you are in the 'backend' folder, go up one level

cd ..

Install Node.js dependencies:

npm install

▶️ How to Run the Application
You must have two separate terminals open to run both the backend and frontend servers simultaneously.

Terminal 1: Start the Backend Server

Navigate to the backend directory:

cd backend

Run the Flask application:

python app.py

The backend server will now be running at http://localhost:5000. Keep this terminal open.

Terminal 2: Start the Frontend Server

Navigate to the project root directory (stockPricePred):

cd stockPricePred

Run the Vite development server:

npm run dev

The frontend application will now be running. The terminal will show you the local URL, typically http://localhost:5173.

Access the Application:

Open your web browser and go to http://localhost:5173. You should see the Stock Price Tracker application running with live data from Telangana!

🔮 Future Improvements
Advanced ML Models: Integrate more complex "black box" models like LSTMs for potentially more accurate time-series forecasting.

User Authentication: Allow users to create accounts to save their preferred commodities, locations, or predictions.

Automated Data Fetching: Create a scheduled job (cron job) to run the data_importer.py script automatically every day.

Expanded Coverage: Add more commodities and mandis from across Telangana and other states.
