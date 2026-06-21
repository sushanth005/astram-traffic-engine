import os
import requests

from dotenv import load_dotenv

load_dotenv()


CLIENT_ID = os.getenv(

    "MAPMYINDIA_CLIENT_ID",

    os.getenv("MAPPLS_CLIENT_ID")

)

CLIENT_SECRET = os.getenv(

    "MAPMYINDIA_CLIENT_SECRET",

    os.getenv("MAPPLS_CLIENT_SECRET")

)


TOKEN_URL = (

    "https://outpost.mappls.com"

    "/api/security/oauth/token"

)


def get_access_token():

    payload = {

        "grant_type":

        "client_credentials",

        "client_id":

        CLIENT_ID,

        "client_secret":

        CLIENT_SECRET

    }


    response = requests.post(

        TOKEN_URL,

        data=payload

    )


    response.raise_for_status()


    token = (

        response

        .json()

        [

            "access_token"

        ]

    )


    return token