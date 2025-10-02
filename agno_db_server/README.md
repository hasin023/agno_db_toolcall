## Agno DB Server

### Setup your DB

Either use a local postgres or a docker container to setup a postgres db container. From `test.sql` files, run all the code into your created db for testing purposes.For verification, do some query on your inserted db data. Now, you can use that db credentials or connection string in the web app to connect to your db from our client side app.

### Running the server

```bash
cd agno_db_server
python -m venv .agno
.\.agno\Scripts\activate
pip install -r requirements.txt
python server.py
```

Will run the FastAPI server on `http://localhost:8000`.
