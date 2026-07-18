# Smart Kitchen MVP ERD

Authentication:
- Email & Password (JWT Access + Refresh Token)
- Google Login (OAuth 2.0)

Notes:
- Password hash is NULL for Google-only accounts.
- authProvider values: local, google.
- Ingredient prices are **not** stored permanently in recipes.
- Recipe cost is calculated from the latest ingredient prices.
- Price history is stored for analytics.
- OCR receipts will populate Purchases and Purchase Items in a later sprint.
