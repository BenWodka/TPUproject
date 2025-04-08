# TPU PROJECT

## Let's try to add documentation as we go

## Useful extensions for VS Code
    - Live Preview

        "Hosts a local server in your workspace for you to preview your webpages on."

## Open Source UI: https://uiverse.io/

## Local HTTPS testing
    Eventually we'll need to obtain an SSL/TLS certificate when deploying this application, but for now we can simulate HTTPS locally using mkcert.

    To set up mkcert:

    1) First install Chocolatey Package Manager:

        https://www.geeksforgeeks.org/install-chocolatey-package-on-windows/

    2) install mkcert:

            choco install mkcert

    3) Run these 2 setup commands:

        mkcert -install
        mkcert localhost

    4) You can now host Flask Apps with HTTPS locally. Run the command:

        python localHTTPStest.py

    5) Go to browser and enter:

        https://localhost:5000


## Install dependencies for application:
    pip install -r requirements.txt

## To run the endpoint and test it:
    python endpoint.py
