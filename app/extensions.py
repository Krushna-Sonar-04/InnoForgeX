from flask_cors import CORS

# Instantiate extensions here — DO NOT import app here
# They get initialised inside create_app() using .init_app(app) pattern
cors = CORS()