import pandas as pd
from database import SessionLocal

db = SessionLocal()

print("Sales:")
print(pd.read_sql("SELECT MIN(SalesDate) as min, MAX(SalesDate) as max FROM Sales WHERE SalesDate IS NOT NULL", db.bind))
print("")

print("Purchases (PODate):")
print(pd.read_sql("SELECT MIN(PODate) as min, MAX(PODate) as max FROM Purchases WHERE PODate IS NOT NULL", db.bind))
print("")

print("Purchases (ReceivingDate):")
print(pd.read_sql("SELECT MIN(ReceivingDate) as min, MAX(ReceivingDate) as max FROM Purchases WHERE ReceivingDate IS NOT NULL", db.bind))
print("")

print("InvoicePurchases:")
print(pd.read_sql("SELECT MIN(InvoiceDate) as min, MAX(InvoiceDate) as max FROM InvoicePurchases WHERE InvoiceDate IS NOT NULL", db.bind))
print("")
